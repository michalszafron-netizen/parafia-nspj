"""
download_gallery_images.py
==========================
Pobiera oryginalne zdjęcia z każdej galerii (foldery Kosciol/content/galeria/*/)
bezpośrednio ze strony nspjczerwionka.pl.

Strategia:
1. Czyta każdy plik index.md w folderze galerii.
2. Wyciąga URL-e zdjęć z domeny nspjczerwionka.pl/galerie/ID/...
3. Miniaturki (nazwy zaczynające się od 'mini') zamienia na pełnowymiarowe.
4. Pobiera pliki do  Kosciol/content/galeria/[slug]/assets/
5. Pomija pliki już pobrane.
6. Limit szybkości ~2.5 żądania/s, 3 próby na URL, exponential backoff.
7. Generuje szczegółowy raport.

Najpierw sprawdza, czy strona w ogóle odpowiada (HEAD na stronę główną).

Uruchomienie:
    python download_gallery_images.py            # tryb pełny
    python download_gallery_images.py --dry-run  # bez pobierania, tylko zliczanie
    python download_gallery_images.py --slug 100-lat-parafii-01-08-2025-r.html
        # tylko jedna galeria

Wymaga:  pip install requests
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote, urlparse

try:
    import requests
except ImportError:
    sys.exit(
        "Brak biblioteki 'requests'. Zainstaluj: pip install -r requirements.txt"
    )

ROOT = Path(__file__).resolve().parent.parent
GALLERY_SRC = ROOT / "Kosciol" / "content" / "galeria"
REPORTS = ROOT / "reports"

SITE_BASE = "https://www.nspjczerwionka.pl/"

GALLERY_URL_RE = re.compile(
    r'https://www\.nspjczerwionka\.pl/galerie/\d+/[^)\s"]+\.(?:jpg|jpeg|png|webp)',
    re.IGNORECASE,
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; ParafiaMigrator/1.0; "
        "migration of nspjczerwionka.pl to new CMS)"
    ),
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
    "Referer": "https://www.nspjczerwionka.pl/",
}

RATE_LIMIT_SEC = 0.4
TIMEOUT = 30
MAX_RETRIES = 3


def check_site_alive(session: requests.Session) -> tuple[bool, str]:
    try:
        r = session.get(SITE_BASE, headers=HEADERS, timeout=15, allow_redirects=True)
        if r.status_code == 200:
            return True, f"OK (HTTP 200, {len(r.content)} B)"
        return False, f"HTTP {r.status_code}"
    except requests.RequestException as e:
        return False, str(e)


def normalize_image_url(url: str) -> str:
    base, name = url.rsplit("/", 1)
    if name.lower().startswith("mini"):
        return base + "/" + name[4:]
    return url


def extract_full_size_urls(md_text: str) -> list[str]:
    raw = set(GALLERY_URL_RE.findall(md_text))
    full = {normalize_image_url(u) for u in raw}
    return sorted(full)


def safe_filename(url: str) -> str:
    name = unquote(urlparse(url).path.rsplit("/", 1)[-1])
    name = re.sub(r"[^\w\-.]+", "_", name)
    if not name or name == "_":
        name = hashlib.md5(url.encode()).hexdigest() + ".jpg"
    return name


def download_one(
    session: requests.Session, url: str, dst: Path
) -> tuple[bool, str | None, int]:
    last_err: str | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = session.get(url, headers=HEADERS, timeout=TIMEOUT, stream=True)
            if r.status_code == 200:
                tmp = dst.with_suffix(dst.suffix + ".part")
                size = 0
                with open(tmp, "wb") as f:
                    for chunk in r.iter_content(8192):
                        if chunk:
                            f.write(chunk)
                            size += len(chunk)
                tmp.replace(dst)
                return True, None, size
            last_err = f"HTTP {r.status_code}"
            if r.status_code in (404, 410):
                break  # nie ma sensu retry'ować na 404
        except requests.RequestException as e:
            last_err = f"{type(e).__name__}: {e}"
        # exponential backoff
        time.sleep(1.5 ** attempt)
    return False, last_err, 0


def process_gallery(
    slug: str, md_path: Path, session: requests.Session, dry_run: bool
) -> dict:
    md = md_path.read_text(encoding="utf-8", errors="replace")
    urls = extract_full_size_urls(md)
    assets_dir = md_path.parent / "assets"
    if not dry_run:
        assets_dir.mkdir(parents=True, exist_ok=True)

    report = {
        "slug": slug,
        "found_urls": len(urls),
        "downloaded": 0,
        "skipped_existing": 0,
        "failed": 0,
        "failures": [],
        "total_bytes": 0,
    }

    for url in urls:
        fname = safe_filename(url)
        dst = assets_dir / fname
        if dst.exists() and dst.stat().st_size > 0:
            report["skipped_existing"] += 1
            continue
        if dry_run:
            continue
        ok, err, size = download_one(session, url, dst)
        if ok:
            report["downloaded"] += 1
            report["total_bytes"] += size
        else:
            report["failed"] += 1
            report["failures"].append({"url": url, "error": err})
        time.sleep(RATE_LIMIT_SEC)

    return report


def fmt_bytes(n: int) -> str:
    if n < 1024:
        return f"{n} B"
    if n < 1024 ** 2:
        return f"{n / 1024:.1f} KB"
    if n < 1024 ** 3:
        return f"{n / 1024 ** 2:.1f} MB"
    return f"{n / 1024 ** 3:.2f} GB"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Pobiera oryginalne zdjęcia galerii ze strony parafii."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Bez pobierania – tylko zliczy ile zdjęć trzeba dociągnąć.",
    )
    parser.add_argument(
        "--slug",
        type=str,
        default=None,
        help="Pobierz tylko jedną wskazaną galerię (nazwa folderu).",
    )
    args = parser.parse_args()

    if not GALLERY_SRC.exists():
        sys.exit(f"Brak folderu z galeriami: {GALLERY_SRC}")

    REPORTS.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    print("Sprawdzam dostępność strony nspjczerwionka.pl ...")
    alive, msg = check_site_alive(session)
    print(f"  -> {msg}")
    if not alive and not args.dry_run:
        sys.exit(
            "Strona nieosiągalna. Spróbuj później lub uruchom z --dry-run, "
            "żeby tylko zobaczyć ile zdjęć by zostało pobranych."
        )

    gallery_md = sorted(GALLERY_SRC.glob("*/index.md"))
    if args.slug:
        gallery_md = [m for m in gallery_md if m.parent.name == args.slug]
        if not gallery_md:
            sys.exit(f"Nie znalazłem galerii o slug='{args.slug}'.")

    print(f"\nDo przetworzenia: {len(gallery_md)} galerii")
    if args.dry_run:
        print("Tryb: DRY-RUN (bez pobierania)\n")
    else:
        print(f"Limit: ~{1/RATE_LIMIT_SEC:.1f} żądań/s\n")
    print("-" * 80)

    results = []
    total_downloaded = 0
    total_failed = 0
    total_found = 0
    total_bytes = 0
    started = time.time()

    for md in gallery_md:
        slug = md.parent.name
        r = process_gallery(slug, md, session, args.dry_run)
        results.append(r)
        total_downloaded += r["downloaded"]
        total_failed += r["failed"]
        total_found += r["found_urls"]
        total_bytes += r["total_bytes"]
        print(
            f"  {slug:<55} | znalezione: {r['found_urls']:3} | "
            f"pobrane: {r['downloaded']:3} | pominięte: {r['skipped_existing']:3} | "
            f"błędy: {r['failed']:3}"
        )

    elapsed = time.time() - started
    summary = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "dry_run": args.dry_run,
        "total_galleries": len(gallery_md),
        "total_urls_found": total_found,
        "total_downloaded": total_downloaded,
        "total_failed": total_failed,
        "total_bytes": total_bytes,
        "elapsed_seconds": round(elapsed, 1),
        "results": results,
    }
    suffix = "_dry" if args.dry_run else ""
    out = REPORTS / f"download_report{suffix}.json"
    out.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    print("-" * 80)
    print("PODSUMOWANIE")
    print(f"  Galerie:           {len(gallery_md)}")
    print(f"  Znalezione URL-e:  {total_found}")
    print(f"  Pobrane pliki:     {total_downloaded}")
    print(f"  Nieudane:          {total_failed}")
    print(f"  Łącznie danych:    {fmt_bytes(total_bytes)}")
    print(f"  Czas:              {elapsed:.1f} s")
    print(f"  Raport:            {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
