// Seed ogłoszeń duszpasterskich: sierpień + wrzesień 2026
// Uruchom: node seed_ogloszenia.js

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/parafia.db');

function cleanHtml(html) {
  return html
    // usuń klasy ze spanów (zostaw tylko tekst)
    .replace(/<span class="tekst-[^"]*">/g, '')
    .replace(/<\/span>/g, '')
    // wyczyść &nbsp; w numeracji (np. "1. &nbsp; &nbsp;" → "1. ")
    .replace(/(\d+\.)\s*(?:&nbsp;\s*)+/g, '$1 ')
    .replace(/([a-f]\/)\s*(?:&nbsp;\s*)+/g, '$1 ')
    // usuń wiszące &nbsp; w akapitach tekstowych
    .replace(/^(&nbsp;\s*)+$/m, '')
    // usuń akapity zawierające tylko &nbsp;
    .replace(/<p[^>]*>\s*(?:&nbsp;\s*)+<\/p>\s*/g, '')
    // usuń style text-align z justify (zostaw center)
    .replace(/style="text-align: justify;"/g, '')
    .replace(/style="text-align: center;"/g, 'style="text-align:center"')
    // posprzątaj puste atrybuty style
    .replace(/ style=""/g, '')
    .trim();
}

const ogloszenia = [
  {
    id: 'ogl-2026-08-02',
    date: '2026-08-02',
    title: 'Ogłoszenia 02.08–09.08.2026',
    featured: 0,
    html: `<p style="text-align:center"><strong>OGŁOSZENIA<br>02.08–09.08.2026 r.</strong></p>
<p>1. Dziś przypada odpust Porcjunkuli – wierni mogą uzyskać odpust zupełny, gdy nawiedzą kościół oraz spełnią zwykłe warunki odpustu. Kolekta na Wydział Teologiczny UŚ.</p>
<p>2. We wtorek wspomnienie św. Jana Marii Vianney'a, prezbitera.</p>
<p>3. W czwartek – ŚWIĘTO PRZEMIENIENIA PAŃSKIEGO.</p>
<p>4. W sobotę – wspomnienie św. Dominika, prezbitera.</p>
<p>5. W tym tygodniu przypadają pierwszy czwartek i pierwszy piątek miesiąca.</p>
<p>6. Rozpoczął się sierpień – miesiąc, w którym zachęcamy do podjęcia abstynencji od napojów alkoholowych.</p>
<p>7. Od dziś nowy numer gazetki parafialnej „Nowe Serce" z intencjami na cały sierpień i pierwszy tydzień września.</p>
<p>8. Do poniedziałku 31 sierpnia obowiązuje porządek wakacyjny:<br>
a/ Msze św. w poniedziałek, środę, piątek i sobotę o godz. 17.00,<br>
b/ Msze święte we wtorek i czwartek o godz. 7.00,<br>
c/ Kancelaria czynna w poniedziałek i środę po Mszy wieczornej i w czwartek po Mszy porannej,<br>
d/ W niedziele bez zmian Msze o godz. 8.00, 11.00 i 17.00,<br>
e/ Nie ma nabożeństw i nieszporów o godz. 16.30,<br>
f/ Wystawienie Najświętszego Sakramentu w piątki od godz. 16.00.</p>
<p>9. Życzymy błogosławionej niedzieli.</p>`
  },
  {
    id: 'ogl-2026-08-09',
    date: '2026-08-09',
    title: 'Ogłoszenia 09.08–16.08.2026',
    featured: 0,
    html: `<p style="text-align:center"><strong>OGŁOSZENIA<br>09.08–16.08.2026 r.</strong></p>
<p>1. Dziś przypada XIX niedziela zwykła. Kolekta na naszą parafię.</p>
<p>2. W poniedziałek – ŚWIĘTO ŚW. WAWRZYŃCA, diakona i męczennika.</p>
<p>3. We wtorek – wspomnienie św. Klary, dziewicy.</p>
<p>4. W piątek – wspomnienie św. Maksymiliana Marii Kolbego, prezb. i męcz.</p>
<p>5. W sobotę – UROCZYSTOŚĆ WNIEBOWZIĘCIA NMP zwane świętem Matki Bożej Zielnej. Zgodnie z tradycją będziemy błogosławić zioła i kwiaty przyniesione przez wiernych do kościoła. Jest to święto nakazane – porządek Mszy jak w niedzielę, a Msza o godz. 17.00 według formularza z soboty.</p>
<p>6. Sierpień – miesiąc, w którym zachęcamy do podjęcia abstynencji od napojów alkoholowych.</p>
<p>7. W przyszłą niedzielę odbywa się pielgrzymka kobiet i dziewcząt do Matki Bożej Piekarskiej.</p>
<p>8. Gazetka parafialna „Nowe Serce" z intencjami na cały sierpień i pierwszy tydzień września.</p>
<p>9. Do poniedziałku 31 sierpnia obowiązuje porządek wakacyjny:<br>
a/ Msze św. w poniedziałek, środę, piątek i sobotę o godz. 17.00,<br>
b/ Msze święte we wtorek i czwartek o godz. 7.00,<br>
c/ Kancelaria czynna w poniedziałek i środę po Mszy wieczornej i w czwartek po Mszy porannej,<br>
d/ W niedziele bez zmian Msze o godz. 8.00, 11.00 i 17.00,<br>
e/ Nie ma nabożeństw i nieszporów o godz. 16.30,<br>
f/ Wystawienie Najświętszego Sakramentu w piątki od godz. 16.00.</p>
<p>10. Życzymy błogosławionej niedzieli.</p>`
  },
  {
    id: 'ogl-2026-08-16',
    date: '2026-08-16',
    title: 'Ogłoszenia 16.08–23.08.2026',
    featured: 0,
    html: `<p style="text-align:center"><strong>OGŁOSZENIA<br>16.08–23.08.2026 r.</strong></p>
<p>1. Dziś w XX niedzielę zwykłą odbywa się pielgrzymka kobiet i dziewcząt do Matki Bożej Piekarskiej – polecajmy pątniczki w modlitwach. Kolekta na naszą parafię.</p>
<p>2. W poniedziałek – UROCZYSTOŚĆ ŚW. JACKA, PREZBITERA, głównego patrona archidiecezji i metropolii katowickiej.</p>
<p>3. W czwartek – wspomnienie św. Bernarda, opata i doktora Kościoła.</p>
<p>4. W piątek – wspomnienie św. Piusa X, papieża.</p>
<p>5. Sierpień – miesiąc, w którym zachęcamy do podjęcia abstynencji od napojów alkoholowych.</p>
<p>6. Gazetka parafialna „Nowe Serce" z intencjami na cały sierpień i pierwszy tydzień września.</p>
<p>7. Do poniedziałku 31 sierpnia obowiązuje porządek wakacyjny:<br>
a/ Msze św. w poniedziałek, środę, piątek i sobotę o godz. 17.00,<br>
b/ Msze święte we wtorek i czwartek o godz. 7.00,<br>
c/ Kancelaria czynna w poniedziałek i środę po Mszy wieczornej i w czwartek po Mszy porannej,<br>
d/ W niedziele bez zmian Msze o godz. 8.00, 11.00 i 17.00,<br>
e/ Nie ma nabożeństw i nieszporów o godz. 16.30,<br>
f/ Wystawienie Najświętszego Sakramentu w piątki od godz. 16.00.</p>
<p>8. Życzymy błogosławionej niedzieli.</p>`
  },
  {
    id: 'ogl-2026-08-23',
    date: '2026-08-23',
    title: 'Ogłoszenia 23.08–30.08.2026',
    featured: 0,
    html: `<p style="text-align:center"><strong>OGŁOSZENIA<br>23.08–30.08.2026 r.</strong></p>
<p>1. Dziś XXI niedziela zwykła.</p>
<p>2. W poniedziałek – ŚWIĘTO ŚW. BARTŁOMIEJA, APOSTOŁA.</p>
<p>3. We środę – UROCZYSTOŚĆ NMP CZĘSTOCHOWSKIEJ.</p>
<p>4. W czwartek – wspomnienie św. Moniki.</p>
<p>5. W piątek – wspomnienie św. Augustyna, biskupa i doktora Kościoła.</p>
<p>6. W sobotę – wspomnienie Męczeństwa św. Jana Chrzciciela.</p>
<p>7. Sierpień – miesiąc, w którym zachęcamy do podjęcia abstynencji od napojów alkoholowych.</p>
<p>8. Gazetka parafialna „Nowe Serce" z intencjami na cały sierpień i pierwszy tydzień września.</p>
<p>9. Do poniedziałku 31 sierpnia obowiązuje porządek wakacyjny:<br>
a/ Msze św. w poniedziałek, środę, piątek i sobotę o godz. 17.00,<br>
b/ Msze święte we wtorek i czwartek o godz. 7.00,<br>
c/ Kancelaria czynna w poniedziałek i środę po Mszy wieczornej i w czwartek po Mszy porannej,<br>
d/ W niedziele bez zmian Msze o godz. 8.00, 11.00 i 17.00,<br>
e/ Nie ma nabożeństw i nieszporów o godz. 16.30,<br>
f/ Wystawienie Najświętszego Sakramentu w piątki od godz. 16.00.</p>
<p>10. Życzymy błogosławionej niedzieli.</p>`
  },
  {
    id: 'ogl-2026-08-30',
    date: '2026-08-30',
    title: 'Ogłoszenia 30.08–06.09.2026',
    featured: 0,
    html: `<p style="text-align:center"><strong>OGŁOSZENIA<br>30.08–06.09.2026 r.</strong></p>
<p>1. Dziś XXII niedziela zwykła.</p>
<p>2. Od wtorku wraca zwyczajny porządek Mszy świętych, nabożeństw i godzin urzędowania kancelarii.</p>
<p>3. 1 września we wtorek o godz. 8.00 Msza święta inaugurująca nowy rok szkolny 2026/2027. Zapraszam całą społeczność szkolną na Mszę w ich intencji.</p>
<p>4. Od środy zaczynamy przyjmować intencje na rok 2027.</p>
<p>5. W tym tygodniu przypadają pierwszy czwartek, pierwszy piątek i pierwsza sobota miesiąca.</p>
<p>6. W czwartek wystawienie Najświętszego Sakramentu od godz. 16.00.</p>
<p>7. Spowiedź w piątek od godziny 16.15.</p>
<p>8. W sobotę obchód chorych – proszę w zakrystii lub kancelarii zapisywać pragnących przyjąć kapłana z posługą.</p>
<p>9. W przyszłą niedzielę o godz. 14.00 w katowickiej katedrze odbywa się Dzień Wspólnoty Ruchu Światło-Życie.</p>
<p>10. 25 lipca przeszedł na emeryturę proboszcz z parafii św. Jerzego w Dębieńsku, który pełnił funkcję dziekana naszego dekanatu. W związku z tym nowym dziekanem dekanatu Dębieńsko został proboszcz parafii WNMP z Czuchowa ks. Krzysztof Jonczyk.</p>
<p>11. Zachęcamy do czytania Gościa Niedzielnego. Nowy numer gazetki Nowe Serce za tydzień.</p>
<p>12. Życzymy błogosławionej niedzieli.</p>`
  },
  {
    id: 'ogl-2026-09-06',
    date: '2026-09-06',
    title: 'Ogłoszenia 06.09–13.09.2026',
    featured: 1,
    html: `<p style="text-align:center"><strong>OGŁOSZENIA<br>06.09–13.09.2026 r.</strong></p>
<p>1. Dziś XXIII Niedziela Zwykła. Kolekta będzie przeznaczona na Wydział Teologiczny UŚ.</p>
<p>2. We wtorek swoje spotkanie ma III Zakon św. Franciszka po Mszy porannej. W tym dniu przypada święto narodzenia NMP.</p>
<p>3. W czwartek wystawienie Najświętszego Sakramentu o godzinie 16.00.</p>
<p>4. W piątek po porannej Mszy św. swoje spotkanie mają Róże Różańcowe.</p>
<p>5. W sobotę wyrusza pielgrzymka piesza do Parafii Macierzystej, czyli do Dębieńska. Wyruszamy o godz. 8.30. Msza w parafii św. Jerzego w Dębieńsku o godzinie 11.00. O godzinie 10.30 będzie bus, który zawiezie chętnych na wspomnianą Mszę.</p>
<p>6. Za tydzień 13 września dzień fatimski: o godz. 16.30 różaniec, o godz. 17.00 Msza w intencji czcicieli Pani Fatimskiej, następnie procesja ze świecami.</p>
<p>7. Do jutra można składać elektro-śmieci na parkingu przy krzyżu misyjnym. Wywóz rano we wtorek 8 września.</p>
<p>8. 26 września w ostatnią sobotę miesiąca pielgrzymka do Rud Raciborskich.</p>
<p>9. Zwracam się z ogromną prośbą do osób, które znają się na stolarce. Chcemy odnowić ławki z naszego kościoła przed przeniesieniem ich do nowego. Również poszukuję osoby, które zajęłyby się odnowieniem metalowych krat starego ogrodzenia od frontu kościoła – będą bowiem użyte w nowym projekcie.</p>
<p>10. Zapraszamy do udziału w akcji wsparcia budowy przez zakup płyty elewacji. Kolejnych kilka certyfikatów do odbioru w zakrystii.</p>
<p>11. Na stojaku z prasą wyłożone są pocztówki, w których zachęcamy do pomocy w finansowaniu budowy kościoła. Proszę je zabrać i zachęcić znajomych do wsparcia.</p>
<p>12. Zachęcamy do czytania Gościa Niedzielnego i nowego wydania gazetki parafialnej Nowe Serce.</p>`
  }
];

// Usuń stare testowe ogłoszenia (zostawiamy ewentualnie starsze realne wpisy)
const deleted = db.prepare("DELETE FROM ogloszenia WHERE date >= '2026-08-01'").run();
console.log('Usunięto ogłoszeń (sierpień+):', deleted.changes);

const insert = db.prepare(
  'INSERT OR REPLACE INTO ogloszenia (id, title, date, status, featured, views, content) VALUES (?,?,?,?,?,?,?)'
);

let ok = 0;
for (const o of ogloszenia) {
  insert.run(o.id, o.title, o.date, 'published', o.featured, 0, o.html);
  ok++;
}
console.log('Wstawiono ogłoszeń:', ok);

// Pokaż co mamy
const all = db.prepare("SELECT id, title, date, featured FROM ogloszenia ORDER BY date DESC").all();
console.log('\nWszystkie ogłoszenia w bazie:');
all.forEach(r => console.log(' ', r.date, r.featured?'[★]':'   ', r.title.slice(0,50)));
