# Parafia Czerwionka - Global Design System

To jest główne źródło prawdy (Master File) dla interfejsu użytkownika i doświadczeń (UI/UX) na stronie Parafii pw. Najświętszego Serca Pana Jezusa.

## 1. Koncepcja i Styl (Design Concept)
**Słowa kluczowe:** Elegancki, Tradycyjny, Społecznościowy, Godny, Czytelny.
**Opis:** Styl łączy tradycję z nowoczesnością. Opiera się na stonowanych, głębokich kolorach odzwierciedlających powagę miejsca (burgund, miedź) oraz dużej ilości przestrzeni (Negative Space), która ułatwia skupienie na treści. 

## 2. Paleta Kolorów (Color Palette)

Kolorystyka opiera się na wyważonym kontraście między ciepłym beżem a głęboką czerwienią.
- **Primary (Główny):** Burgund (`#7a1f2b`) – Używany do kluczowych przycisków, głównych nagłówków i akcentów.
- **Primary Dark:** Ciemny Burgund (`#5e1620`) – Używany dla paska górnego (Topbar) i stanów `:hover` dla przycisków.
- **Secondary (Pomocniczy):** Miedź (`#b87a4a`) / Jasna Miedź (`#d6a572`) – Używany dla dat, metadanych, ikon, małych nagłówków (eyebrows).
- **Backgrounds (Tła):**
  - **Base:** Beż (`#f4ede0`) – Główne tło strony.
  - **Surface:** Kremowy (`#faf6ee`) – Tło dla kart, sekcji informacyjnych i nagłówka.
  - **Surface Deep:** Głęboki Beż (`#ebe1cd`) – Tła zastępcze dla zdjęć, obszary wyróżnione.
- **Text & Lines:**
  - **Ink (Tekst główny):** Głęboki grafit (`#2b2520`).
  - **Ink Soft (Tekst poboczny):** Stonowany szary/brąz (`#5a5048`).
  - **Line (Bordery):** Zgaszony beż (`#d8cdb6`).

## 3. Typografia (Typography)

Dobór czcionek ma na celu zapewnienie elegancji w nagłówkach i maksymalnej czytelności w tekście długim.
- **Display / Nagłówki (H1, H2, H3):** `Cormorant Garamond` (szeryfowa). Waga: `600` (Semi-bold).
  - *Zastosowanie:* Tytuły stron, nazwa parafii, cytaty.
- **Body / Tekst główny:** `Lato` (bezszeryfowa). Wagi: `300` (Light), `400` (Regular), `700` (Bold).
  - *Zastosowanie:* Treść artykułów, nawigacja, stopka, małe napisy (eyebrow).

## 4. Zasady UX i Mikrointerakcje (Interaction & UX)

- **Przyciski i Linki (Buttons & Links):**
  - Wszystkie interaktywne elementy muszą posiadać kursor `pointer`.
  - Płynne przejścia dla przycisków: `transition: all 0.15s ease`.
  - Po najechaniu (Hover): Lekkie uniesienie przycisku (`transform: translateY(-1px)`) lub zmiana tła (np. dla kart ogłoszeń: uniesienie o `-3px` i cień `box-shadow`).
- **Karty informacyjne (Pills & Cards):**
  - Zawsze posiadają wyraźny `border` (1px solid var(--line)) oraz lekko zaokrąglone rogi (`border-radius: 8px`).
  - Efekt najechania nie może powodować "skakania" sąsiadujących elementów (Layout Shift).

## 5. Dostępność (Accessibility - A11y)

Grupa docelowa obejmuje osoby w każdym wieku, dlatego dostępność jest priorytetem:
- **Kontrast:** Teksty główne (`#2b2520`) na jasnym tle (`#f4ede0`) spełniają normę WCAG AAA. Należy bezwzględnie unikać jasnoszarych tekstów.
- **Wielkość czcionek:** Bazowy rozmiar tekstu nie może być mniejszy niż `16px` (lub używamy responsywnych jednostek `rem`).
- **Ikony:** Wszystkie ikony (SVG) powinny mieć spójny rozmiar (zazwyczaj `16x16` dla tekstu lub `24x24` dla kart) i dodany atrybut `aria-hidden="true"`, jeśli pełnią rolę dekoracyjną. Nie używamy emoji zamiast ikon.

## 6. Struktura Siatki i Layout (Layout)

- **Max Width:** Szerokość głównego kontenera to `1240px` z marginesami wewnętrznymi (padding) minimum `24px`.
- **Nawigacja na mobile:** Zawsze chowamy głowne menu do tzw. "hamburgera" dla ekranów poniżej `980px`.
- **Zasada "Negative Space":** Między sekcjami zachowujemy wyraźny odstęp (`padding: 70px 0`), aby strona mogła "oddychać". Na urządzeniach mobilnych zmniejszamy do `50px`.

## Anti-Wzorce (Czego absolutnie unikać)
- Używania pstrokatych kolorów spoza palety (żółty, jaskrawy niebieski).
- Łączenia więcej niż dwóch rodzajów krojów pisma.
- Tekstu wyjustowanego (Justify) w kolumnach na stronach internetowych (używamy zawsze wyrównania do lewej dla lepszej czytelności, ew. centrowania dla nagłówków).
- Ostrych, czarnych cieni (używamy delikatnych cieni opartych na rgba).
