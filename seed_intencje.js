// Seed intencji: wrzesien + pazdziernik 2026
// Uruchom: node seed_intencje.js
// Kasuje stare dane testowe i wstawia prawdziwe intencje z nspjczerwionka.pl

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/parafia.db');

function genId() {
  return 'int' + Math.random().toString(36).slice(2, 11);
}

function type(txt) {
  const t = txt.trim();
  if (/^Za \+\+/.test(t) || /^Za \+\+\./.test(t)) return 'za_zm_pp';
  if (/^Za \+/.test(t) || /^Za zm/.test(t)) return 'za_zm_p';
  if (/dziękczyn/i.test(t) || /dziękczynno/i.test(t)) return 'dziek';
  return 'w_int';
}

// 0=nieopłacona, 1=opłacona, 2=bez opłaty
const FREE_PATTERNS = [
  /^Wolna intencja/i,
  /^Za Parafian/i,
  /^W intencji kapłanów/i,
  /^W intencji Róż Różańcowych/i,
  /^W intencji czcicieli Serca Pana Jezusa/i,
  /^W intencji czcicieli MB Fatimskiej/i,
  /^W intencji Członków Żywego Różańca/i,
  /^W intencji społeczności szkolnej/i,
  /^W intencji rolników/i,
  /^W intencji rozpoczynającego się roku akademickiego/i,
  /^Dożynki/i,
  /^III Zakon Świętego Franciszka/i,
  /^Stygmaty św\. Franciszka/i,
];

function paid(txt) {
  if (FREE_PATTERNS.some(p => p.test(txt.trim()))) return 2;
  return 1;
}

