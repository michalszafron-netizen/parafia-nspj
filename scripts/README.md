# Skrypty migracji — Parafia NSPJ Czerwionka

Dwa skrypty Pythonowe do przygotowania danych ze zescrapowanej strony
`nspjczerwionka.pl` zanim zaczniemy budować nowy CMS.

## 1. clean_texts.py — czyszczenie tekstów

Wycina powtarzającą się nawigację, banery i stopkę z każdego `index.md`.
Zostawia tylko unikalną treść danej podstrony.

Generuje:
- `Kosciol_clean/content/**/content.md` — czysty Markdown
- `Kosciol_clean/content/**/meta.json` — tytuł, typ, daty, URL-e zdjęć
- `reports/cleaning_report.json` — statystyki (input vs output linii)

**Nie wymaga internetu.** Czas: ~30 sekund.

## 2. download_gallery_images.py — dociąganie zdjęć z galerii

Czyta każdy `index.md` z folderu `Kosciol/content/galeria/`, wyciąga
URL-e zdjęć i pobiera je z żywej strony parafii.

Generuje:
- `Kosciol/content/galeria/[slug]/assets/*.jpg` — pliki obrazów
- `reports/download_report.json` — szczegółowy raport (sukcesy/porażki/URL-e)

Wymaga internetu i biblioteki `requests`. Czas: ~10–30 minut zależnie od
liczby zdjęć i prędkości łącza.

## Instalacja (jednorazowo)

```cmd
cd C:\Users\markowyy\Documents\Kosciolek\scripts
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Uruchamianie

```cmd
:: aktywuj środowisko (za każdym razem)
cd C:\Users\markowyy\Documents\Kosciolek\scripts
venv\Scripts\activate

:: 1) czyszczenie tekstów — bezpieczne, można odpalić od razu
python clean_texts.py

:: 2) dry-run pobierania — zobacz ile zdjęć by się ściągnęło, NIC nie pobiera
python download_gallery_images.py --dry-run

:: 3) pełne pobieranie zdjęć galerii
python download_gallery_images.py

:: 4) (opcjonalnie) pobierz tylko jedną galerię — test
python download_gallery_images.py --slug 100-lat-parafii-01-08-2025-r.html
```

## Po wykonaniu

W folderze `reports/` znajdziesz dwa raporty JSON:

- `cleaning_report.json` — dla każdej podstrony: czy się powiodło, ile linii
  było przed/po, ile znaleziono URL-i zdjęć, tytuł, typ strony.
- `download_report.json` — dla każdej galerii: ile zdjęć znaleziono,
  ile pobrano, ile pominięto (już są), ile padło (i dlaczego — z URL-em).

Te dwa raporty pokażą dokładnie na czym stoimy zanim ruszymy w Astro/Express.

## Wymagania

- Python 3.10+ (testowane na 3.11)
- `requests` 2.31+
- Połączenie z internetem (tylko dla skryptu pobierania)
