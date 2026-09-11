// Aktualizacja ogłoszeń: usuń marzec/kwiecień/maj, dodaj lipiec 2026
// Uruchom: node seed_ogloszenia_lipiec.js

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/parafia.db');

// Usuń stare testowe wpisy (marzec, kwiecień, maj)
const deleted = db.prepare("DELETE FROM ogloszenia WHERE date < '2026-06-28'").run();
console.log('Usunięto starych ogłoszeń (przed czerwcem):', deleted.changes);

const insert = db.prepare(
  'INSERT OR REPLACE INTO ogloszenia (id, title, date, status, featured, views, content) VALUES (?,?,?,?,?,?,?)'
);

const ogloszenia = [
  {
    id: 'ogl-2026-06-28',
    date: '2026-06-28',
    title: 'Ogłoszenia 28.06–05.07.2026',
    featured: 0,
    html: `<p style="text-align:center"><strong>OGŁOSZENIA<br>28.06–05.07.2026 r.</strong></p>
<p>1. Dziś XIII Niedziela Zwykła. Kolekta będzie przeznaczona nasz kościół a za tydzień tzw. Świętopietrze, czyli ofiara na Stolicę Apostolską.</p>
<p>2. Dziś ks. proboszcz zbiera ofiarę na budowę naszego kościoła w parafii Ducha Świętego w Tychach a ksiądz Rafał w parafii Najświętszego Serca Pana Jezusa w Rogowie.</p>
<p>3. Jutro przypada Uroczystość Świętych Apostołów Piotra i Pawła. Ks. abp senior Damian Zimoń obchodzi rocznicę święceń biskupich; pamiętajmy o nim w modlitwie.</p>
<p>4. W tym tygodniu przypadają pierwszy czwartek, pierwszy piątek i pierwsza sobota miesiąca. Obchód chorych będzie miał miejsce w środku wakacji, czyli w sobotę 1 sierpnia.</p>
<p>5. W piątek święto św. Tomasza, apostoła.</p>
<p>6. Od soboty 27 czerwca do poniedziałku 31 sierpnia obowiązuje porządek wakacyjny:<br>
a/ Msze św. odprawiane są w poniedziałek, środę, piątek i sobotę o godz. 17.00,<br>
b/ Msze święte we wtorek i czwartek o godz. 7.00,<br>
c/ Kancelaria czynna w poniedziałek i środę po Mszy wieczornej i w czwartek po Mszy porannej,<br>
d/ W niedziele bez zmian Msze o godz. 8.00, 11.00 i 17.00,<br>
e/ Nie ma nabożeństw i nieszporów o godz. 16.30,<br>
f/ Wystawienie Najświętszego Sakramentu w piątki od godz. 16.00.</p>
<p>7. Rodzicom i prawnym opiekunom dzieci zalecamy, aby kierowali do organizatorów letniego wypoczynku pisemną prośbą o umożliwienie dzieciom wypełniania praktyk religijnych, a szczególnie uczestnictwa w niedzielnej Mszy świętej.</p>`
  },
  {
    id: 'ogl-2026-07-05',
    date: '2026-07-05',
    title: 'Ogłoszenia 05.07–12.07.2026',
    featured: 0,
    html: `<p style="text-align:center"><strong>OGŁOSZENIA<br>05.07–12.07.2026 r.</strong></p>
<p>1. Dziś XIV Niedziela Zwykła. Kolekta przeznaczona na Stolicę Apostolską.</p>
<p>2. 6 lipca przypada święto patronalne Apostolstwa Chorych – wspomnienie Matki Bożej Uzdrowienia Chorych. Pamiętajmy o naszych chorych w modlitwach.</p>
<p>3. W poniedziałek wspomnienie bł. Marii Teresy Ledóchowskiej, dziewicy.</p>
<p>4. We środę wspomnienie św. Jana z Dukli, prezbitera.</p>
<p>5. W sobotę – święto św. Benedykta, opata, patrona Europy.</p>
<p>6. Do poniedziałku 31 sierpnia obowiązuje porządek wakacyjny:<br>
a/ Msze św. odprawiane są w poniedziałek, środę, piątek i sobotę o godz. 17.00,<br>
b/ Msze święte we wtorek i czwartek o godz. 7.00,<br>
c/ Kancelaria czynna w poniedziałek i środę po Mszy wieczornej i w czwartek po Mszy porannej,<br>
d/ W niedziele bez zmian Msze o godz. 8.00, 11.00 i 17.00,<br>
e/ Nie ma nabożeństw i nieszporów o godz. 16.30,<br>
f/ Wystawienie Najświętszego Sakramentu w piątki od godz. 16.00.</p>
<p>7. Rodzicom i prawnym opiekunom dzieci zalecamy, aby kierowali do organizatorów letniego wypoczynku pisemną prośbą o umożliwienie dzieciom wypełniania praktyk religijnych, a szczególnie uczestnictwa w niedzielnej Mszy świętej.</p>`
  },
  {
    id: 'ogl-2026-07-12',
    date: '2026-07-12',
    title: 'Ogłoszenia 12.07–19.07.2026',
    featured: 0,
    html: `<p style="text-align:center"><strong>OGŁOSZENIA<br>12.07–19.07.2026 r.</strong></p>
<p>1. Dziś XV Niedziela Zwykła. Kolekta będzie przeznaczona nasz kościół.</p>
<p>2. W poniedziałek 13 lipca dzień fatimski – zapraszamy wszystkich czcicieli Matki Boskiej Fatimskiej na Mszę świętą, uwaga – godzina 18.00, po niej różaniec i procesja ze świecami.</p>
<p>3. Obchód chorych będzie miał miejsce w środku wakacji, czyli w sobotę 1 sierpnia.</p>
<p>4. Od czwartku 6.00 rano trwają prace przy wykładaniu ozdobnych płyt podłogi w nowym kościele. Trwa produkcja białych płyt elewacji na kolejne części elewacji kościoła.</p>
<p>5. Do poniedziałku 31 sierpnia obowiązuje porządek wakacyjny:<br>
a/ Msze św. odprawiane są w poniedziałek, środę, piątek i sobotę o godz. 17.00,<br>
b/ Msze święte we wtorek i czwartek o godz. 7.00,<br>
c/ Kancelaria czynna w poniedziałek i środę po Mszy wieczornej i w czwartek po Mszy porannej,<br>
d/ W niedziele bez zmian Msze o godz. 8.00, 11.00 i 17.00,<br>
e/ Nie ma nabożeństw i nieszporów o godz. 16.30,<br>
f/ Wystawienie Najświętszego Sakramentu w piątki od godz. 16.00.</p>
<p>6. Jeszcze jest kilka gazetek parafialnych z intencjami do końca miesiąca.</p>
<p>7. Życzymy błogosławionej niedzieli.</p>`
  },
  {
    id: 'ogl-2026-07-19',
    date: '2026-07-19',
    title: 'Ogłoszenia 19.07–26.07.2026',
    featured: 0,
    html: `<p style="text-align:center"><strong>OGŁOSZENIA<br>19.07–26.07.2026 r.</strong></p>
<p>1. Dziś XVI Niedziela Zwykła. Kolekta będzie przeznaczona nasz kościół.</p>
<p>2. We środę święto świętej Marii Magdaleny – swoje urodziny obchodzi ks. Rafał.</p>
<p>3. W czwartek święto św. Brygidy, patronki Europy.</p>
<p>4. W sobotę święto św. Jakuba Apostoła.</p>
<p>5. W tym tygodniu wspominamy św. Krzysztofa, patrona kierowców – w związku z tym za tydzień w niedzielę po Mszach świętych odbędzie się obrzęd poświęcenia samochodów. Kapłan będzie stał na dolnym parkingu koło tablicy nekrologów przy wjeździe na plac targowy, tak aby wyjeżdżający z targowiska oraz zjeżdżający z parkingu koło kościoła mieli swobodny dostęp.</p>
<p>6. Do poniedziałku 31 sierpnia obowiązuje porządek wakacyjny:<br>
a/ Msze św. odprawiane są w poniedziałek, środę, piątek i sobotę o godz. 17.00,<br>
b/ Msze święte we wtorek i czwartek o godz. 7.00,<br>
c/ Kancelaria czynna w poniedziałek i środę po Mszy wieczornej i w czwartek po Mszy porannej,<br>
d/ W niedziele bez zmian Msze o godz. 8.00, 11.00 i 17.00,<br>
e/ Nie ma nabożeństw i nieszporów o godz. 16.30,<br>
f/ Wystawienie Najświętszego Sakramentu w piątki od godz. 16.00.</p>
<p>7. Życzymy błogosławionej niedzieli.</p>`
  }
];

let ok = 0;
for (const o of ogloszenia) {
  insert.run(o.id, o.title, o.date, 'published', o.featured, 0, o.html);
  ok++;
}
console.log('Wstawiono ogłoszeń lipcowych:', ok);

const all = db.prepare("SELECT id, date, featured, title FROM ogloszenia ORDER BY date DESC").all();
console.log('\nWszystkie ogłoszenia w bazie:');
all.forEach(r => console.log(' ', r.date, r.featured ? '[★]' : '   ', r.title.slice(0, 55)));
