# Projekt: Nowa strona + CMS dla Parafii NSPJ Czerwionka-Leszczyny

**Status na dzień:** 14 maja 2026
**Właściciel projektu:** Marek
**Klient demo:** Michał (manager) → docelowo ks. Tomasz Żołna (proboszcz)
**Stara strona:** https://www.nspjczerwionka.pl/
**Pakiet docelowy:** Pakiet 1 (wg ustaleń w PDF od księdza) — strona + prosty CMS redakcyjny

---

## 1. Czym jest ten projekt

Parafia NSPJ Czerwionka-Leszczyny ma stronę z 2010 roku, opartą o stary
CMS (Tech-Studio). Zlecenie obejmuje:

1. **Nowy landing + podstrony** w nowoczesnej stylistyce, ale z zachowaniem
   powagi kościelnej.
2. **Panel administracyjny** prosty na tyle, żeby ksiądz proboszcz sam
   dodawał ogłoszenia, aktualności, zdjęcia.
3. **Migracja treści** ze starej strony (132 podstron, kilkanaście tysięcy
   linii ogłoszeń archiwalnych, 50+ galerii).

W przyszłości — opcjonalnie pakiety 2 i 3 (parafianie, sakramenty, cmentarz).
Teraz: tylko pakiet 1.

## 2. Co już zrobione

### ✅ Etap 0 — analiza danych
- Przeanalizowano dwa PDF-y z założeniami klienta (Pakiety 1/2/3, struktura CMS)
- Przeskanowano cały scrape starej strony (132 podstrony, ~2800 plików assetów)
- Zidentyfikowano braki danych (17 galerii bez zdjęć w MD)

