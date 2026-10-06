// Jednorazowe przeniesienie palety do public/admin/assets/kolory.css.
// Usuwa lokalne kopie zmiennych z :root, zamienia twarde hexy na var(--x) (CSS) lub kol('x') (JS).
// Kopie plików sprzed zmiany: _backup_centralizacja_2026-10-06/
const fs = require('fs'), path = require('path');

const PAL = {
  'burgundy':'#B12D15','burgundy-dark':'#751A10','copper':'#C05D42','copper-light':'#E0A276',
  'cream':'#FFF8F4','beige':'#F5E7DD','beige-deep':'#EBD8C8','bg':'#FCF7F3','white':'#FFFFFF',
  'ink':'#2B211D','ink-soft':'#675850','line':'#E5D6CC',
  'green':'#3C804B','amber':'#C88722','red':'#C43A2B','blue':'#2E678B',
};
const hex2name = {}; for (const [n,h] of Object.entries(PAL)) if (n !== 'white') hex2name[h.toLowerCase()] = n;
const rgbOf = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16)).join(',');
const rgb2name = {}; for (const [n,h] of Object.entries(PAL)) if (n !== 'white') rgb2name[rgbOf(h)] = n;
const HEX_RE = new RegExp('#(' + Object.keys(hex2name).map(h => h.slice(1)).join('|') + ')(?![0-9a-fA-F])', 'gi');
const RGB_RE = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?=[,)])/g;

const KOLORY_CSS = '/kolory.css'; // placeholder
const LINK_PATH = '/admin/assets/kolory.css';
const KOL_FN = "function kol(n){return getComputedStyle(document.documentElement).getPropertyValue('--'+n).trim()}";
const report = [];

// ---------- kolory.css ----------
let css = '/* ===== PALETA KOLORÓW PARAFII NSPJ — JEDYNE MIEJSCE Z KOLORAMI =====\n'
  + '   Zmiana koloru tutaj zmienia go w całym portalu i panelu admina.\n'
  + '   Przy zmianie hexa zaktualizuj też jego wersję -rgb (te same liczby w systemie dziesiętnym). */\n:root{\n';
for (const [n,h] of Object.entries(PAL)) css += `  --${n}:${h};\n`;
css += '\n  /* wersje RGB do przezroczystości: rgba(var(--burgundy-rgb),.3) */\n';
for (const [n,h] of Object.entries(PAL)) if (n !== 'white') css += `  --${n}-rgb:${rgbOf(h)};\n`;
css += '}\n';

