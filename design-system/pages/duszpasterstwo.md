# Duszpasterstwo - Page Overrides

This file defines layout patterns specific to the "Duszpasterstwo" page, adhering to the global `MASTER.md`.

## 1. Struktura Sekcji (Section Structure)
- **Hero/Header:** Mniejszy niż na stronie głównej, zawierający po prostu tytuł (H1) np. "Duszpasterze" i krótki opis, z tłem `--cream` lub `--beige-deep`.
- **Obecni Duszpasterze:** Kafelki księży z lewej lub po stronie wizualnej, tekst (biografia) z prawej.
  - Wykorzystamy klasę `.clergy-card` w siatce (Grid) z `align-items: flex-start`.
  - Zdjęcie proboszcza musi mieć stałą proporcję (np. kwadrat lub 4:3 z łagodnymi zaokrągleniami `border-radius: 8px`) i subtelny cień.
  - Tytuł (Imię i Nazwisko) + ranga (Proboszcz/Wikariusz) jako eyebrow.
- **Księża Historyczni i Pochodzący z Parafii:** Przedstawieni w formie czytelnych, eleganckich list z podkreśleniami (bottom border `var(--line)`) lub w formie wielokolumnowej listy.
  - Odejście od wypunktowania kulkami na rzecz czystego układu z datami wyjustowanymi z prawej lub w formie stałej szerokości.

## 2. CSS i Typografia Specyficzna (Specific Styles)
- `.clergy-list`: Zamiast list z domyślnym `bullet`, użyjemy gridu 2-kolumnowego (Imię i Nazwisko | Lata posługi).
- `.clergy-title`: H2 z rodziny `Cormorant Garamond`, kolor `--ink`.
- Ozdobne przerywniki: Zamiast grafik typu "rozdzielnik.png", użyjemy eleganckiej linii w CSS (`<hr class="elegant-divider">`), z centralnie ułożonym krzyżykiem `+` lub pustej linii, by zachować profesjonalny wygląd.

## 3. Komponenty HTML
```html
<div class="clergy-profile">
  <div class="photo" style="background-image:url('...')"></div>
  <div class="bio">
    <span class="role">Proboszcz</span>
    <h2>Ks. Tomasz Żołna</h2>
    <p>Urodził się...</p>
  </div>
</div>
```
Listy historyczne zrealizujemy za pomocą `.history-list` gdzie elementem jest `div` z podziałem na imię i lata.