### ✅ Etap 1 — migracja treści (skrypty Python)
- **`scripts/clean_texts.py`** — wycina powtarzającą się nawigację i stopkę
  ze 132 plików `index.md`, zostawia tylko unikalną treść każdej podstrony.
  Generuje czyste `content.md` + `meta.json` per-strona.
  - Wynik: **130 z 132 stron** oczyszczone OK (2 edge case'y do pominięcia)
  - Czas wykonania: ~30 sekund
- **`scripts/download_gallery_images.py`** — pobiera oryginalne zdjęcia
  z żywej strony nspjczerwionka.pl, normalizuje URL-e (mini→full),
  rate-limited, retries, raportowanie.
  - Wynik: **244 zdjęcia, 0 błędów, 70.6 MB** w 107 sekund
  - 32 z 49 galerii mają komplet zdjęć
  - **17 galerii pustych** — wymagają od księdza (zob. sekcja „Braki danych")
- Raporty: `reports/cleaning_report.json`, `reports/download_report.json`

### ✅ Etap 2 — demo UI (landing + panel)

Folder `demo-parafia-v2/` zawiera kompletną wersję pokazową
**bez backendu** (UI mock do prezentacji klientowi).

Stylistyka: **Koncepcja 2 — „Wspólnotowa karta"**
- paleta: beż `#f4ede0`, bordo `#7a1f2b`, miedź `#b87a4a`, czerń `#2b2520`
- typografia: Playfair Display (nagłówki) + Lato (treść), Google Fonts
- ton: ciepły, wspólnotowy, „kościół dla ludzi"

Zawartość:
- **Strona publiczna** (3 ekrany): `index.html` (kompletny landing),
  `strony/historia.html`, `strony/kontakt.html`
- **Panel admina** (8 ekranów): login, pulpit, aktualności (lista),
  aktualności (edycja z drag&drop), ogłoszenia (edytor + PDF/Word),
  galeria (siatka kart), intencje (kalendarz tygodniowy), ustawienia
- **`build.py`** — kopiuje 18 prawdziwych zdjęć z parafii do folderu publicznego
- **`README.md`** — instrukcja dla osoby przekazującej demo klientowi

## 3. Co jeszcze do zrobienia

### Krótkoterminowo (przed pokazem Michałowi)
- [ ] Poprawki kosmetyczne po feedbacku Marka (po obejrzeniu demo)
- [ ] Deploy demo na Netlify drag-and-drop → publiczny link do wysłania

### Średnioterminowo (po akceptacji wizualnej)
- [ ] Decyzja: hosting własny VPS czy Netlify + Render?
- [ ] Postawienie środowiska (Ubuntu + Nginx + PM2 + Let's Encrypt)
- [ ] Budowa backendu (Astro frontend + Express + SQLite ≈ 3–4 tygodnie pracy)
- [ ] Migracja oczyszczonych treści do bazy danych
- [ ] Szkolenie księdza (1–2 godziny zdalnie)

### Do dopytania księdza
- [ ] **17 galerii bez zdjęć** — czy ksiądz ma oryginały na telefonie/dysku?
  Lista: bierzmowanie (2 wersje), boze-cialo-2025, czas-na-wieze-pazdziernik,
  intencje-mszalne-2024, pozegnanie-ks-antoniego, projekt-noca,
  swieto-ministrantow, wycieczka, zielono i 6 innych z `foto: 0` w raporcie
- [ ] Domena: zachować `nspjczerwionka.pl` czy nowa?
- [ ] Hosting: chce zostać na obecnym? Czy zlecić utrzymanie nam?
- [ ] Integracje na przyszłość: SMS przypomnień, intencje online (pakiet 2+)

## 4. Struktura repozytorium

```
C:\Users\markowyy\Documents\Kosciolek\
│
├── PROJEKT_STATUS.md            ← TEN PLIK
├── Prompt.md                    ← oryginalny prompt scrape'u
├── Parafie - założenia projektu.pdf  ← założenia klienta (Pakiety 1/2/3)
├── Struktura CMS - parafie.pdf  ← struktura menu CMS od księdza
│
├── Kosciol/                     ← ZESCRAPOWANA STARA STRONA (źródło danych)
│   ├── README.md                ← opis scrape'u (132 strony, 2788 assetów)
│   ├── site-map.json            ← drzewo URL-i strony
│   ├── manifest.json            ← podsumowanie scrape'u
│   ├── discovered-urls.json     ← wszystkie znalezione URL-e
│   └── content/                 ← jeden folder per-podstrona
│       ├── home/                ← główna
│       ├── historia.html/       ← treść MD + assets/
│       ├── galeria/             ← 49 galerii, każda jako podfolder
│       ├── aktualnosci/         ← podstrony aktualności
│       ├── duszpasterstwo/      ← msze, sakramenty, kancelaria
│       ├── grupy-parafialne/    ← rada, ministranci, schola itd.
│       ├── cmentarz/            ← lista grobów (pakiet 3)
│       ├── ogloszenia-duszpasterskie--str-1..28.html/  ← 28 stron archiwum
│       └── (~120 innych podstron)
│
├── Kosciol_clean/               ← TREŚCI PO OCZYSZCZENIU (wynik clean_texts.py)
│   └── content/
│       └── (130 par plików content.md + meta.json gotowych do importu)
│
├── scripts/                     ← SKRYPTY MIGRACJI
│   ├── clean_texts.py           ← czyszczenie 132 plików MD
│   ├── download_gallery_images.py  ← pobieranie zdjęć galerii
│   ├── requirements.txt         ← tylko `requests`
│   ├── README.md                ← instrukcja obsługi skryptów
│   └── venv/                    ← wirtualne środowisko Pythona
│
├── reports/                     ← RAPORTY PO MIGRACJI
│   ├── cleaning_report.json     ← 130 OK / 2 skip
│   ├── download_report.json     ← 244 pliki / 70.6 MB / 0 błędów
│   └── download_report_dry.json ← dry-run przed pobieraniem
│
└── demo-parafia-v2/             ← DEMO UI (do pokazania klientowi)
    ├── index.html               ← landing
    ├── strony/                  ← historia + kontakt
    ├── admin/                   ← panel administracyjny (8 ekranów)
    ├── public/img/              ← zdjęcia kopiowane przez build.py
    ├── build.py                 ← skrypt do uruchomienia raz przed demo
    └── README.md                ← instrukcja dla osoby pokazującej
```

## 5. Stack techniczny (planowany dla produkcji)

**Zdecydowane (po rozmowie z Markiem):**
- Hosting: **własny VPS** (Hetzner CX22 lub podobny, ~5 €/m-c)
- System: Ubuntu 22.04 LTS, Nginx, PM2 dla procesu Node, Let's Encrypt
- Frontend: **Astro** (SSG, generuje statyczne HTML przy buildzie)
- Backend admina: **Express + better-sqlite3** (mały serwis pod `/admin`
  i `/api`, reszta publiczna ze statycznego buildu)
- Baza danych: **SQLite** w pliku, tryb WAL (czytanie w trakcie zapisu)
- Storage zdjęć: lokalny folder na VPS, backup do Hetzner Storage Box

**Architektura multi-tenancy:**
- Na start: pełna izolacja per-parafia (osobny folder + osobny proces PM2
  + osobna baza SQLite + osobna subdomena/domena w Nginx). Pozwala hostować
  5–10 parafii na jednym VPS-ie za ~50 gr–1 zł kosztu twardego.
- Po >20 parafiach: rozważyć migrację do trybu wspólnej aplikacji
  z tenant_id w bazie.

**Model abonamentowy** (zgodny z PDF od księdza):
- W abonamencie: hosting, backupy, SSL, aktualizacje, podstawowe wsparcie
- Płatne jednorazowo: uruchomienie, konfiguracja parafii, szkolenie
- On-top: import starych danych, digitalizacja papierów, mapowanie GIS,
  konfiguracja płatności/SMS, migracja starej strony, niestandardowe integracje

## 6. Stan danych źródłowych

### Co mamy z migracji:
- **130 oczyszczonych plików treści** w `Kosciol_clean/content/`
  (każdy ma `content.md` + `meta.json` z tytułem, typem strony, datą,
  URL-ami zdjęć)
- **244 oryginalne zdjęcia** z 32 galerii w `Kosciol/content/galeria/*/assets/`
- **Pełna struktura nawigacji** w `site-map.json`
- **28 stron archiwum ogłoszeń duszpasterskich** (każda ~270 linii treści)
- **Historia parafii** (kompletna, 1898→2025)
- **Dane parafii**: NIP, REGON, numery kont, kontakty, godziny kancelarii

### Braki danych do uzupełnienia od księdza:
- **17 galerii** bez zdjęć — Firecrawl nie złapał miniaturek dla:
  bierzmowanie 2025 (×2), boze-cialo-2025-r, czas-na-wieze-pazdziernik-2025,
  intencje-mszalne-ad-2024, pozegnanie-ks-proboszcza-antoniego-szczypki,
  projekt-noca, swieto-ministrantow, wycieczka, zielono,
  1-08-2025-100-lat-parafii (alternatywna wersja), 6 innych
- **Wirtualna wycieczka 360°** (Panotour) — nie zmigrujemy w czystym Astro,
  trzeba albo wyciąć tę funkcjonalność albo wrzucić jako iframe do osobnego
  pliku statycznego
- **Pakiet 2/3** (lista parafian, sakramenty, cmentarz) — świadomie nie
  ruszamy, to inny zakres

## 7. Kluczowe pliki — szybka mapa

| Plik | Co to jest |
|------|------------|
| `Parafie - założenia projektu.pdf` | **Kontrakt funkcjonalny** od księdza — co ma być, czego nie ma, podział na pakiety, model rozliczeń |
| `Struktura CMS - parafie.pdf` | Struktura menu admina (Dashboard, Strona WWW, Wspólnota, Raporty, Ustawienia) |
| `Kosciol/README.md` | Opis scrape'u Firecrawlem (data, liczby) |
| `scripts/clean_texts.py` | Oczyszczanie MD, gotowe do ponownego uruchomienia |
| `scripts/download_gallery_images.py` | Pobieranie zdjęć, idempotentne (skip istniejące) |
| `reports/cleaning_report.json` | Lista 132 stron + status oczyszczania |
| `reports/download_report.json` | 49 galerii × ile zdjęć znaleziono/pobrano/padło |
| `demo-parafia-v2/README.md` | Jak pokazać demo klientowi (2-minutowy quickstart) |
| `demo-parafia-v2/index.html` | Wzorzec wizualny — wszystkie kolory, typografia, komponenty UI |
| `demo-parafia-v2/admin/assets/admin.css` | Współdzielony CSS panelu — design tokens |

## 8. Jak ktoś z zewnątrz może wejść w projekt

**Wymagania:** Python 3.10+, przeglądarka, opcjonalnie Node.js (na etapie
budowy backendu).

**Pierwsze 10 minut — orientacja:**
1. Przeczytać `Parafie - założenia projektu.pdf` (15 min) — zrozumieć
   pakiety i model rozliczeń
2. Otworzyć `demo-parafia-v2/index.html` w przeglądarce — zobaczyć
   końcowy efekt wizualny
3. Otworzyć `demo-parafia-v2/admin/login.html` → kliknąć „Zaloguj się" →
   przeklikać panel admina

**Pierwsza godzina — wgryzienie się:**
1. Odpalić skrypty migracji ponownie żeby zobaczyć jak działają:
   ```cmd
   cd scripts
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python clean_texts.py        # ponownie oczyści (idempotentne)
   python download_gallery_images.py --dry-run    # zobaczy co by pobrał
   ```
2. Otworzyć `reports/cleaning_report.json` i `reports/download_report.json`
   — zobaczyć faktyczne dane i braki
3. Przejrzeć kilka plików `Kosciol_clean/content/*/content.md` (np. historia,
   msze-swiete, kancelaria) — to są dane do importu do nowego CMS

**Następny krok — start produkcji:**
1. Wybrać hosting (rekomendacja: Hetzner CX22, ~5 €/m-c)
2. Postawić Astro z plikami z `Kosciol_clean/content/` jako Markdown collections
3. Zbudować Express + SQLite admin pod `/admin`
4. Połączyć obie warstwy przez Nginx jako reverse proxy

## 9. Decyzje już podjęte

- ✅ Stylistyka: Koncepcja 2 „Wspólnotowa karta" (nie 1 „Sakralny minimalizm",
  nie 3 „Wieża i światło")
- ✅ Hosting: własny VPS (nie Netlify, nie Render — kontrola + abonament
  utrzymaniowy dla parafii)
- ✅ Stack: Astro (SSG) + Express + SQLite (multi-tenancy przez izolację folderów)
- ✅ Domena admina: `/admin` jako podścieżka, nie subdomena
- ✅ Format treści: Markdown w plikach + metadane JSON

## 10. Decyzje do podjęcia / otwarte pytania

- ❓ Czy ksiądz chce zostać przy domenie `nspjczerwionka.pl` (zalecane —
  przepiąć rekord A na nasz VPS), czy wymyśla nową?
- ❓ Czy chce abonament utrzymaniowy z naszej strony, czy tylko jednorazowe
  wdrożenie i zostawia parafii?
- ❓ Co z wirtualną wycieczką 360° z Panotour — wycinamy całkowicie czy
  zostawiamy jako oddzielny iframe?
- ❓ Czy dwie różne grupy „bierzmowanie 2025" w galerii to dwa różne wydarzenia
  czy duplikat? Ksiądz powinien zdecydować, którą zostawiamy.
- ❓ Migracja archiwum 28 stron ogłoszeń duszpasterskich — paginujemy
  jak teraz czy robimy nieskończony scroll z filtrem dat?

## 11. Kontakt / namiary

- **Stara strona produkcyjna:** https://www.nspjczerwionka.pl/
- **Parafia (adres):** ul. 3-go Maja 36, 44-230 Czerwionka-Leszczyny
- **Telefon parafii:** 32 43 12 992
- **Proboszcz:** ks. Tomasz Żołna (od 9 czerwca 2024 r.)
- **Inspiracje wizualne od księdza:**
  - https://www.duch-tychy.pl/
  - https://archidiecezjakatowicka.pl/
- **Dostęp do Parochialis (stary system, do migracji pakietu 2+):**
  zoltomek@gmail.com / Merenptah2024 (z PDF od księdza)

---

## Zmiany w tym pliku

| Data | Co zmieniono |
|------|--------------|
| 14.05.2026 | Pierwsza wersja — etap 0, 1, 2 ukończone, demo gotowe do pokazu |
