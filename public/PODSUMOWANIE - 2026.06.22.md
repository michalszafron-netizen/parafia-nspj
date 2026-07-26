# Podsumowanie prac — Parafia NSPJ Czerwionka-Leszczyny

Stan na 22.06.2026. Dokument obejmuje wszystkie poprawki i nowe funkcje wprowadzone w demo (strona publiczna + panel admina) od początku tego etapu prac.

---

## Co zostało zrobione

### Strona publiczna

- Menu „Msze święte" i „Aktualności" prowadzą na właściwe podstrony (wcześniej zawsze wracały na sekcję strony głównej).
- Galeria naprawiona (wcześniej wyglądała jak pusta na części wejść).
- Wszystkie długie myślniki (—) zamienione na zwykłe (-) w całym serwisie (388 miejsc).
- Naprawiona rozjeżdżająca się tabela „Standardy ochrony małoletnich".
- Ujednolicone tabele na podstronach sakramentów (stały układ 2 kolumn).
- **Stopka strony — pełen porządek na 16 stronach.** Każda podstrona miała inną wersję stopki (różne, niespójne linki). Teraz wszystkie mają identyczną treść i wygląd: usunięto „Sakramenty" (nie pasowało nigdzie), usunięto zduplikowane „Msze święte" i „Intencje mszalne", naprawiono martwe linki „Duszpasterze" i zepsutą nazwę pliku w linku „Msze święte", naprawiono link „Wsparcie budowy". Naprawiony też niespójny kolor/wysokość stopki na dwóch stronach.
- Sekcja „Obecni duszpasterze" (Kapłani) i sekcje wspólnot parafialnych czytają teraz dane żywo z panelu admina, nie są zaszyte na sztywno w kodzie strony.
- **Odpowiedź na uwagę Rafała „w pasku menu nie może być przycisku do logowania":** to świadoma decyzja, nie pominięcie — przycisk logowania (ikona osoby przy „Wsparcie budowy") zostaje widoczny na czas wersji demonstracyjnej, żeby zespołowi było łatwiej szybko wchodzić do panelu, testować i dalej rozwijać projekt. Przy przekazaniu projektu księdzu zostanie usunięty z paska menu — admin będzie dostępny tylko przez dyskretny link (tak jak już teraz jest w stopce strony).

### Panel admina — poprawki

- Pulpit: przycisk „dodaj aktualność" otwierał wcześniej wypełniony formularz (powinien być pusty) — naprawione.
- Sidebar admina — naprawione skalowanie na mniejszych ekranach.
- Naprawiony cichy błąd na Pulpicie: sekcje „Ostatnia aktywność" i „Nadchodzące wydarzenia" nigdy nie pokazywały sakramentów z powodu niedopasowania do faktycznego formatu danych — teraz pokazują poprawnie.
- Ujednolicona ikonka „Raporty" w menu (dwie strony pokazywały inną ikonkę niż reszta).
- Ukryte (nie usunięte — kod zostaje na przyszłość): przyciski „Powiadomienia" i „Podgląd strony" na Pulpicie oraz pole „Szukaj w panelu" — żadne z nich nie miało realnej funkcji.

### Panel admina — nowe funkcje

- **Parafianie** — odpowiedź na zgłoszenie Rafała „opcja zarządzania dodanym Parafianinem": **rozwiązane przyciskiem „Edytuj"** (pełny formularz danej osoby do zmiany każdego pola) + akcje masowe (zaznaczanie wielu osób i eksport zaznaczonych do PDF). Dodatkowo: przyciski Edytuj/Usuń przeniesione na bardziej widoczne miejsce — bezpośrednio przy imieniu i nazwisku po lewej stronie, bez przewijania tabeli w prawo.
- **Sakramenty** — filtrowanie (data, status) + eksport wyfiltrowanych danych (CSV i brandowany PDF), checkboxy do zaznaczania. Przyciski Edytuj/Usuń/Drukuj przeniesione przy nazwisko, tak jak w Parafianach.
- **Pogrzeby** — pełniejsze filtry + eksport (CSV i brandowany PDF), checkboxy. Przyciski Edytuj/Usuń/Drukuj przeniesione przy nazwisko, tak jak w Parafianach.
- **Intencje mszalne** — eksport jednostronicowy do Word i PDF z logo parafii, wybór dni do druku.
- **Wspólny generator brandowanego PDF** — jeden mechanizm używany przez Parafianie/Pogrzeby/Sakramenty, żeby wydruki wyglądały konsekwentnie (logo, kolory parafii).
- **Wspólnoty parafialne** (nowy moduł) — pełna edycja składu 7 grup (Rada Parafialna, Ministranci, Schola, Dzieci Maryi, Żywy Różaniec, FZŚ, Zespół Charytatywny): dodawanie/usuwanie osób, liczba członków, struktura grupy (poziomy/role z liczebnością), z filtrem podpowiadającym funkcje, żeby uniknąć literówek.
- **Kapłani** (nowy moduł) — pełna edycja profili obecnych duszpasterzy: rola, imię i nazwisko, zdjęcie, biografia, zmiana kolejności. Historyczne listy księży (dawni proboszczowie, wikariusze) zostały świadomie statyczne — to archiwum zmieniające się raz na kilka lat, nie pasuje do wzorca „lista do zarządzania".
- **Hub „Strony statyczne"** — odpowiedź na uwagę Rafała „rozumiem, że będzie możliwość edycji treści na podstronach, póki co u mnie nie działa - przycisk nieaktywny": chodziło konkretnie o dodawanie/edycję ludzi w grupach wspólnotowych (Rada Parafialna, Ministranci itd.) oraz o duszpasterzy. **Przycisk jest już aktywny** — to jedno miejsce z dostępem do edycji Wspólnot i Kapłanów (patrz dwa punkty wyżej).
- **Dokumenty** (nowy moduł) — wyszukiwanie osoby po imieniu i nazwisku z generowaniem dokumentu od razu (Zgłoszenie Pogrzebu, Świadectwo Chrztu), plus zebrane w jednym miejscu linki do wszystkich eksportów zbiorczych (Parafianie, Pogrzeby, Sakramenty, Intencje, Ogłoszenia).

---

## Co na razie odkładamy / do ustalenia

**1. Formularz „zgłoś propozycję intencji" od parafian**
Nie wdrożone na razie — to wersja demonstracyjna, funkcja wymaga prawdziwego backendu i serwera. Wejdzie po przejściu na docelowy serwer.

**2. Prawdziwy zapis danych (backend)**
To wersja demonstracyjna — dane z panelu zapisują się tylko lokalnie. Już będziemy przechodzić na nasz serwer, co to rozwiąże.

**3. Dodawanie nowych galerii ze zdjęciami**
To samo ograniczenie jak wyżej — wymaga przejścia na serwer. Istniejące galerie działają już teraz normalnie.

**4. Reszta szablonów w sekcji „Dokumenty"**
Mamy dwa działające przykłady: „Zgłoszenie Pogrzebu" i „Świadectwo Chrztu". Reszta szablonów (jakie dokumenty, jakie pola) wymaga ustalenia wprost z księdzem — zrobimy je w tym samym stylu, gdy będzie wiadomo, czego potrzebuje.

---

*Dokument przygotowany jako podsumowanie stanu prac — do wykorzystania w rozmowie z księdzem / zespołem.*