const intencje = [
  // ─── WRZESIEŃ 2026 ───────────────────────────────────────────
  // 1 wrz (wtorek)
  { date:'2026-09-01', time:'7:00',  txt:'Za + Marka Fedyszyn w 30 dzień po śmierci.' },
  { date:'2026-09-01', time:'8:00',  txt:'W intencji społeczności szkolnej z okazji rozpoczęcia roku szkolnego 2026/2027.' },
  { date:'2026-09-01', time:'17:00', txt:'Za + Teresę Witek od rodzin Radziszewskich i Kamińskich oraz chrześniaka Janusza.' },
  // 2 wrz
  { date:'2026-09-02', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-09-02', time:'17:00', txt:'Za + Jerzego Jasnowskiego w 30 dzień po śmierci.' },
  // 3 wrz
  { date:'2026-09-03', time:'7:00',  txt:'W intencji kapłanów.' },
  { date:'2026-09-03', time:'17:00', txt:'Wolna intencja.' },
  // 4 wrz
  { date:'2026-09-04', time:'7:00',  txt:'Za + siostrę Annę i szwagra Jerzego, brata Janusza, kuzynkę Krystynę, męża Alojzego.' },
  { date:'2026-09-04', time:'17:00', txt:'Za + Danutę Pawlas w 30 dzień po śmierci.' },
  // 5 wrz
  { date:'2026-09-05', time:'8:00',  txt:'W intencji Róż Różańcowych.' },
  { date:'2026-09-05', time:'17:00', txt:'Za ++ Monikę i Teodora Glos.' },
  // 6 wrz (niedziela)
  { date:'2026-09-06', time:'8:00',  txt:'W intencji rolników, działkowców i pszczelarzy o błogosławieństwo Boże z podziękowaniem za plony.' },
  { date:'2026-09-06', time:'11:00', txt:'W intencji Norberta i Stefanii Bytom z okazji 5 rocznicy ślubu.' },
  { date:'2026-09-06', time:'17:00', txt:'Za ++ Cecylię i Józefa Koska.' },
  // 7 wrz
  { date:'2026-09-07', time:'7:00',  txt:'Za ++ rodziców Agnieszkę Huberta Blanka.' },
  { date:'2026-09-07', time:'17:00', txt:'Za + ks. Stanisława Chwila w 16 rocznicę śmierci.' },
  // 8 wrz
  { date:'2026-09-08', time:'7:00',  txt:'Za Parafian.' },
  { date:'2026-09-08', time:'17:00', txt:'Za ++ Rutę i Pawła Szewczyk.' },
  // 9 wrz
  { date:'2026-09-09', time:'7:00',  txt:'Za ++ Jadwigę Szeliga w 17 rocznicę śmierci, męża Rufina oraz rodziców z obu stron.' },
  { date:'2026-09-09', time:'17:00', txt:'Za + Danutę Pawlas od sąsiadów z ul. Słowackiego 8a.' },
  // 10 wrz
  { date:'2026-09-10', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-09-10', time:'17:00', txt:'Za ++ Annę i Alfreda Gołka.' },
  // 11 wrz
  { date:'2026-09-11', time:'7:00',  txt:'Za + Józefa Sawicki od rodziny Szala.' },
  { date:'2026-09-11', time:'17:00', txt:'Za + Marię Tyrna od sąsiadów.' },
  // 12 wrz
  { date:'2026-09-12', time:'8:00',  txt:'Za + Henryka Kord od sąsiadów z ul. Wolności.' },
  { date:'2026-09-12', time:'17:00', txt:'Za Parafian.' },
  // 13 wrz (niedziela)
  { date:'2026-09-13', time:'8:00',  txt:'Za + Adama Cabaj w 8 rocznicę śmierci.' },
  { date:'2026-09-13', time:'11:00', txt:'Dożynki z Parafian.' },
  { date:'2026-09-13', time:'17:00', txt:'W intencji czcicieli MB Fatimskiej.' },
  // 14 wrz
  { date:'2026-09-14', time:'7:00',  txt:'Za + ks. proboszcza Eryka Juraszka od byłej parafianki z rodziną.' },
  { date:'2026-09-14', time:'17:00', txt:'Za + Jana Szołtysek w 10 rocznicę śmierci.' },
  // 15 wrz
  { date:'2026-09-15', time:'7:00',  txt:'Za + Grażynę Grzegorzek.' },
  { date:'2026-09-15', time:'17:00', txt:'Za + Marię Kurpanik w 6 rocznicę śmierci.' },
  // 16 wrz
  { date:'2026-09-16', time:'7:00',  txt:'Za + Michała Kozubek w 30 dzień po śmierci.' },
  { date:'2026-09-16', time:'17:00', txt:'Za zmarłego Czesława Chajac od Agaty z rodziną z Ustronia.' },
  // 17 wrz
  { date:'2026-09-17', time:'7:00',  txt:'Stygmaty św. Franciszka.' },
  { date:'2026-09-17', time:'17:00', txt:'Za + Michała Kozubek od sąsiadów z 3 Maja 12 B.' },
  // 18 wrz
  { date:'2026-09-18', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-09-18', time:'17:00', txt:'Dziękczynno-błagalna w intencji Gabrieli i Jana Królak z okazji 40 rocznicy ślubu.' },
  // 19 wrz
  { date:'2026-09-19', time:'8:00',  txt:'Za + Irenę Zadorską.' },
  { date:'2026-09-19', time:'17:00', txt:'Za ++ Marię i Benedykta Wąglorz.' },
  // 20 wrz (niedziela)
  { date:'2026-09-20', time:'8:00',  txt:'Za Parafian.' },
  { date:'2026-09-20', time:'11:00', txt:'Za + Brunona Profaska w 17 rocznicę śmierci.' },
  { date:'2026-09-20', time:'17:00', txt:'Za ++ Idę i Józefa Oslislok i ich rodziców.' },
  // 21 wrz
  { date:'2026-09-21', time:'7:00',  txt:'Za ++ rodziców Justynę i Andrzeja, ++ teściów Marię i Leopolda, krewnych i znajomych oraz dusze w czyśćcu cierpiące.' },
  { date:'2026-09-21', time:'17:00', txt:'O zdrowie dla bratowej Marty.' },
  // 22 wrz
  { date:'2026-09-22', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-09-22', time:'17:00', txt:'Za + Henryka Kord w 30 dzień po śmierci.' },
  // 23 wrz
  { date:'2026-09-23', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-09-23', time:'17:00', txt:'Za + Irenę Majorczyk w 11 rocznicę śmierci.' },
  // 24 wrz
  { date:'2026-09-24', time:'7:00',  txt:'Za + Mirosławę Bogusz w 6 rocznicę śmierci.' },
  { date:'2026-09-24', time:'17:00', txt:'Za + Rajmunda Wita.' },
  // 25 wrz
  { date:'2026-09-25', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-09-25', time:'17:00', txt:'Za ++ Jadwigę i Alojzego Włoczek oraz ++ dzieci.' },
  // 26 wrz
  { date:'2026-09-26', time:'8:00',  txt:'Za + Elżbietę Rymut w 5 rocznicę śmierci.' },
  { date:'2026-09-26', time:'17:00', txt:'Za + Jana Bińkowskiego w 10 rocznicę śmierci.' },
  // 27 wrz (niedziela)
  { date:'2026-09-27', time:'8:00',  txt:'Za Parafian.' },
  { date:'2026-09-27', time:'11:00', txt:'Za ++ rodziców Emilię Król i dwóch mężów.' },
  { date:'2026-09-27', time:'17:00', txt:'Za ++ rodziców Helenę i Henryka Strączyńskich.' },
  // 28 wrz
  { date:'2026-09-28', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-09-28', time:'17:00', txt:'Msza dziękczynno-błagalna w intencji Marii Leśnik z okazji 10 rocznicy urodzin.' },
  // 29 wrz
  { date:'2026-09-29', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-09-29', time:'17:00', txt:'Za ++ rodziców i teściów oraz ++ z rodzin.' },
  // 30 wrz
  { date:'2026-09-30', time:'7:00',  txt:'Za + Józefa Stańczyk w 30 dzień po śmierci.' },
  { date:'2026-09-30', time:'17:00', txt:'Za ++ Jadwigę i Tadeusza Pander.' },

  // ─── PAŹDZIERNIK 2026 ──────────────────────────────────────────
  // 1 paź (czwartek - 1. czwartek miesiąca)
  { date:'2026-10-01', time:'7:00',  txt:'W intencji kapłanów.' },
  { date:'2026-10-01', time:'17:00', txt:'Za + Barbarę Herman w 30 dzień po śmierci.' },
  // 2 paź (piątek - 1. piątek)
  { date:'2026-10-02', time:'7:00',  txt:'W intencji czcicieli Serca Pana Jezusa.' },
  { date:'2026-10-02', time:'15:00', txt:'W intencji rozpoczynającego się roku akademickiego 2026/2027 UTW.' },
  { date:'2026-10-02', time:'17:00', txt:'Za ++ Stanisława i Cecylię Syguła oraz ++ Klaudię i Stefana Trunk.' },
  // 3 paź (sobota - 1. sobota)
  { date:'2026-10-03', time:'8:00',  txt:'W intencji Róż Różańcowych.' },
  { date:'2026-10-03', time:'17:00', txt:'Za + Krystynę Honysz w 8 rocznicę śmierci.' },
  // 4 paź (niedziela)
  { date:'2026-10-04', time:'8:00',  txt:'III Zakon Świętego Franciszka.' },
  { date:'2026-10-04', time:'11:00', txt:'Dziękczynno-błagalna w intencji Jerzego Gudzik z okazji 84 urodzin.' },
  { date:'2026-10-04', time:'17:00', txt:'Za ++ rodziców Sonię i Leona Cieślik w 25 rocznicę śmierci.' },
  // 5 paź
  { date:'2026-10-05', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-05', time:'17:00', txt:'Za + Jana Czaja w 19 rocznicę śmierci.' },
  // 6 paź
  { date:'2026-10-06', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-06', time:'17:00', txt:'Za ++ Henryka Jabłonka, rodziców Wandę i Alfreda oraz Marię i Eryka Mazur.' },
  // 7 paź
  { date:'2026-10-07', time:'7:00',  txt:'W intencji Członków Żywego Różańca.' },
  { date:'2026-10-07', time:'17:00', txt:'Za ++ rodziców Monikę i Jana Korus, teściów Ernesta i Różę Paszenda oraz zięcia Mariana Kubiec i ojca Zygmunta.' },
  // 8 paź
  { date:'2026-10-08', time:'7:00',  txt:'Za ++ rodziców Irenę i Herberta Gajda.' },
  { date:'2026-10-08', time:'17:00', txt:'W intencji Piotra Gorzowskiego z okazji 50 rocznicy urodzin.' },
  // 9 paź
  { date:'2026-10-09', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-09', time:'17:00', txt:'Za + Bożenę Głodek.' },
  // 10 paź
  { date:'2026-10-10', time:'8:00',  txt:'Wolna intencja.' },
  { date:'2026-10-10', time:'17:00', txt:'W intencji Henryka i Krystyny z okazji 55 rocznicy ślubu.' },
  // 11 paź (niedziela)
  { date:'2026-10-11', time:'8:00',  txt:'Za + matkę chrzestną Elżbietę Jurczyk w 2 rocznicę śmierci.' },
  { date:'2026-10-11', time:'11:00', txt:'Za ++ rodziców Jadwigę i Huberta Frycz.' },
  { date:'2026-10-11', time:'17:00', txt:'Za Parafian.' },
  // 12 paź
  { date:'2026-10-12', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-12', time:'17:00', txt:'Dziękczynno-błagalna w intencji rodzin Badura i Nowok.' },
  // 13 paź
  { date:'2026-10-13', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-13', time:'18:00', txt:'W intencji czcicieli MB Fatimskiej.' },
  // 14 paź
  { date:'2026-10-14', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-14', time:'17:00', txt:'Za + Józefa Kamieniak w 19 rocznicę śmierci.' },
  // 15 paź
  { date:'2026-10-15', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-15', time:'17:00', txt:'Za ++ Helenę i Bronisława Wojtalik oraz ++ Helenę Koleńską, Ryszarda Kulczyckiego.' },
  // 16 paź
  { date:'2026-10-16', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-16', time:'17:00', txt:'Za + Arkadiusza Burego w rocznicę urodzin.' },
  // 17 paź
  { date:'2026-10-17', time:'8:00',  txt:'Wolna intencja.' },
  { date:'2026-10-17', time:'17:00', txt:'Za ++ Adelajdę i Stanisława Olejarczyk.' },
  // 18 paź (niedziela)
  { date:'2026-10-18', time:'8:00',  txt:'Za Parafian.' },
  { date:'2026-10-18', time:'11:00', txt:'Za + Jerzego Grajner w 10 rocznicę śmierci.' },
  { date:'2026-10-18', time:'17:00', txt:'Za + Karinę Mozgalik w 1 rocznicę śmierci.' },
  // 19 paź
  { date:'2026-10-19', time:'7:00',  txt:'Za + Weronikę Rybka.' },
  { date:'2026-10-19', time:'17:00', txt:'Za + Mirosławę Tkocz w II rocznicę śmierci.' },
  // 20 paź
  { date:'2026-10-20', time:'7:00',  txt:'Za + ojca Jerzego Piekar.' },
  { date:'2026-10-20', time:'17:00', txt:'Za + męża Michała Szkatula i córkę Marię.' },
  // 21 paź
  { date:'2026-10-21', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-21', time:'17:00', txt:'Za + Huberta Rzeźniczek oraz + Janinę Połomską.' },
  // 22 paź
  { date:'2026-10-22', time:'7:00',  txt:'Za + szwagra Zbigniewa.' },
  { date:'2026-10-22', time:'17:00', txt:'Za + Kazimierza Zarzyckiego w 8 rocznicę śmierci.' },
  // 23 paź
  { date:'2026-10-23', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-23', time:'17:00', txt:'Za ++ rodziców, teściów, trzy siostry i siostrzenicę.' },
  // 24 paź
  { date:'2026-10-24', time:'8:00',  txt:'Wolna intencja.' },
  { date:'2026-10-24', time:'17:00', txt:'Za + męża Huberta Fleiszok w 3 rocznicę śmierci.' },
  // 25 paź (niedziela)
  { date:'2026-10-25', time:'8:00',  txt:'Za Parafian.' },
  { date:'2026-10-25', time:'11:00', txt:'W intencji Małgorzaty Bila z okazji 90 rocznicy urodzin.' },
  { date:'2026-10-25', time:'17:00', txt:'Dziękczynno-błagalna w intencji Anny Wencel z okazji 25 rocznicy urodzin.' },
  // 26 paź
  { date:'2026-10-26', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-26', time:'17:00', txt:'Za + Małgorzatę Polok w 4 rocznicę śmierci.' },
  // 27 paź
  { date:'2026-10-27', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-27', time:'17:00', txt:'Za + Rafała Szczepaniuk od kolegów z pracy.' },
  // 28 paź
  { date:'2026-10-28', time:'7:00',  txt:'Za ++ Stanisława i Juliana Tracz.' },
  { date:'2026-10-28', time:'17:00', txt:'Za + Klaudiusza Dworowy w 5 rocznicę śmierci.' },
  // 29 paź
  { date:'2026-10-29', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-29', time:'17:00', txt:'Za + Elżbietę Wrzeszcz w 2 rocznicę śmierci.' },
  // 30 paź
  { date:'2026-10-30', time:'7:00',  txt:'Wolna intencja.' },
  { date:'2026-10-30', time:'17:00', txt:'Za + Bogdana Kulas.' },
  // 31 paź
  { date:'2026-10-31', time:'8:00',  txt:'Wolna intencja.' },
  { date:'2026-10-31', time:'17:00', txt:'Za + Krystynę Wieczorek w 28 rocznicę śmierci.' },
];

// Wyczyść stare dane
const deleted = db.prepare('DELETE FROM intencje').run();
console.log('Usunieto starych wpisow:', deleted.changes);

// Wstaw nowe
const insert = db.prepare(
  'INSERT INTO intencje (id, date, time, type, intention, oplacona) VALUES (?, ?, ?, ?, ?, ?)'
);
let ok = 0;
for (const i of intencje) {
  insert.run(genId(), i.date, i.time, type(i.txt), i.txt, paid(i.txt));
  ok++;
}
console.log('Wstawiono intencji:', ok);
console.log('Gotowe!');