// ---------- pomocnicze ----------
function stripRoot(text, file) {
  // usuwa deklaracje palety z :root{...}; zwraca [tekst, lokalne nadpisania]
  const overrides = {};
  text = text.replace(/:root\s*\{([^}]*)\}/g, (m, body) => {
    const kept = [];
    for (const decl of body.split(';')) {
      const d = decl.trim(); if (!d) continue;
      const mm = d.match(/^--([a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})$/);
      if (mm && PAL[mm[1]] && PAL[mm[1]].toLowerCase() === mm[2].toLowerCase()) continue;
      if (mm && PAL[mm[1]]) overrides[mm[1]] = mm[2];
      kept.push(decl.replace(/^\s*\n?/, ''));
    }
    if (!kept.length) return '';
    const multiline = body.includes('\n');
    return multiline ? ':root{\n' + kept.map(k => '  ' + k.trim() + ';').join('\n') + '\n}' : ':root{' + kept.map(k => k.trim()).join(';') + '}';
  });
  if (Object.keys(overrides).length) report.push(`${file}: lokalne nadpisania ${JSON.stringify(overrides)} — te kolory zostają jako hex`);
  return [text, overrides];
}
function cssReplace(text, ov, file) {
  text = text.replace(HEX_RE, m => { const n = hex2name[m.toLowerCase()]; return ov[n] ? m : `var(--${n})`; });
  text = text.replace(RGB_RE, (m, r, g, b) => {
    const n = rgb2name[`${r},${g},${b}`]; if (!n || ov[n]) return m;
    return m.slice(0, m.indexOf('(') + 1) + `var(--${n}-rgb)`;
  });
  return text.replace(/var\(--([a-z-]+),\s*var\(--\1\)\)/g, 'var(--$1)');
}
// JS: zamiana hexów w literałach napisowych na kol('x') wg rodzaju cudzysłowu
function jsReplace(code, ov, file, mode) {
  code = code.replace(/var\(--([a-z-]+),\s*#[0-9a-fA-F]{6}\)/g, 'var(--$1)');
  let out = '', i = 0, stack = []; // stack: "'", '"', '`', '{'
  let changed = 0;
  const inStr = () => stack.length && "'\"`".includes(stack[stack.length-1]) ? stack[stack.length-1] : null;
  while (i < code.length) {
    const c = code[i], q = inStr();
    if (q) {
      if (c === '\\') { out += code.slice(i, i+2); i += 2; continue; }
      if (c === q) { stack.pop(); out += c; i++; continue; }
      if (q === '`' && c === '$' && code[i+1] === '{') { stack.push('{'); out += '${'; i += 2; continue; }
      const m = code.slice(i).match(/^#([0-9a-fA-F]{6})(?![0-9a-fA-F])/);
      if (m && hex2name['#' + m[1].toLowerCase()] && !ov[hex2name['#' + m[1].toLowerCase()]]) {
        const n = hex2name['#' + m[1].toLowerCase()];
        if (mode === 'var') out += `var(--${n})`;
        else out += q === '`' ? `\${kol('${n}')}` : `${q}+kol('${n}')+${q}`;
        i += 7; changed++; continue;
      }
      const r = code.slice(i).match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (r && rgb2name[`${r[1]},${r[2]},${r[3]}`]) report.push(`${file}: rgba w JS zostaje bez zmian: ${r[0]}`);
      out += c; i++; continue;
    }
    // poza napisem
    if (c === '/' && code[i+1] === '/') { const e = code.indexOf('\n', i); const j = e < 0 ? code.length : e; out += code.slice(i, j); i = j; continue; }
    if (c === '/' && code[i+1] === '*') { const e = code.indexOf('*/', i+2); const j = e < 0 ? code.length : e + 2; out += code.slice(i, j); i = j; continue; }
    if (c === '/') { // literał regex? (po operatorze / nawiasie / początku)
      const prev = out.replace(/\s+$/, '');
      const pc = prev[prev.length-1];
      if (!pc || '(,=:[!&|?{};+-*%<>~^'.includes(pc) || /\b(return|typeof|case|in|of)$/.test(prev)) {
        let j = i + 1, cls = false;
        while (j < code.length && code[j] !== '\n') {
          if (code[j] === '\\') { j += 2; continue; }
          if (code[j] === '[') cls = true; else if (code[j] === ']') cls = false;
          else if (code[j] === '/' && !cls) break;
          j++;
        }
        if (code[j] === '/') { out += code.slice(i, j+1); i = j + 1; continue; }
      }
    }
    if ("'\"`".includes(c)) { stack.push(c); out += c; i++; continue; }
    if (c === '{') { stack.push('{'); out += c; i++; continue; }
    if (c === '}') { if (stack[stack.length-1] === '{') stack.pop(); out += c; i++; continue; }
    const m = code.slice(i).match(/^#([0-9a-fA-F]{6})(?![0-9a-fA-F])/);
    if (m && hex2name['#' + m[1].toLowerCase()]) report.push(`${file}: hex poza napisem w JS (bez zmian): ${m[0]}`);
    out += c; i++;
  }
  out = out.replace(/(['"])\1\+kol\('([a-z-]+)'\)\+\1\1/g, "kol('$2')"); // '' + kol('x') + '' -> kol('x')
  return [out, changed];
}
function markupReplace(text, ov, file) {
  // atrybuty SVG nie obsługują var() — zgłoś, nie ruszaj
  text = text.replace(/\b(fill|stroke|stop-color)="(#[0-9a-fA-F]{6})"/g, (m, a, h) => {
    if (hex2name[h.toLowerCase()]) report.push(`${file}: atrybut SVG ${m} (bez zmian)`);
    return m.replace(h, '\u0000' + h.slice(1)); // chroni przed zamianą
  });
  return cssReplace(text, ov, file).replace(/\u0000/g, '#');
}

// ---------- przetwarzanie ----------
const files = [];
(function walk(d){ for (const f of fs.readdirSync(d)) { const p = path.join(d,f);
  if (fs.statSync(p).isDirectory()) { if (f !== 'ratunkowyplik' && f !== 'img') walk(p); }
  else if (/\.(html|css|js)$/i.test(f)) files.push(p); } })('public');

const BK = '_backup_centralizacja_2026-10-06';
const changedFiles = [];
for (const f of files) {
  const rel = f.split(path.sep).join('/');
  const src = fs.readFileSync(f, 'utf8');
  let out = src, needKol = false;
  if (/\.css$/.test(f)) {
    let ov; [out, ov] = stripRoot(out, rel); out = cssReplace(out, ov, rel);
    if (rel === 'public/admin/assets/admin.css' && !out.includes('kolory.css'))
      out = "@import url('kolory.css');\n" + out;
  } else if (/\.js$/.test(f)) {
    const mode = /auth-guard\.js$/.test(f) ? 'var' : 'kol';
    let n; [out, n] = jsReplace(out, {}, rel, mode);
    if (n && mode === 'kol' && !/function kol\(/.test(out))
      out = '// Kolor z palety (/admin/assets/kolory.css) — do okien wydruku, które nie mają naszego CSS\n' + KOL_FN + '\n\n' + out;
  } else {
    let ov; [out, ov] = stripRoot(out, rel);
    // podział na <script> i resztę
    out = out.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)|([\s\S]+?)(?=<script\b|$)/gi, (m, o, body, c, rest) => {
      if (rest !== undefined) return markupReplace(rest, ov, rel);
      if (/\bsrc=/.test(o)) return m;
      const [nb, n] = jsReplace(body, ov, rel, 'kol'); if (n) needKol = true;
      return o + nb + c;
    });
    const isAdmin = rel.startsWith('public/admin/');
    const usesPalette = /var\(--(burgundy|copper|cream|beige|ink|line|green|amber|red|blue|bg|white)/.test(out) || needKol;
    if (usesPalette && !isAdmin && !out.includes(LINK_PATH)) {
      const tag = `<link rel="stylesheet" href="${LINK_PATH}">` + (needKol ? `\n<script>${KOL_FN}</script>` : '');
      out = out.replace(/(<head[^>]*>\r?\n?)/i, (h) => h + tag + (h.endsWith('\n') ? '\n' : ''));
      if (!out.includes(LINK_PATH)) report.push(`${rel}: NIE znaleziono <head> — brak linku!`);
    }
    if (isAdmin && needKol && !/admin\.js/.test(out)) {
      out = out.replace(/(<head[^>]*>\r?\n?)/i, (h) => h + `<script>${KOL_FN}</script>\n`);
    }
    if (isAdmin && !/admin\.css/.test(out) && /var\(--/.test(out) && !out.includes(LINK_PATH)) {
      out = out.replace(/(<head[^>]*>\r?\n?)/i, (h) => h + `<link rel="stylesheet" href="${LINK_PATH}">\n`);
    }
  }
  if (out !== src) {
    const bk = path.join(BK, f); fs.mkdirSync(path.dirname(bk), { recursive: true }); fs.copyFileSync(f, bk);
    fs.writeFileSync(f, out); changedFiles.push(rel);
  }
}
fs.writeFileSync('public/admin/assets/kolory.css', css); changedFiles.push('public/admin/assets/kolory.css (NOWY)');
console.log('Zmienione pliki (' + changedFiles.length + '):\n  ' + changedFiles.join('\n  '));
console.log('\nUwagi:\n  ' + [...new Set(report)].join('\n  '));
