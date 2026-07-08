"""
clean_texts.py
==============
Czyści zescrapowane pliki index.md z powtarzającej się nawigacji,
banerów i stopki. Zostawia tylko unikalną treść każdej podstrony.

Wejście : Kosciol/content/**/index.md
Wyjście : Kosciol_clean/content/**/content.md   (czysty Markdown)
          Kosciol_clean/content/**/meta.json    (tytuł, typ, URL-e zdjęć, data)
          reports/cleaning_report.json          (statystyki)

Uruchomienie:
    python clean_texts.py

Nie wymaga połączenia z internetem ani bibliotek zewnętrznych.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Kosciol" / "content"
DST = ROOT / "Kosciol_clean" / "content"
REPORTS = ROOT / "reports"

PARISH_NAME_HINT = "Parafia Najświętszego Serca"

# Pierwszy najpewniejszy znacznik stopki – pojawia się na każdej podstronie.
PRIMARY_FOOTER_MARKER = "### Papieski Tweet"

# Awaryjne znaczniki końca treści (gdyby ktoś usunął widget Papieski Tweet).
FALLBACK_FOOTER_MARKERS = (
    "Copyright ©",
    "Jesteś naszym",
    "Korzystamy z cookies",
    "[Tech-Studio]",
)

# Pojedyncza linia w sidebarze typu:  - [Tytuł](https://www.nspjczerwionka.pl/...)
# Wyklucza linki do plików w /galerie/ (to są obrazy galerii, nie nawigacja).
INTERNAL_NAV_LINE = re.compile(
    r"^\s*-\s*\[.*?\]\(https://www\.nspjczerwionka\.pl/(?!galerie/).*?\)\s*$"
)

# Baner zdjęciowy strony głównej powtarzany na każdej podstronie
# (URL-e zaczynają się od /zm_obrazki/).
HOME_BANNER_IMG = re.compile(
    r"^\s*!\[.*?\]\(https://www\.nspjczerwionka\.pl/zm_obrazki/.*?\)\s*$"
)

# Pełnowymiarowe URL-e zdjęć z konkretnych galerii (folder /galerie/ID/).
FULL_GALLERY_IMG_URL = re.compile(
    r'https://www\.nspjczerwionka\.pl/galerie/\d+/[^)\s"]+\.(?:jpg|jpeg|png|webp)',
    re.IGNORECASE,
)

HEADING_H1 = re.compile(r"^# (?!\s*$)(.+)$")
HEADING_H2 = re.compile(r"^## (?!\s*$)(.+)$")
DATE_IN_TITLE = re.compile(r"(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})")


def find_content_start(lines: list[str]) -> int | None:
    """Pierwszy nagłówek, który nie jest nazwą parafii."""
    for i, line in enumerate(lines):
        m = HEADING_H1.match(line.strip())
        if m and PARISH_NAME_HINT not in m.group(1):
            return i
    # Fallback: ## po pierwszych kilku linijkach
    for i, line in enumerate(lines):
        if i < 5:
            continue
        m = HEADING_H2.match(line.strip())
        if m and PARISH_NAME_HINT not in m.group(1):
            return i
    return None


def find_content_end(lines: list[str], start: int) -> int:
    """Znajduje koniec treści – preferuje 'Papieski Tweet', potem fallbacki."""
    for i in range(start + 1, len(lines)):
        if lines[i].strip().startswith(PRIMARY_FOOTER_MARKER):
            return i
    for i in range(start + 1, len(lines)):
        s = lines[i].strip()
        for marker in FALLBACK_FOOTER_MARKERS:
            if marker in s:
                return i
    return len(lines)


def clean_content_lines(lines: list[str]) -> list[str]:
    """Odsiewa powtórzoną nawigację i banery, zwija ciągi pustych linii."""
    kept: list[str] = []
    for ln in lines:
        s = ln.strip()
        if INTERNAL_NAV_LINE.match(s):
            continue
        if HOME_BANNER_IMG.match(s):
            continue
        kept.append(ln)

    # Zwiń ciągi pustych linii do maks. 2.
    compacted: list[str] = []
    blanks = 0
    for ln in kept:
        if not ln.strip():
            blanks += 1
            if blanks <= 2:
                compacted.append("")
        else:
            blanks = 0
            compacted.append(ln)
    # Strip leading/trailing blanks
    while compacted and not compacted[0].strip():
        compacted.pop(0)
    while compacted and not compacted[-1].strip():
        compacted.pop()
    return compacted


def detect_page_type(rel_path: Path) -> str:
    parts = rel_path.parts
    if not parts:
        return "other"
    head = parts[0]
    if head in {
        "galeria",
        "aktualnosci",
        "duszpasterstwo",
        "grupy-parafialne",
        "cmentarz",
        "wycieczka",
    }:
        return head
    if head in {"home", "start.html", "index.php"}:
        return "home"
    if head.startswith("historia"):
        return "historia"
    if head.startswith("kontakt"):
        return "kontakt"
    if head.startswith("kalendarz"):
        return "kalendarz"
    if head.startswith("ogloszenia-duszpasterskie"):
        return "ogloszenia-duszpasterskie"
    if head.startswith("inne"):
        return "inne"
    return "other"


def extract_title(content_lines: list[str]) -> str | None:
    for ln in content_lines:
        m = HEADING_H1.match(ln.strip())
        if m:
            return m.group(1).strip()
    for ln in content_lines:
        m = HEADING_H2.match(ln.strip())
        if m:
            return m.group(1).strip()
    return None


def normalize_image_url(url: str) -> str:
    """Zamienia URL miniaturki (mini...) na pełnowymiarowy, jeśli to możliwe."""
    parts = url.rsplit("/", 1)
    if len(parts) == 2 and parts[1].lower().startswith("mini"):
        return parts[0] + "/" + parts[1][4:]
    return url


def extract_gallery_image_urls(full_text: str) -> list[str]:
    raw = set(FULL_GALLERY_IMG_URL.findall(full_text))
    normalized = {normalize_image_url(u) for u in raw}
    return sorted(normalized)


def process_file(src_md: Path) -> dict:
    rel = src_md.relative_to(SRC).parent
    raw = src_md.read_text(encoding="utf-8", errors="replace")
    lines = raw.split("\n")

    start = find_content_start(lines)
    if start is None:
        return {
            "path": str(rel).replace("\\", "/"),
            "status": "no_title_found",
            "input_lines": len(lines),
            "output_lines": 0,
            "title": None,
            "page_type": detect_page_type(rel),
            "gallery_image_count": 0,
        }

    end = find_content_end(lines, start)
    content = clean_content_lines(lines[start:end])
    title = extract_title(content)
    page_type = detect_page_type(rel)
    gallery_urls = extract_gallery_image_urls(raw)

    date_match = None
    if title:
        m = DATE_IN_TITLE.search(title)
        if m:
            date_match = m.group(1)

    dst_dir = DST / rel
    dst_dir.mkdir(parents=True, exist_ok=True)

    (dst_dir / "content.md").write_text(
        "\n".join(content).rstrip() + "\n", encoding="utf-8"
    )
    meta = {
        "title": title,
        "page_type": page_type,
        "date_in_title": date_match,
        "source_path": str(rel).replace("\\", "/"),
        "gallery_image_count": len(gallery_urls),
        "gallery_image_urls": gallery_urls,
    }
    (dst_dir / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    return {
        "path": str(rel).replace("\\", "/"),
        "status": "ok",
        "title": title,
        "page_type": page_type,
        "input_lines": len(lines),
        "output_lines": len(content),
        "gallery_image_count": len(gallery_urls),
    }


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Brak folderu źródłowego: {SRC}")
    DST.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)

    files = sorted(SRC.rglob("index.md"))
    print(f"Znaleziono {len(files)} plików index.md")
    print(f"Cel:       {DST}")
    print("-" * 80)

    results = []
    ok = 0
    skipped = 0
    for f in files:
        r = process_file(f)
        results.append(r)
        if r["status"] == "ok":
            ok += 1
            title = (r["title"] or "")[:50]
            print(
                f"  OK   {r['path']:<55} | {r['input_lines']:4} -> "
                f"{r['output_lines']:4} | foto: {r['gallery_image_count']:3} | {title}"
            )
        else:
            skipped += 1
            print(f"  SKIP {r['path']:<55} | {r['status']}")

    report = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "source_dir": str(SRC),
        "output_dir": str(DST),
        "total_files": len(files),
        "ok": ok,
        "skipped": skipped,
        "results": results,
    }
    (REPORTS / "cleaning_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("-" * 80)
    print(f"Gotowe.  OK: {ok}  Pominięte: {skipped}  Łącznie: {len(files)}")
    print(f"Raport:  reports/cleaning_report.json")


if __name__ == "__main__":
    main()
