// Zmiana palety kolorów NSPJ: stara (#7a1f2b) -> nowa (#B12D15). Uruchom: node zmiana_palety.js
// Kopie zmienionych plików trafiają do _backup_paleta_2026-10-06/ (cofnięcie = skopiowanie ich z powrotem).
const fs = require('fs'), path = require('path');
const MAP = [
  // główne
  ['#7a1f2b','#B12D15'],['#6b2737','#B12D15'],
  ['#5e1620','#751A10'],['#4a1a25','#751A10'],
  ['#b87a4a','#C05D42'],['#b87333','#C05D42'],
  ['#d6a572','#E0A276'],['#d4956a','#E0A276'],
  // tła
  ['#faf6ee','#FFF8F4'],['#faf7f2','#FFF8F4'],['#f6e9d3','#FFF8F4'],
  ['#f4ede0','#F5E7DD'],['#f0e8da','#F5E7DD'],['#e8d9b8','#F5E7DD'],
  ['#ebe1cd','#EBD8C8'],
  ['#f7f2e7','#FCF7F3'],
  // tekst i linie
  ['#2b2520','#2B211D'],
  ['#5a5048','#675850'],['#6b5c4e','#675850'],
  ['#d8cdb6','#E5D6CC'],['#e2d8c5','#E5D6CC'],['#e2d5c4','#E5D6CC'],
  // statusy
  ['#3f7d4d','#3C804B'],['#3a7d44','#3C804B'],
  ['#c98a26','#C88722'],['#b87a00','#C88722'],
  ['#c0392b','#C43A2B'],
  ['#2c5d80','#2E678B'],
];
const RGB = [ // warianty rgba(r,g,b,...)
  ['122,31,43','177,45,21'],['94,22,32','117,26,16'],['184,122,74','192,93,66'],
  ['214,165,114','224,162,118'],['246,233,211','255,248,244'],['232,217,184','245,231,221'],
];
const files = [];
(function walk(d){ for (const f of fs.readdirSync(d)) { const p = path.join(d,f);
  if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(html|css|js)$/i.test(f)) files.push(p); } })('public');
files.push('server.js');
const backup = '_backup_paleta_2026-10-06';
let total = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8'); let out = src, n = 0;
  for (const [a,b] of MAP) out = out.replace(new RegExp(a+'(?![0-9a-fA-F])','gi'), () => (n++, b));
  for (const [a,b] of RGB) out = out.replace(new RegExp('(rgba?\\(\\s*)'+a.split(',').join('\\s*,\\s*')+'(?=\\s*[,)])','g'), (m,p) => (n++, p+b));
  if (n) { const bk = path.join(backup, f); fs.mkdirSync(path.dirname(bk), {recursive:true}); fs.copyFileSync(f, bk);
    fs.writeFileSync(f, out); total += n; console.log(String(n).padStart(4), f); }
}
console.log('Razem podmian:', total);
