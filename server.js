const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { DatabaseSync: Database } = require('node:sqlite');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- SQLite ---
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
const db = new Database(path.join(__dirname, 'data', 'parafia.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS parafianie (
    id               TEXT PRIMARY KEY,
    imie             TEXT NOT NULL,
    nazwisko         TEXT NOT NULL,
    data_urodzenia   TEXT DEFAULT '',
    telefon          TEXT DEFAULT '',
    adres            TEXT DEFAULT '',
    email            TEXT DEFAULT '',
    sakr_chrzest     INTEGER DEFAULT 0,
    sakr_komunia     INTEGER DEFAULT 0,
    sakr_bierzmowanie INTEGER DEFAULT 0,
    sakr_slub        INTEGER DEFAULT 0,
    status           TEXT DEFAULT 'aktywny',
    data_dolaczenia  TEXT DEFAULT '',
    uwagi            TEXT DEFAULT '',
    zmarly           INTEGER DEFAULT 0
  )
`);

function rowToParafianin(row) {
  return {
    id: row.id,
    imie: row.imie,
    nazwisko: row.nazwisko,
    data_urodzenia: row.data_urodzenia || '',
    telefon: row.telefon || '',
    adres: row.adres || '',
    email: row.email || '',
    sakr: {
      chrzest:      !!row.sakr_chrzest,
      komunia:      !!row.sakr_komunia,
      bierzmowanie: !!row.sakr_bierzmowanie,
      slub:         !!row.sakr_slub
    },
    status: row.status || 'aktywny',
    data_dolaczenia: row.data_dolaczenia || '',
    uwagi: row.uwagi || '',
    zmarly: !!row.zmarly,
    created_at: row.created_at || ''
  };
}

try { db.exec("ALTER TABLE parafianie ADD COLUMN created_at TEXT DEFAULT ''"); } catch(e) {}

// ── Page visits ───────────────────────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS page_visits (
  date  TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0
)`);

app.use(function(req, res, next) {
  if (req.method === 'GET') {
    var p = req.path;
    if (!p.startsWith('/api') && !p.startsWith('/admin')) {
      var ext = path.extname(p);
      if (!ext || ext === '.html') {
        var today = new Date().toISOString().slice(0, 10);
        try {
          db.prepare('INSERT INTO page_visits (date, count) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET count = count + 1').run(today);
        } catch(e) {}
      }
    }
  }
  next();
});

app.get('/api/stats/visits', function(req, res) {
  var now = new Date();
  var d30 = new Date(now - 30*86400000).toISOString().slice(0, 10);
  var d60 = new Date(now - 60*86400000).toISOString().slice(0, 10);
  var last30 = db.prepare('SELECT COALESCE(SUM(count), 0) as total FROM page_visits WHERE date >= ?').get(d30).total;
  var prev30 = db.prepare('SELECT COALESCE(SUM(count), 0) as total FROM page_visits WHERE date >= ? AND date < ?').get(d60, d30).total;
  res.json({ last30: last30, prev30: prev30 });
});

// ── Activity log ──────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_log (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL,
    module      TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at  TEXT NOT NULL
  )
`);

function logActivity(type, module, description) {
  var id = 'act' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  var now = new Date().toISOString();
  try {
    db.prepare('INSERT INTO activity_log (id,type,module,description,created_at) VALUES (?,?,?,?,?)')
      .run(id, type, module, description, now);
  } catch(e) {}
}

app.get('/api/activity-log', function(req, res) {
  var limit = parseInt(req.query.limit) || 50;
  var module = req.query.module || '';
  var rows = module
    ? db.prepare('SELECT * FROM activity_log WHERE module=? ORDER BY created_at DESC LIMIT ?').all(module, limit)
    : db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?').all(limit);
  res.json(rows);
});
// ─────────────────────────────────────────────────────────────────────────

// Parafianie — CRUD
app.get('/api/parafianie', function(req, res) {
  var rows = db.prepare('SELECT * FROM parafianie ORDER BY nazwisko, imie').all();
  res.json(rows.map(rowToParafianin));
});

app.post('/api/parafianie', function(req, res) {
  var b = req.body;
  if (!b.imie || !b.nazwisko) return res.status(400).json({ error: 'Imię i nazwisko są wymagane' });
  var id = 'par' + Date.now().toString(36);
  var sakr = b.sakr || {};
  var nowIsoP = new Date().toISOString();
  db.prepare(`INSERT INTO parafianie
    (id,imie,nazwisko,data_urodzenia,telefon,adres,email,
     sakr_chrzest,sakr_komunia,sakr_bierzmowanie,sakr_slub,
     status,data_dolaczenia,uwagi,zmarly,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, b.imie, b.nazwisko,
      b.data_urodzenia||'', b.telefon||'', b.adres||'', b.email||'',
      sakr.chrzest?1:0, sakr.komunia?1:0, sakr.bierzmowanie?1:0, sakr.slub?1:0,
      b.status||'aktywny', b.data_dolaczenia||'', b.uwagi||'', b.zmarly?1:0, nowIsoP);
  logActivity('create', 'Parafianie', 'Dodano parafianina: ' + b.imie + ' ' + b.nazwisko);
  res.status(201).json(rowToParafianin(db.prepare('SELECT * FROM parafianie WHERE id=?').get(id)));
});

app.put('/api/parafianie/:id', function(req, res) {
  var b = req.body;
  if (!b.imie || !b.nazwisko) return res.status(400).json({ error: 'Imię i nazwisko są wymagane' });
  var r = db.prepare(`UPDATE parafianie SET
    imie=?,nazwisko=?,data_urodzenia=?,telefon=?,adres=?,email=?,
    status=?,data_dolaczenia=?,uwagi=?,zmarly=? WHERE id=?`)
    .run(b.imie, b.nazwisko,
      b.data_urodzenia||'', b.telefon||'', b.adres||'', b.email||'',
      b.status||'aktywny', b.data_dolaczenia||'', b.uwagi||'', b.zmarly?1:0,
      req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Nie znaleziono parafianina' });
  // Flagi sakramentów zawsze wynikają z realnych rekordów w tabeli sakramenty
  ['chrzciny', 'komunia', 'bierzmowanie', 'sluby'].forEach(function(type) {
    syncSakrParafianin(req.params.id, type);
  });
  logActivity('update', 'Parafianie', 'Zaktualizowano dane: ' + b.imie + ' ' + b.nazwisko);
  res.json(rowToParafianin(db.prepare('SELECT * FROM parafianie WHERE id=?').get(req.params.id)));
});

app.delete('/api/parafianie/:id', function(req, res) {
  var old = db.prepare('SELECT imie, nazwisko FROM parafianie WHERE id=?').get(req.params.id);
  var r = db.prepare('DELETE FROM parafianie WHERE id=?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Nie znaleziono parafianina' });
  if (old) logActivity('delete', 'Parafianie', 'Usunięto parafianina: ' + old.imie + ' ' + old.nazwisko);
  res.json({ ok: true });
});

// Pogrzeby — tabela
db.exec(`
  CREATE TABLE IF NOT EXISTS pogrzeby (
    id                TEXT PRIMARY KEY,
    imie              TEXT DEFAULT '',
    nazwisko          TEXT DEFAULT '',
    data_urodzenia    TEXT DEFAULT '',
    miejsce_urodzenia TEXT DEFAULT '',
    rodzice           TEXT DEFAULT '',
    miejsce_zam       TEXT DEFAULT '',
    data_zgonu        TEXT NOT NULL,
    data_pogrzebu     TEXT DEFAULT '',
    godz_pogrzebu     TEXT DEFAULT '',
    miejsce_ceremonii TEXT DEFAULT '',
    ksiadz            TEXT DEFAULT '',
    status            TEXT DEFAULT 'zgloszony',
    cmentarz          TEXT DEFAULT '',
    sektor            TEXT DEFAULT '',
    rzad              TEXT DEFAULT '',
    miejsce_grobu     TEXT DEFAULT '',
    rok               INTEGER DEFAULT 0,
    parafianin_id     TEXT DEFAULT ''
  )
`);

function rowToPogrzeb(row) {
  return {
    id: row.id,
    imie: row.imie || '',
    nazwisko: row.nazwisko || '',
    data_urodzenia: row.data_urodzenia || '',
    miejsce_urodzenia: row.miejsce_urodzenia || '',
    rodzice: row.rodzice || '',
    miejsce_zam: row.miejsce_zam || '',
    data_zgonu: row.data_zgonu || '',
    data_pogrzebu: row.data_pogrzebu || '',
    godz_pogrzebu: row.godz_pogrzebu || '',
    miejsce_ceremonii: row.miejsce_ceremonii || '',
    ksiadz: row.ksiadz || '',
    status: row.status || 'zgloszony',
    cmentarz: row.cmentarz || '',
    sektor: row.sektor || '',
    rzad: row.rzad || '',
    miejsce_grobu: row.miejsce_grobu || '',
    rok: row.rok || 0,
    parafianin_id: row.parafianin_id || null
  };
}

// Pogrzeby — CRUD
app.get('/api/pogrzeby', function(req, res) {
  res.json(db.prepare('SELECT * FROM pogrzeby ORDER BY data_zgonu DESC').all().map(rowToPogrzeb));
});

app.post('/api/pogrzeby', function(req, res) {
  var b = req.body;
  if (!b.data_zgonu) return res.status(400).json({ error: 'Data zgonu jest wymagana' });
  var id = 'pgr' + Date.now().toString(36);
  db.prepare(`INSERT INTO pogrzeby
    (id,imie,nazwisko,data_urodzenia,miejsce_urodzenia,rodzice,miejsce_zam,
     data_zgonu,data_pogrzebu,godz_pogrzebu,miejsce_ceremonii,ksiadz,status,
     cmentarz,sektor,rzad,miejsce_grobu,rok,parafianin_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id,
      b.imie||'', b.nazwisko||'',
      b.data_urodzenia||'', b.miejsce_urodzenia||'', b.rodzice||'', b.miejsce_zam||'',
      b.data_zgonu, b.data_pogrzebu||'', b.godz_pogrzebu||'', b.miejsce_ceremonii||'',
      b.ksiadz||'', b.status||'zgloszony',
      b.cmentarz||'', b.sektor||'', b.rzad||'', b.miejsce_grobu||'',
      b.rok||0, b.parafianin_id||'');
  logActivity('create', 'Pogrzeby', 'Zarejestrowano pogrzeb: ' + (b.imie||'') + ' ' + (b.nazwisko||''));
  res.status(201).json(rowToPogrzeb(db.prepare('SELECT * FROM pogrzeby WHERE id=?').get(id)));
});

app.put('/api/pogrzeby/:id', function(req, res) {
  var b = req.body;
  if (!b.data_zgonu) return res.status(400).json({ error: 'Data zgonu jest wymagana' });
  var r = db.prepare(`UPDATE pogrzeby SET
    imie=?,nazwisko=?,data_urodzenia=?,miejsce_urodzenia=?,rodzice=?,miejsce_zam=?,
    data_zgonu=?,data_pogrzebu=?,godz_pogrzebu=?,miejsce_ceremonii=?,ksiadz=?,status=?,
    cmentarz=?,sektor=?,rzad=?,miejsce_grobu=?,rok=?,parafianin_id=? WHERE id=?`)
    .run(
      b.imie||'', b.nazwisko||'',
      b.data_urodzenia||'', b.miejsce_urodzenia||'', b.rodzice||'', b.miejsce_zam||'',
      b.data_zgonu, b.data_pogrzebu||'', b.godz_pogrzebu||'', b.miejsce_ceremonii||'',
      b.ksiadz||'', b.status||'zgloszony',
      b.cmentarz||'', b.sektor||'', b.rzad||'', b.miejsce_grobu||'',
      b.rok||0, b.parafianin_id||'',
      req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Nie znaleziono pogrzebu' });
  logActivity('update', 'Pogrzeby', 'Zaktualizowano pogrzeb: ' + (b.imie||'') + ' ' + (b.nazwisko||''));
  res.json(rowToPogrzeb(db.prepare('SELECT * FROM pogrzeby WHERE id=?').get(req.params.id)));
});

app.delete('/api/pogrzeby/:id', function(req, res) {
  var old = db.prepare('SELECT imie, nazwisko FROM pogrzeby WHERE id=?').get(req.params.id);
  var r = db.prepare('DELETE FROM pogrzeby WHERE id=?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Nie znaleziono pogrzebu' });
  if (old) logActivity('delete', 'Pogrzeby', 'Usunięto pogrzeb: ' + (old.imie||'') + ' ' + (old.nazwisko||''));
  res.json({ ok: true });
});

// Settings table
db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT DEFAULT '')`);

// Intencje tables
db.exec(`
  CREATE TABLE IF NOT EXISTS intencje (
    id        TEXT PRIMARY KEY,
    date      TEXT NOT NULL,
    time      TEXT DEFAULT '',
    type      TEXT DEFAULT 'w_int',
    intention TEXT DEFAULT '',
    oplacona  INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS intencje_pending (
    id           TEXT PRIMARY KEY,
    imie         TEXT DEFAULT '',
    telefon      TEXT DEFAULT '',
    date         TEXT NOT NULL,
    time         TEXT DEFAULT '',
    type         TEXT DEFAULT 'w_int',
    intention    TEXT DEFAULT '',
    submitted_at TEXT DEFAULT ''
  )
`);

// Migrate: add telefon, zamawiajacy, reminder columns to intencje if missing
['zamawiajacy','telefon','r1_date','r2_date'].forEach(function(col){
  try { db.exec('ALTER TABLE intencje ADD COLUMN '+col+' TEXT DEFAULT \'\''); } catch(e) {}
});
['reminder1_sent','reminder2_sent'].forEach(function(col){
  try { db.exec('ALTER TABLE intencje ADD COLUMN '+col+' INTEGER DEFAULT 0'); } catch(e) {}
});
['r1_hour','r2_hour'].forEach(function(col){
  try { db.exec('ALTER TABLE intencje ADD COLUMN '+col+' INTEGER DEFAULT 8'); } catch(e) {}
});

function rowToIntencja(row) {
  return { id: row.id, date: row.date||'', time: row.time||'', type: row.type||'w_int', intention: row.intention||'', oplacona: !!row.oplacona, zamawiajacy: row.zamawiajacy||'', telefon: row.telefon||'', r1_date: row.r1_date||'', r2_date: row.r2_date||'', r1_hour: row.r1_hour!=null?row.r1_hour:8, r2_hour: row.r2_hour!=null?row.r2_hour:8, reminder1_sent: !!row.reminder1_sent, reminder2_sent: !!row.reminder2_sent };
}

function calcReminderDate(massDate, days) {
  if (!massDate || days===null || days===undefined || days==='') return '';
  var d = new Date(massDate + 'T12:00:00');
  d.setDate(d.getDate() - parseInt(days));
  return d.toISOString().slice(0,10);
}
function rowToPending(row) {
  return { id: row.id, imie: row.imie||'', telefon: row.telefon||'', date: row.date||'', time: row.time||'', type: row.type||'w_int', intention: row.intention||'', submitted_at: row.submitted_at||'' };
}

// Homepage tiles API
app.get('/api/hp', function(req, res) {
  var now   = new Date();
  var today = now.toISOString().slice(0, 10);

  // Settings: kancelaria + wyróżniona intencja
  var rows = db.prepare('SELECT key, value FROM settings WHERE key IN (?,?,?)').all(
    'hp_kancelaria_linia1','hp_kancelaria_linia2','hp_intencja_id'
  );
  var s = {};
  rows.forEach(function(r){ try { s[r.key] = JSON.parse(r.value); } catch(e){ s[r.key] = r.value; } });

  // Najbliższe ogłoszenie po dziś
  var ogl = db.prepare(
    "SELECT title, date FROM ogloszenia WHERE status='published' AND date >= ? ORDER BY date ASC LIMIT 1"
  ).get(today);

  // Najbliższa msza — auto z intencje
  var msza = db.prepare(
    "SELECT date, time, intention FROM intencje WHERE date >= ? ORDER BY date ASC, time ASC LIMIT 1"
  ).get(today);

  // Intencja tygodnia — wybrana przez ks. z settings
  var int_ = null;
  if (s.hp_intencja_id) {
    int_ = db.prepare("SELECT date, intention FROM intencje WHERE id=?").get(s.hp_intencja_id);
  }

  function fmtDate(d) {
    if (!d) return '';
    var p = d.split('-');
    if (p.length < 3) return d;
    var ms = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
    return parseInt(p[2],10) + ' ' + ms[parseInt(p[1],10)-1] + ' ' + p[0];
  }

  function fmtMsza(row) {
    var t   = (row.time || '').replace(/^(\d{2}):(\d{2}).*/, '$1:$2');
    var tom = new Date(now); tom.setDate(tom.getDate() + 1);
    var dni = ['Niedz.','Pon.','Wt.','Śr.','Czw.','Pt.','Sob.'];
    var label;
    if (row.date === today) label = 'Dziś';
    else if (row.date === tom.toISOString().slice(0,10)) label = 'Jutro';
    else label = dni[new Date(row.date + 'T12:00:00').getDay()];
    return t ? label + ', ' + t : label;
  }

  res.json({
    msza: msza ? {
      value: fmtMsza(msza),
      sub:   msza.intention || ''
    } : { value: '—', sub: '' },
    kancelaria: {
      value: s.hp_kancelaria_linia1 || '',
      sub:   s.hp_kancelaria_linia2 || ''
    },
    wydarzenie: ogl ? { value: ogl.title, sub: fmtDate(ogl.date) } : null,
    intencja:   int_ ? { value: int_.intention, sub: fmtDate(int_.date) } : null
  });
});

// Settings CRUD
app.get('/api/settings', function(req, res) {
  var rows = db.prepare('SELECT key, value FROM settings').all();
  var s = {};
  rows.forEach(function(r) { try { s[r.key] = JSON.parse(r.value); } catch(e) { s[r.key] = r.value; } });
  res.json(s);
});

app.put('/api/settings', function(req, res) {
  var b = req.body;
  Object.keys(b).forEach(function(key) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(b[key]));
  });
  res.json({ ok: true });
});

// Intencje CRUD
app.get('/api/intencje', function(req, res) {
  res.json(db.prepare('SELECT * FROM intencje ORDER BY date, time').all().map(rowToIntencja));
});

app.post('/api/intencje', function(req, res) {
  var b = req.body;
  if (!b.date || !b.intention) return res.status(400).json({ error: 'Data i treść intencji są wymagane' });
  var id = 'int' + Date.now().toString(36);
  var r1d = b.r1_days ? calcReminderDate(b.date, b.r1_days) : '';
  var r2d = b.r2_days ? calcReminderDate(b.date, b.r2_days) : '';
  db.prepare('INSERT INTO intencje (id,date,time,type,intention,oplacona,zamawiajacy,telefon,r1_date,r2_date) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, b.date, b.time||'', b.type||'w_int', b.intention, b.oplacona?1:0, b.zamawiajacy||'', b.telefon||'', r1d, r2d);
  logActivity('create', 'Intencje', 'Dodano intencję na ' + b.date + (b.time?' '+b.time:'') + ': ' + (b.intention||'').slice(0,60));
  res.status(201).json(rowToIntencja(db.prepare('SELECT * FROM intencje WHERE id=?').get(id)));
});

app.put('/api/intencje/:id', function(req, res) {
  var b = req.body;
  var r1d = b.r1_days!==undefined && b.r1_days!=='' ? calcReminderDate(b.date||'', b.r1_days) : (b.r1_date !== undefined ? b.r1_date : null);
  var r2d = b.r2_days!==undefined && b.r2_days!=='' ? calcReminderDate(b.date||'', b.r2_days) : (b.r2_date !== undefined ? b.r2_date : null);
  var r1h = b.r1_hour !== undefined ? parseInt(b.r1_hour) : null;
  var r2h = b.r2_hour !== undefined ? parseInt(b.r2_hour) : null;
  var existing = db.prepare('SELECT * FROM intencje WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono intencji' });
  db.prepare('UPDATE intencje SET date=?,time=?,type=?,intention=?,oplacona=?,zamawiajacy=?,telefon=?,r1_date=?,r2_date=?,r1_hour=?,r2_hour=?,reminder1_sent=?,reminder2_sent=? WHERE id=?')
    .run(b.date||existing.date, b.time||existing.time||'', b.type||existing.type||'w_int', b.intention!==undefined?b.intention:existing.intention||'', b.oplacona!==undefined?b.oplacona?1:0:existing.oplacona, b.zamawiajacy!==undefined?b.zamawiajacy:existing.zamawiajacy||'', b.telefon!==undefined?b.telefon:existing.telefon||'', r1d!==null?r1d:existing.r1_date||'', r2d!==null?r2d:existing.r2_date||'', r1h!==null?r1h:(existing.r1_hour!=null?existing.r1_hour:8), r2h!==null?r2h:(existing.r2_hour!=null?existing.r2_hour:8), b.reminder1_sent!==undefined?b.reminder1_sent?1:0:existing.reminder1_sent, b.reminder2_sent!==undefined?b.reminder2_sent?1:0:existing.reminder2_sent, req.params.id);
  logActivity('update', 'Intencje', 'Zaktualizowano intencję na ' + (b.date||existing.date) + ': ' + ((b.intention!==undefined?b.intention:existing.intention)||'').slice(0,60));
  res.json(rowToIntencja(db.prepare('SELECT * FROM intencje WHERE id=?').get(req.params.id)));
});

app.delete('/api/intencje/:id', function(req, res) {
  var old = db.prepare('SELECT date, time, intention FROM intencje WHERE id=?').get(req.params.id);
  var r = db.prepare('DELETE FROM intencje WHERE id=?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Nie znaleziono intencji' });
  if (old) logActivity('delete', 'Intencje', 'Usunięto intencję na ' + old.date + (old.time?' '+old.time:'') + ': ' + (old.intention||'').slice(0,60));
  res.json({ ok: true });
});

// Pending intencje
app.get('/api/intencje/pending', function(req, res) {
  res.json(db.prepare('SELECT * FROM intencje_pending ORDER BY submitted_at').all().map(rowToPending));
});

app.post('/api/intencje/pending', function(req, res) {
  var b = req.body;
  if (!b.date || !b.intention) return res.status(400).json({ error: 'Data i treść są wymagane' });
  var id = 'pend' + Date.now().toString(36);
  db.prepare('INSERT INTO intencje_pending (id,imie,telefon,date,time,type,intention,submitted_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, b.imie||'', b.telefon||'', b.date, b.time||'', b.type||'w_int', b.intention, b.submitted_at||new Date().toISOString());
  res.status(201).json(rowToPending(db.prepare('SELECT * FROM intencje_pending WHERE id=?').get(id)));
});

app.post('/api/intencje/pending/:id/accept', function(req, res) {
  var item = db.prepare('SELECT * FROM intencje_pending WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Nie znaleziono zgłoszenia' });
  var newId = 'int' + Date.now().toString(36);
  db.prepare('INSERT INTO intencje (id,date,time,type,intention,oplacona,zamawiajacy,telefon) VALUES (?,?,?,?,?,0,?,?)')
    .run(newId, item.date, item.time||'', item.type||'w_int', item.intention||'', item.imie||'', item.telefon||'');
  db.prepare('DELETE FROM intencje_pending WHERE id=?').run(req.params.id);
  logActivity('create', 'Intencje', 'Zaakceptowano zgłoszenie intencji na ' + item.date + ': ' + (item.intention||'').slice(0,60));
  res.json({ intencja: rowToIntencja(db.prepare('SELECT * FROM intencje WHERE id=?').get(newId)), pending: rowToPending(item) });
});

app.put('/api/intencje/pending/:id', function(req, res) {
  var { date, time, type, intention, telefon } = req.body;
  var r = db.prepare('UPDATE intencje_pending SET date=?, time=?, type=?, intention=?, telefon=? WHERE id=?')
    .run(date, time, type, intention, telefon !== undefined ? telefon : null, req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Nie znaleziono zgłoszenia' });
  res.json(rowToPending(db.prepare('SELECT * FROM intencje_pending WHERE id=?').get(req.params.id)));
});

app.delete('/api/intencje/pending/:id', function(req, res) {
  var r = db.prepare('DELETE FROM intencje_pending WHERE id=?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Nie znaleziono zgłoszenia' });
  res.json({ ok: true });
});

// Sakramenty — tabela
db.exec(`
  CREATE TABLE IF NOT EXISTS sakramenty (
    id                TEXT PRIMARY KEY,
    type              TEXT NOT NULL,
    rok               INTEGER DEFAULT 0,
    imie              TEXT DEFAULT '',
    nazwisko          TEXT DEFAULT '',
    dataurodzenia     TEXT DEFAULT '',
    rodzic            TEXT DEFAULT '',
    katecheta         TEXT DEFAULT '',
    imie_bierzmowania TEXT DEFAULT '',
    miejsce           TEXT DEFAULT '',
    imie_ojca         TEXT DEFAULT '',
    nazwisko_ojca     TEXT DEFAULT '',
    imie_matki        TEXT DEFAULT '',
    nazwisko_matki    TEXT DEFAULT '',
    datachrztu        TEXT DEFAULT '',
    ksiega_rok        INTEGER DEFAULT 0,
    ksiega_str        INTEGER DEFAULT 0,
    ksiega_nr         INTEGER DEFAULT 0,
    uwagi             TEXT DEFAULT '',
    oblubieniec       TEXT DEFAULT '',
    oblubienica       TEXT DEFAULT '',
    datasl            TEXT DEFAULT '',
    typ_slubu         TEXT DEFAULT '',
    zapowiedzi        INTEGER DEFAULT 0,
    szkola            TEXT DEFAULT '',
    datakom           TEXT DEFAULT '',
    status            TEXT DEFAULT ''
  )
`);

// Add parishioner link columns (backward-compatible, no-op if already exist)
['parafianin_id', 'malzonek1_id', 'malzonek2_id'].forEach(function(col) {
  try { db.exec("ALTER TABLE sakramenty ADD COLUMN " + col + " TEXT DEFAULT ''"); } catch(e) {}
});
try { db.exec("ALTER TABLE sakramenty ADD COLUMN created_at TEXT DEFAULT ''"); } catch(e) {}

// Seed sample data — INSERT OR IGNORE runs on every start, safe to repeat
(function(){
  var S=db.prepare('INSERT OR IGNORE INTO sakramenty (id,type,rok,imie,nazwisko,dataurodzenia,rodzic,katecheta,imie_bierzmowania,miejsce,imie_ojca,nazwisko_ojca,imie_matki,nazwisko_matki,datachrztu,ksiega_rok,ksiega_str,ksiega_nr,uwagi,oblubieniec,oblubienica,datasl,typ_slubu,zapowiedzi,szkola,datakom,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  [
    // bierzmowanie (24)
    ['bierz-01','bierzmowanie',2023,'Piotr','Kowalski','2007-03-15','Anna Kowalska','ks. Marek Wiśniewski','Józef','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-02','bierzmowanie',2023,'Katarzyna','Nowak','2007-08-22','Tomasz Nowak','ks. Marek Wiśniewski','Maria','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-03','bierzmowanie',2023,'Michał','Wójcik','2007-11-05','Beata Wójcik','ks. Marek Wiśniewski','Michał','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-04','bierzmowanie',2023,'Anna','Kowalczyk','2007-02-18','Józef Kowalczyk','ks. Marek Wiśniewski','Teresa','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-05','bierzmowanie',2023,'Tomasz','Wiśniewski','2006-12-01','Halina Wiśniewska','ks. Marek Wiśniewski','Tomasz','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-06','bierzmowanie',2023,'Magdalena','Dąbrowska','2007-04-30','Krzysztof Dąbrowski','ks. Marek Wiśniewski','Maria','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-07','bierzmowanie',2023,'Jakub','Lewandowski','2007-07-14','Irena Lewandowska','ks. Marek Wiśniewski','Jakub','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-08','bierzmowanie',2023,'Natalia','Zielińska','2007-09-28','Andrzej Zieliński','ks. Marek Wiśniewski','Anna','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-09','bierzmowanie',2023,'Bartosz','Szymański','2006-10-10','Zofia Szymańska','ks. Marek Wiśniewski','Jan','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-10','bierzmowanie',2023,'Weronika','Woźniak','2007-01-25','Paweł Woźniak','ks. Marek Wiśniewski','Weronika','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-11','bierzmowanie',2024,'Adrian','Kozłowski','2008-06-03','Monika Kozłowska','ks. Marek Wiśniewski','Adrian','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-12','bierzmowanie',2024,'Dominika','Jankowska','2008-03-17','Leszek Jankowski','ks. Marek Wiśniewski','Dominika','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-13','bierzmowanie',2024,'Łukasz','Mazur','2008-08-09','Elżbieta Mazur','ks. Marek Wiśniewski','Łukasz','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-14','bierzmowanie',2024,'Julia','Piotrowska','2008-11-22','Ryszard Piotrowski','ks. Marek Wiśniewski','Julia','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-15','bierzmowanie',2024,'Szymon','Grabowski','2008-01-07','Barbara Grabowska','ks. Marek Wiśniewski','Szymon','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-16','bierzmowanie',2024,'Aleksandra','Nowakowska','2008-05-14','Janusz Nowakowski','ks. Marek Wiśniewski','Aleksandra','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-17','bierzmowanie',2024,'Kamil','Michalski','2007-12-28','Danuta Michalska','ks. Marek Wiśniewski','Kamil','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-18','bierzmowanie',2024,'Paulina','Krawczyk','2008-04-19','Stanisław Krawczyk','ks. Marek Wiśniewski','Paulina','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-19','bierzmowanie',2024,'Dawid','Kaczmarek','2008-07-31','Halina Kaczmarek','ks. Marek Wiśniewski','Dawid','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-20','bierzmowanie',2024,'Martyna','Zając','2008-09-05','Waldemar Zając','ks. Marek Wiśniewski','Martyna','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-21','bierzmowanie',2025,'Mateusz','Król','2009-02-14','Renata Król','ks. Marek Wiśniewski','Mateusz','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-22','bierzmowanie',2025,'Oliwia','Wieczorek','2009-06-27','Grzegorz Wieczorek','ks. Marek Wiśniewski','Oliwia','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-23','bierzmowanie',2025,'Artur','Pawlak','2009-10-08','Jadwiga Pawlak','ks. Marek Wiśniewski','Artur','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    ['bierz-24','bierzmowanie',2025,'Klaudia','Sikora','2009-03-23','Tadeusz Sikora','ks. Marek Wiśniewski','Klaudia','Parafia NSPJ','','','','','',0,0,0,'','','','','',0,'','',''],
    // chrzciny (7)
    ['chrzest-01','chrzciny',2022,'Zuzanna','Kowalska','2022-02-10','','','','','Andrzej','Kowalski','Maria','Kowalska','2022-03-06',2022,45,12,'','','','','',0,'','',''],
    ['chrzest-02','chrzciny',2022,'Franciszek','Nowak','2022-04-15','','','','','Robert','Nowak','Katarzyna','Nowak','2022-05-01',2022,47,3,'','','','','',0,'','',''],
    ['chrzest-03','chrzciny',2023,'Maja','Wiśniewska','2023-01-08','','','','','Tomasz','Wiśniewski','Agnieszka','Wiśniewska','2023-02-12',2023,49,7,'','','','','',0,'','',''],
    ['chrzest-04','chrzciny',2023,'Aleksander','Kowalczyk','2023-07-22','','','','','Krzysztof','Kowalczyk','Anna','Kowalczyk','2023-08-20',2023,51,2,'','','','','',0,'','',''],
    ['chrzest-05','chrzciny',2024,'Hanna','Dąbrowska','2024-03-11','','','','','Paweł','Dąbrowski','Monika','Dąbrowska','2024-04-07',2024,53,9,'','','','','',0,'','',''],
    ['chrzest-06','chrzciny',2024,'Leon','Zieliński','2024-08-05','','','','','Michał','Zieliński','Ewa','Zielińska','2024-09-01',2024,54,15,'','','','','',0,'','',''],
    ['chrzest-07','chrzciny',2025,'Zofia','Szymańska','2025-01-19','','','','','Marcin','Szymański','Karolina','Szymańska','2025-02-16',2025,56,4,'','','','','',0,'','',''],
    // śluby (3)
    ['slub-01','sluby',2023,'','','','','','','','','','','','',0,0,0,'','Piotr Nowak','Marta Kowalska','2023-06-10','konkordatowy',1,'','',''],
    ['slub-02','sluby',2024,'','','','','','','','','','','','',0,0,0,'','Tomasz Wiśniewski','Anna Dąbrowska','2024-08-24','konkordatowy',1,'','',''],
    ['slub-03','sluby',2025,'','','','','','','','','','','','',0,0,0,'','Michał Kowalczyk','Katarzyna Zielińska','2025-05-17','kościelny',1,'','',''],
    // komunia (31)
    ['kom-01','komunia',2022,'Antoni','Kowalski','2014-04-12','Beata Kowalska','s. Jadwiga','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2022-05-22','tak'],
    ['kom-02','komunia',2022,'Hanna','Nowak','2014-07-30','Józef Nowak','s. Jadwiga','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2022-05-22','tak'],
    ['kom-03','komunia',2022,'Mikołaj','Wiśniewski','2014-02-14','Maria Wiśniewska','s. Jadwiga','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2022-05-29','tak'],
    ['kom-04','komunia',2022,'Lena','Kowalczyk','2014-09-08','Adam Kowalczyk','s. Jadwiga','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2022-05-29','tak'],
    ['kom-05','komunia',2022,'Kacper','Dąbrowski','2014-11-03','Irena Dąbrowska','s. Jadwiga','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2022-05-22','tak'],
    ['kom-06','komunia',2022,'Amelia','Zielińska','2014-06-25','Piotr Zieliński','s. Jadwiga','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2022-05-22','tak'],
    ['kom-07','komunia',2022,'Nikodem','Szymański','2015-01-17','Barbara Szymańska','s. Jadwiga','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2022-05-29','tak'],
    ['kom-08','komunia',2023,'Zofia','Lewandowska','2015-03-28','Krzysztof Lewandowski','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2023-05-21','tak'],
    ['kom-09','komunia',2023,'Jakub','Wójcik','2015-08-14','Elżbieta Wójcik','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2023-05-21','tak'],
    ['kom-10','komunia',2023,'Natalia','Mazur','2015-12-02','Ryszard Mazur','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2023-05-28','tak'],
    ['kom-11','komunia',2023,'Filip','Krawczyk','2015-05-19','Halina Krawczyk','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2023-05-28','tak'],
    ['kom-12','komunia',2023,'Laura','Piotrowska','2015-10-07','Stanisław Piotrowski','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2023-05-21','tak'],
    ['kom-13','komunia',2023,'Dawid','Grabowski','2016-02-23','Monika Grabowska','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2023-05-21','tak'],
    ['kom-14','komunia',2023,'Julia','Nowakowska','2015-07-11','Andrzej Nowakowski','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2023-05-28','tak'],
    ['kom-15','komunia',2023,'Szymon','Michalski','2015-11-30','Renata Michalska','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2023-05-28','tak'],
    ['kom-16','komunia',2024,'Maja','Kozłowska','2016-04-15','Waldemar Kozłowski','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2024-05-19','tak'],
    ['kom-17','komunia',2024,'Oliwia','Jankowska','2016-09-03','Danuta Jankowski','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2024-05-19','tak'],
    ['kom-18','komunia',2024,'Bartłomiej','Zając','2016-06-20','Grażyna Zając','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2024-05-26','tak'],
    ['kom-19','komunia',2024,'Wiktoria','Kaczmarek','2016-12-09','Tadeusz Kaczmarek','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2024-05-26','tak'],
    ['kom-20','komunia',2024,'Patryk','Pawlak','2016-03-27','Jadwiga Pawlak','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2024-05-19','tak'],
    ['kom-21','komunia',2024,'Zuzanna','Sikora','2016-07-14','Grzegorz Sikora','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2024-05-19','tak'],
    ['kom-22','komunia',2024,'Kamil','Wieczorek','2016-11-01','Agnieszka Wieczorek','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2024-05-26','tak'],
    ['kom-23','komunia',2024,'Alicja','Król','2016-08-18','Marek Król','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2024-05-26','tak'],
    ['kom-24','komunia',2025,'Aleksander','Wojciechowski','2017-01-05','Anna Wojciechowska','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2025-06-01','tak'],
    ['kom-25','komunia',2025,'Natalia','Adamska','2017-05-22','Robert Adamski','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2025-06-01','tak'],
    ['kom-26','komunia',2025,'Szymon','Kwiatkowski','2017-09-16','Ewa Kwiatkowska','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2025-06-08','tak'],
    ['kom-27','komunia',2025,'Amelia','Mazurek','2017-03-31','Leszek Mazurek','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2025-06-08','tak'],
    ['kom-28','komunia',2025,'Mikołaj','Zawadzki','2017-07-08','Marta Zawadzka','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2025-06-01','tak'],
    ['kom-29','komunia',2025,'Hanna','Nowacka','2017-11-25','Tomasz Nowacki','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 3 Mikołów','2025-06-01','tak'],
    ['kom-30','komunia',2025,'Franciszek','Walczak','2017-04-13','Katarzyna Walczak','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2025-06-08','tak'],
    ['kom-31','komunia',2025,'Zofia','Woźniak','2017-08-30','Paweł Woźniak','ks. Marek Wiśniewski','','','','','','','',0,0,0,'','','','','',0,'SP nr 5 Mikołów','2025-06-08','tak']
  ].forEach(function(r){S.run(r[0],r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9],r[10],r[11],r[12],r[13],r[14],r[15],r[16],r[17],r[18],r[19],r[20],r[21],r[22],r[23],r[24],r[25],r[26]);});
})();

function rowToSakrament(row) {
  return {
    id: row.id, type: row.type, rok: row.rok || 0,
    imie: row.imie || '', nazwisko: row.nazwisko || '',
    dataurodzenia: row.dataurodzenia || '',
    rodzic: row.rodzic || '', katecheta: row.katecheta || '',
    imie_bierzmowania: row.imie_bierzmowania || '', miejsce: row.miejsce || '',
    imie_ojca: row.imie_ojca || '', nazwisko_ojca: row.nazwisko_ojca || '',
    imie_matki: row.imie_matki || '', nazwisko_matki: row.nazwisko_matki || '',
    datachrztu: row.datachrztu || '',
    ksiega_rok: row.ksiega_rok || 0, ksiega_str: row.ksiega_str || 0, ksiega_nr: row.ksiega_nr || 0,
    uwagi: row.uwagi || '',
    oblubieniec: row.oblubieniec || '', oblubienica: row.oblubienica || '',
    datasl: row.datasl || '', typ_slubu: row.typ_slubu || '',
    zapowiedzi: row.zapowiedzi || 0,
    szkola: row.szkola || '', datakom: row.datakom || '',
    status: row.status || '',
    parafianin_id: row.parafianin_id || '',
    malzonek1_id: row.malzonek1_id || '',
    malzonek2_id: row.malzonek2_id || '',
    created_at: row.created_at || ''
  };
}

// Sakramenty — CRUD

var TYPE_TO_SAKR_COL = {
  chrzest: 'sakr_chrzest',
  chrzciny: 'sakr_chrzest',
  komunia: 'sakr_komunia',
  bierzmowanie: 'sakr_bierzmowanie',
  slub: 'sakr_slub',
  sluby: 'sakr_slub'
};

function syncSakrParafianin(parafianinId, type) {
  if (!parafianinId || !TYPE_TO_SAKR_COL[type]) return;
  var col = TYPE_TO_SAKR_COL[type];
  var exists = db.prepare('SELECT 1 FROM sakramenty WHERE parafianin_id=? AND type=? LIMIT 1').get(parafianinId, type);
  db.prepare('UPDATE parafianie SET ' + col + '=? WHERE id=?').run(exists ? 1 : 0, parafianinId);
}

app.get('/api/sakramenty', function(req, res) {
  res.json(db.prepare('SELECT * FROM sakramenty ORDER BY rok DESC, type, nazwisko, imie').all().map(rowToSakrament));
});

app.post('/api/sakramenty', function(req, res) {
  var b = req.body;
  if (!b.type) return res.status(400).json({ error: 'Typ sakramentu jest wymagany' });
  var id = b.id || (b.type + '-' + Date.now().toString(36));
  var nowIso = new Date().toISOString().slice(0,10);
  db.prepare(`INSERT INTO sakramenty
    (id,type,rok,imie,nazwisko,dataurodzenia,rodzic,katecheta,imie_bierzmowania,miejsce,
     imie_ojca,nazwisko_ojca,imie_matki,nazwisko_matki,datachrztu,ksiega_rok,ksiega_str,ksiega_nr,uwagi,
     oblubieniec,oblubienica,datasl,typ_slubu,zapowiedzi,szkola,datakom,status,
     parafianin_id,malzonek1_id,malzonek2_id,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, b.type, b.rok||0,
      b.imie||'', b.nazwisko||'', b.dataurodzenia||'', b.rodzic||'', b.katecheta||'',
      b.imie_bierzmowania||'', b.miejsce||'',
      b.imie_ojca||'', b.nazwisko_ojca||'', b.imie_matki||'', b.nazwisko_matki||'',
      b.datachrztu||'', b.ksiega_rok||0, b.ksiega_str||0, b.ksiega_nr||0, b.uwagi||'',
      b.oblubieniec||'', b.oblubienica||'', b.datasl||'', b.typ_slubu||'',
      b.zapowiedzi||0, b.szkola||'', b.datakom||'', b.status||'',
      b.parafianin_id||'', b.malzonek1_id||'', b.malzonek2_id||'', nowIso);
  syncSakrParafianin(b.parafianin_id, b.type);
  if (b.malzonek1_id) syncSakrParafianin(b.malzonek1_id, b.type);
  if (b.malzonek2_id) syncSakrParafianin(b.malzonek2_id, b.type);
  var sakrName = {chrzciny:'Chrzest',komunia:'Komunia',bierzmowanie:'Bierzmowanie',sluby:'Ślub'}[b.type]||b.type;
  logActivity('create', 'Sakramenty', 'Zarejestrowano ' + sakrName + ': ' + (b.imie||'') + ' ' + (b.nazwisko||b.oblubieniec||''));
  res.status(201).json(rowToSakrament(db.prepare('SELECT * FROM sakramenty WHERE id=?').get(id)));
});

app.put('/api/sakramenty/:id', function(req, res) {
  var b = req.body;
  var old = db.prepare('SELECT parafianin_id, malzonek1_id, malzonek2_id, type FROM sakramenty WHERE id=?').get(req.params.id);
  var r = db.prepare(`UPDATE sakramenty SET
    type=?,rok=?,imie=?,nazwisko=?,dataurodzenia=?,rodzic=?,katecheta=?,imie_bierzmowania=?,miejsce=?,
    imie_ojca=?,nazwisko_ojca=?,imie_matki=?,nazwisko_matki=?,datachrztu=?,ksiega_rok=?,ksiega_str=?,ksiega_nr=?,uwagi=?,
    oblubieniec=?,oblubienica=?,datasl=?,typ_slubu=?,zapowiedzi=?,szkola=?,datakom=?,status=?,
    parafianin_id=?,malzonek1_id=?,malzonek2_id=? WHERE id=?`)
    .run(b.type||'', b.rok||0,
      b.imie||'', b.nazwisko||'', b.dataurodzenia||'', b.rodzic||'', b.katecheta||'',
      b.imie_bierzmowania||'', b.miejsce||'',
      b.imie_ojca||'', b.nazwisko_ojca||'', b.imie_matki||'', b.nazwisko_matki||'',
      b.datachrztu||'', b.ksiega_rok||0, b.ksiega_str||0, b.ksiega_nr||0, b.uwagi||'',
      b.oblubieniec||'', b.oblubienica||'', b.datasl||'', b.typ_slubu||'',
      b.zapowiedzi||0, b.szkola||'', b.datakom||'', b.status||'',
      b.parafianin_id||'', b.malzonek1_id||'', b.malzonek2_id||'',
      req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Nie znaleziono rekordu' });
  // sync stary i nowy parafianin_id (jeśli się zmienił)
  var newType = b.type || (old && old.type) || '';
  var ids = new Set([b.parafianin_id, b.malzonek1_id, b.malzonek2_id,
                     old && old.parafianin_id, old && old.malzonek1_id, old && old.malzonek2_id].filter(Boolean));
  ids.forEach(function(pid) { syncSakrParafianin(pid, newType); });
  var sakrNameU = {chrzciny:'Chrzest',komunia:'Komunia',bierzmowanie:'Bierzmowanie',sluby:'Ślub'}[newType]||newType;
  logActivity('update', 'Sakramenty', 'Zaktualizowano ' + sakrNameU + ': ' + (b.imie||'') + ' ' + (b.nazwisko||b.oblubieniec||''));
  res.json(rowToSakrament(db.prepare('SELECT * FROM sakramenty WHERE id=?').get(req.params.id)));
});

app.delete('/api/sakramenty/:id', function(req, res) {
  var old = db.prepare('SELECT parafianin_id, malzonek1_id, malzonek2_id, type, imie, nazwisko, oblubieniec FROM sakramenty WHERE id=?').get(req.params.id);
  var r = db.prepare('DELETE FROM sakramenty WHERE id=?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Nie znaleziono rekordu' });
  if (old) {
    [old.parafianin_id, old.malzonek1_id, old.malzonek2_id].filter(Boolean).forEach(function(pid) {
      syncSakrParafianin(pid, old.type);
    });
    var sakrNameD = {chrzciny:'Chrzest',komunia:'Komunia',bierzmowanie:'Bierzmowanie',sluby:'Ślub'}[old.type]||old.type;
    logActivity('delete', 'Sakramenty', 'Usunięto ' + sakrNameD + ': ' + (old.imie||'') + ' ' + (old.nazwisko||old.oblubieniec||''));
  }
  res.json({ ok: true });
});

// ── Aktualności ──────────────────────────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS aktualnosci (
  id       TEXT PRIMARY KEY,
  title    TEXT NOT NULL,
  date     TEXT DEFAULT '',
  category TEXT DEFAULT '',
  status   TEXT DEFAULT 'draft',
  author   TEXT DEFAULT '',
  excerpt  TEXT DEFAULT '',
  content  TEXT DEFAULT '',
  image    TEXT DEFAULT '',
  tags     TEXT DEFAULT '',
  featured INTEGER DEFAULT 0,
  views    INTEGER DEFAULT 0,
  slug     TEXT DEFAULT ''
)`);

(function(){
  var S=db.prepare('INSERT OR IGNORE INTO aktualnosci (id,title,date,category,status,author,excerpt,content,image,tags,featured,views,slug) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
  [
    ['news-wizytacja','Wizytacja kanoniczna abp. Galbasa','2026-05-09','Wydarzenia','published','ks. Tomasz Żołna',
     'Ksiądz arcybiskup Adrian Galbas odwiedził naszą parafię w ramach wizytacji kanonicznej. Spotkał się z radą parafialną, grupami modlitewnymi i młodzieżą przygotowującą się do bierzmowania.',
     '<p>W piątek 9 maja 2026 roku nasza parafia gościła Jego Ekscelencję ks. arcybiskupa Adriana Galbasa, metropolitę katowickiego, w ramach wizytacji kanonicznej.</p><h3>Spotkania z grupami</h3><p>Ksiądz arcybiskup spotkał się z Radą Parafialną, grupami modlitewnymi oraz młodzieżą przygotowującą się do bierzmowania. Zwiedził plac budowy nowego kościoła, wyrażając wdzięczność wszystkim ofiarodawcom.</p><p>Bóg zapłać wszystkim za obecność i piękne świadectwo wspólnoty.</p>',
     '../public/img/event-wizytacja-1.jpg','wizytacja, arcybiskup, Galbas',0,920,'wizytacja-galbasa-2026'],
    ['news-budowa-wieza','Kolejny etap budowy - wieża','2026-05-05','Budowa kościoła','published','ks. Tomasz Żołna',
     'W październiku 2025 roku rozpoczęły się prace przy budowie wieży kościoła. Wykonawcą jest firma z Czerwionki, projekt według architekta Grzegorza Tkacza.',
     '<p>W październiku 2025 roku przy budującej się nowej świątyni parafii NSPJ w Czerwionce-Leszczynach rozpoczął się kolejny etap prac - budowa wieży kościelnej.</p><h3>Projekt i wykonawca</h3><p>Projekt architektoniczny wieży przygotował architekt Grzegorz Tkacz. Wykonawcą jest firma budowlana z terenu Czerwionki-Leszczyn.</p><h3>Harmonogram</h3><p>Najbliższym kamieniem milowym jest przekazanie hełmu wieży. Parafianie mogą wspierać budowę zakupem symbolicznej płyty elewacji.</p>',
     '../public/img/budowa-2.jpg','budowa, wieża, kościół',0,580,'budowa-wieza-2026'],
    ['news-100lat','100 lat Parafii - fotorelacja z uroczystości','2025-08-03','Wydarzenia','published','ks. Tomasz Żołna',
     'Jubileuszowa uroczystość stulecia parafii zgromadziła setki parafian. Relacja z obchodów 100-lecia.',
     '<p>W sierpniu 2025 roku parafia obchodziła uroczyście swoje 100-lecie. Jubileuszowa Msza Święta pod przewodnictwem biskupa pomocniczego zgromadziła ponad 500 wiernych.</p><p>Po uroczystości odbyła się wystawa historyczna oraz wspólny obiad parafialny na placu przed kościołem.</p>',
     '../public/img/hero-2.jpg','100 lat, jubileusz, historia',0,2410,'100-lat-parafii-2025'],
    ['news-pielgrzymka','Pielgrzymka do Rud - relacja księdza','','Pielgrzymki','draft','ks. Paweł Olszewski',
     'Tekst relacji z pielgrzymki do opactwa cystersów w Rudach. Artykuł w przygotowaniu.',
     '<p>Artykuł w przygotowaniu…</p>',
     '../public/img/event-odpust-1.jpg','pielgrzymka, Rudy, cystersi',0,340,'pielgrzymka-rudy'],
    ['news-bierzmowanie','Bierzmowanie 2025 - zaproszenie dla młodzieży','2025-04-14','Sakramenty','published','ks. Paweł Olszewski',
     'Zaproszenie dla młodych parafian do przystąpienia do sakramentu bierzmowania w roku 2025.',
     '<p>Zapraszamy wszystkich młodych parafian urodzonych w roku 2009 i 2010 do zgłoszenia się na przygotowanie do sakramentu bierzmowania.</p><p>Spotkania przygotowawcze w każdy wtorek o godz. 17:30 w salce parafialnej. Kontakt: kancelaria parafialna.</p>',
     '../public/img/event-pozegnanie-1.jpg','bierzmowanie, młodzież, sakrament',0,192,'bierzmowanie-2025'],
    ['news-plytyelewacji','Płyty elewacji - postęp prac','2025-03-27','Budowa kościoła','published','ks. Tomasz Żołna',
     'Relacja z postępu prac przy montażu płyt elewacyjnych na nowym kościele.',
     '<p>Trwają intensywne prace przy montażu płyt elewacji zewnętrznej nowego kościoła. Dotychczas zamontowano 87 z 240 płyt.</p><p>Każdy parafian może wziąć udział w budowie poprzez zakup symbolicznej płyty - certyfikat do odbioru po Mszy świętej.</p>',
     '../public/img/budowa-4.jpg','budowa, elewacja, postęp',0,405,'plyty-elewacji-2025'],
    ['news-bozecial0','Boże Ciało 2024 - procesja przez Czerwionkę','2024-05-30','Wydarzenia','published','ks. Tomasz Żołna',
     'Procesja Bożego Ciała przeszła tradycyjnymi ulicami Czerwionki-Leszczyn. Wzięło w niej udział ponad 300 wiernych.',
     '<p>W uroczystość Bożego Ciała parafianie przeszli w procesji przez główne ulice Czerwionki-Leszczyn. Przy czterech ołtarzach ustawiono ozdobione kwiatami stoły, przy których odprawiono modlitwy.</p><p>W procesji wzięło udział około 300 wiernych, a oprawę muzyczną zapewniła schola parafialna.</p>',
     '../public/img/event-odpust-2.jpg','Boże Ciało, procesja, tradycja',0,1120,'boze-cialo-2024'],
    ['news-schlafhaus','Schlafhaus - historia starego kościoła','2023-06-22','Historia','published','Marian Wójcik',
     'Esej historyczny o dawnym kościele w Czerwionce - tajemnicze Schlafhaus i jego miejsce w dziejach parafii.',
     '<p>Słowo „Schlafhaus" (dom snu) od pokoleń funkcjonowało wśród starszych mieszkańców Czerwionki na określenie starej świątyni parafialnej. Skąd ta nazwa?</p><p>Według lokalnej tradycji, w czasie wojen napoleońskich budynek kościoła służył jako schronisko dla żołnierzy. Stąd ironiczne określenie, które przylgnęło do świątyni na lata.</p>',
     '../public/img/hero-3.jpg','historia, Schlafhaus, stary kościół',0,286,'schlafhaus-historia']
  ].forEach(function(r){S.run(r[0],r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9],r[10],r[11],r[12]);});
})();

function rowToAktualnosc(row) {
  return { id:row.id, title:row.title, date:row.date||'', category:row.category||'',
    status:row.status||'draft', author:row.author||'', excerpt:row.excerpt||'',
    content:row.content||'', image:row.image||'', tags:row.tags||'',
    featured:!!row.featured, views:row.views||0, slug:row.slug||'' };
}

app.get('/api/aktualnosci', function(req,res) {
  res.json(db.prepare('SELECT * FROM aktualnosci ORDER BY date DESC').all().map(rowToAktualnosc));
});
app.post('/api/aktualnosci', function(req,res) {
  var b=req.body; if(!b.title) return res.status(400).json({error:'Tytuł jest wymagany'});
  var id=b.id||('news-'+Date.now().toString(36));
  db.prepare('INSERT INTO aktualnosci (id,title,date,category,status,author,excerpt,content,image,tags,featured,views,slug) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id,b.title,b.date||'',b.category||'',b.status||'draft',b.author||'',b.excerpt||'',b.content||'',b.image||'',b.tags||'',b.featured?1:0,b.views||0,b.slug||'');
  logActivity('create', 'Aktualności', (b.status==='published'?'Opublikowano':'Zapisano szkic') + ': ' + b.title);
  res.status(201).json(rowToAktualnosc(db.prepare('SELECT * FROM aktualnosci WHERE id=?').get(id)));
});
app.put('/api/aktualnosci/:id', function(req,res) {
  var b=req.body;
  var r=db.prepare('UPDATE aktualnosci SET title=?,date=?,category=?,status=?,author=?,excerpt=?,content=?,image=?,tags=?,featured=?,views=?,slug=? WHERE id=?')
    .run(b.title||'',b.date||'',b.category||'',b.status||'draft',b.author||'',b.excerpt||'',b.content||'',b.image||'',b.tags||'',b.featured?1:0,b.views||0,b.slug||'',req.params.id);
  if(!r.changes) return res.status(404).json({error:'Nie znaleziono'});
  logActivity('update', 'Aktualności', 'Zaktualizowano: ' + (b.title||''));
  res.json(rowToAktualnosc(db.prepare('SELECT * FROM aktualnosci WHERE id=?').get(req.params.id)));
});
app.delete('/api/aktualnosci/:id', function(req,res) {
  var old=db.prepare('SELECT title FROM aktualnosci WHERE id=?').get(req.params.id);
  var r=db.prepare('DELETE FROM aktualnosci WHERE id=?').run(req.params.id);
  if(!r.changes) return res.status(404).json({error:'Nie znaleziono'});
  if(old) logActivity('delete', 'Aktualności', 'Usunięto: ' + old.title);
  res.json({ok:true});
});

// ── Ogłoszenia ───────────────────────────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS ogloszenia (
  id       TEXT PRIMARY KEY,
  title    TEXT NOT NULL,
  date     TEXT DEFAULT '',
  status   TEXT DEFAULT 'published',
  featured INTEGER DEFAULT 0,
  views    INTEGER DEFAULT 0,
  content  TEXT DEFAULT ''
)`);

(function(){
  var S=db.prepare('INSERT OR IGNORE INTO ogloszenia (id,title,date,status,featured,views,content) VALUES (?,?,?,?,?,?,?)');
  [
    ['ogl-2026-05-10','V Niedziela Wielkanocna','2026-05-10','published',1,320,
     '<p style="text-align:center;font-weight:700;font-family:\'Playfair Display\',serif;font-size:1.2rem">OGŁOSZENIA DUSZPASTERSKIE<br>V Niedziela Wielkanocna · 10 maja 2026</p><p>1. Dziś przeżywamy V Niedzielę Wielkanocną. Przed nami tydzień obchodzony jako tydzień modlitw o powołania kapłańskie i zakonne.</p><p>2. Bóg zapłać za ofiary na budowę nowego kościoła zebrane w minioną niedzielę - łącznie <b>14 380 zł</b>. Pan Bóg niech wynagrodzi wszystkim ofiarodawcom.</p><p>3. We <b>wtorek o godz. 18:00</b> w salce parafialnej zapraszamy na spotkanie Rady Parafialnej. W programie omówienie postępu prac przy budowie wieży.</p><p>4. W <b>sobotę o godz. 10:00</b> akcja porządkowa na cmentarzu parafialnym. Prosimy o zabranie rękawic i grabi. Po pracy planujemy wspólne ognisko.</p><p>5. W przyszłą niedzielę o godz. 11:00 odbędzie się <b>uroczystość bierzmowania</b>, której przewodniczył będzie ks. Biskup. Modlitwą obejmujemy 28 młodych ludzi przygotowujących się do przyjęcia tego sakramentu.</p><p>6. Przypominamy o możliwości zamawiania intencji mszalnych w kancelarii parafialnej w godzinach: poniedziałek, środa 17:30-18:30 oraz czwartek 7:30-8:30 i 17:30-18:30.</p><p>7. W minionym tygodniu odeszli z naszej wspólnoty: + Edward Mazur l. 84, + Anna Kędzierska l. 79. Polećmy ich Bożemu Miłosierdziu.</p><p><em>Z błogosławieństwem,<br>ks. Tomasz Żołna, proboszcz</em></p>'],
    ['ogl-2026-04-26','IV Niedziela Wielkanocna','2026-04-26','published',0,287,
     '<p><b>OGŁOSZENIA DUSZPASTERSKIE - 26 kwietnia 2026</b></p><p>1. Dziś przeżywamy Niedzielę Dobrego Pasterza - będziemy modlić się o powołania do stanu kapłańskiego. Kolekta na pokrycie rachunków użytkowania kościoła.</p><p>2. Zapraszamy na nieszpory o 16:30.</p><p>3. W środę wspomnienie św. Katarzyny Sieneńskiej, patronki Europy.</p>'],
    ['ogl-2026-04-19','III Niedziela Wielkanocna','2026-04-19','published',0,241,
     '<p><b>OGŁOSZENIA DUSZPASTERSKIE - 19 kwietnia 2026</b></p><p>1. Dziś przeżywamy Niedzielę Biblijną. Zachęcamy wiernych do lektury Pisma Świętego.</p>'],
    ['ogl-2026-04-12','II Niedziela Wielkanocna · Miłosierdzia Bożego','2026-04-12','published',0,198,
     '<p><b>OGŁOSZENIA DUSZPASTERSKIE - 12 kwietnia 2026</b></p><p>1. Dziś oddajemy cześć Miłosierdziu Bożemu. Kolekta na Caritas.</p>'],
    ['ogl-2026-04-05','Niedziela Wielkanocna','2026-04-05','published',0,354,
     '<p><b>OGŁOSZENIA DUSZPASTERSKIE - 5 kwietnia 2026</b></p><p>1. Dziś Uroczystość Zmartwychwstania Pańskiego - Wielkanoc. Alleluja!</p>'],
    ['ogl-2026-03-29','Niedziela Palmowa','2026-03-29','published',0,210,
     '<p><b>OGŁOSZENIA DUSZPASTERSKIE - 29 marca 2026</b></p><p>1. Dziś rozpoczyna się Wielki Tydzień.</p>'],
    ['ogl-2026-03-22','V Niedziela Wielkiego Postu','2026-03-22','published',0,175,
     '<p><b>OGŁOSZENIA DUSZPASTERSKIE - 22 marca 2026</b></p><p>1. Trwamy w pokucie i nawróceniu.</p>']
  ].forEach(function(r){S.run(r[0],r[1],r[2],r[3],r[4],r[5],r[6]);});
})();

function rowToOgloszenie(row) {
  return { id:row.id, title:row.title, date:row.date||'', status:row.status||'published',
    featured:!!row.featured, views:row.views||0, content:row.content||'' };
}

app.get('/api/ogloszenia', function(req,res) {
  res.json(db.prepare('SELECT * FROM ogloszenia ORDER BY date DESC').all().map(rowToOgloszenie));
});
app.post('/api/ogloszenia', function(req,res) {
  var b=req.body; if(!b.title) return res.status(400).json({error:'Tytuł jest wymagany'});
  var id=b.id||('ogl-'+Date.now().toString(36));
  db.prepare('INSERT INTO ogloszenia (id,title,date,status,featured,views,content) VALUES (?,?,?,?,?,?,?)')
    .run(id,b.title,b.date||'',b.status||'published',b.featured?1:0,b.views||0,b.content||'');
  logActivity('create', 'Ogłoszenia', 'Dodano ogłoszenia: ' + b.title);
  res.status(201).json(rowToOgloszenie(db.prepare('SELECT * FROM ogloszenia WHERE id=?').get(id)));
});
app.put('/api/ogloszenia/:id', function(req,res) {
  var b=req.body;
  var r=db.prepare('UPDATE ogloszenia SET title=?,date=?,status=?,featured=?,views=?,content=? WHERE id=?')
    .run(b.title||'',b.date||'',b.status||'published',b.featured?1:0,b.views||0,b.content||'',req.params.id);
  if(!r.changes) return res.status(404).json({error:'Nie znaleziono'});
  logActivity('update', 'Ogłoszenia', 'Zaktualizowano ogłoszenia: ' + (b.title||''));
  res.json(rowToOgloszenie(db.prepare('SELECT * FROM ogloszenia WHERE id=?').get(req.params.id)));
});
app.delete('/api/ogloszenia/:id', function(req,res) {
  var old=db.prepare('SELECT title FROM ogloszenia WHERE id=?').get(req.params.id);
  var r=db.prepare('DELETE FROM ogloszenia WHERE id=?').run(req.params.id);
  if(!r.changes) return res.status(404).json({error:'Nie znaleziono'});
  if(old) logActivity('delete', 'Ogłoszenia', 'Usunięto ogłoszenia: ' + old.title);
  res.json({ok:true});
});

// ── Kapłani ──────────────────────────────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS kaplani (
  id         TEXT PRIMARY KEY,
  sort_order INTEGER DEFAULT 0,
  role       TEXT DEFAULT '',
  name       TEXT DEFAULT '',
  photo      TEXT DEFAULT '',
  bio        TEXT DEFAULT ''
)`);
[
  { id:'pr1', sort_order:0, role:'Proboszcz', name:'Ks. Tomasz Żołna',
    photo:'https://www.nspjczerwionka.pl/uploaded/IMG_0632.jpg',
    bio:'Urodził się 6 lipca 1972 roku w Opolu. Po uzyskaniu w 1991 roku świadectwa dojrzałości wstąpił do Wyższego Śląskiego Seminarium Duchownego w Katowicach. 10 maja 1997 roku otrzymał święcenia kapłańskie. Posługę wikariusza pełnił w parafiach w: Pszczynie, Rydułtowach (jednocześnie kapelan szpitalny), Katowicach - Zawodziu, Rybniku, Mysłowicach Janowie-Miejskim, Bytomiu, Wodzisławiu Śl. i ostatecznie w Czerwionce-Leszczynach (od 31 sierpnia do 31 grudnia 2022 roku).\n\n1 stycznia 2023 roku ksiądz arcybiskup Wiktor Skworc odwołał go z funkcji wikariusza i mianował administratorem parafii Najświętszego Serca Pana Jezusa. 9 czerwca 2024 roku ksiądz arcybiskup Adrian Galbas w czasie udziału w uroczystości odpustowej mianował go proboszczem.' },
  { id:'pr2', sort_order:1, role:'Wikariusz', name:'Ks. Rafał Woźnica', photo:'',
    bio:'Urodził się 22 lipca 1982 roku w Wodzisławiu Śląskim. Święcenia otrzymał 09 maja 2009 roku. Posługę wikariuszowską pełnił do tej pory w parafiach: Radlin-Biertutowy, Tychy-Paprocany i w Goczałkowicach. 30 sierpnia 2025 roku rozpoczął swoją posługę w Czerwionce-Leszczynach.' }
].forEach(function(p) {
  db.prepare('INSERT OR IGNORE INTO kaplani (id,sort_order,role,name,photo,bio) VALUES (?,?,?,?,?,?)').run(p.id,p.sort_order,p.role,p.name,p.photo,p.bio);
});

app.get('/api/kaplani', function(req,res) {
  res.json(db.prepare('SELECT * FROM kaplani ORDER BY sort_order').all());
});
app.post('/api/kaplani', function(req,res) {
  var b=req.body;
  var m=db.prepare('SELECT MAX(sort_order) AS m FROM kaplani').get();
  var next=(m.m==null?-1:m.m)+1;
  db.prepare('INSERT INTO kaplani (id,sort_order,role,name,photo,bio) VALUES (?,?,?,?,?,?)').run(b.id,next,b.role||'',b.name||'',b.photo||'',b.bio||'');
  res.json({ok:true});
});
app.put('/api/kaplani/:id', function(req,res) {
  var b=req.body;
  db.prepare('UPDATE kaplani SET sort_order=?,role=?,name=?,photo=?,bio=? WHERE id=?').run(b.sort_order??0,b.role||'',b.name||'',b.photo||'',b.bio||'',req.params.id);
  res.json({ok:true});
});
app.delete('/api/kaplani/:id', function(req,res) {
  var r=db.prepare('DELETE FROM kaplani WHERE id=?').run(req.params.id);
  if(!r.changes) return res.status(404).json({error:'Nie znaleziono'});
  res.json({ok:true});
});

// ── Wspólnoty ─────────────────────────────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS wspolnoty (slug TEXT PRIMARY KEY, data TEXT DEFAULT '{}')`);
(function() {
  var seed = {
    'rada-parafialna': { count:16, countUnit:'osób', members:[{id:'rp1',name:'ks. proboszcz Tomasz Żołna',role:'Przewodniczący'}], structure:[] },
    'ministranci':     { count:16, countUnit:'ministrantów', members:[{id:'mi1',name:'ks. Marcin Wójcik',role:'Opiekun'}],
      structure:[{id:'st1',label:'Kandydaci',count:4},{id:'st2',label:'Ministranci młodsi',count:4},{id:'st3',label:'Ministranci starsi',count:5},{id:'st4',label:'Animatorzy',count:2},{id:'st5',label:'Ministrant senior',count:1}] },
    'schola':          { count:0, countUnit:'osób', members:[{id:'sc1',name:'ks. Marcin Wójcik',role:'Opiekun'},{id:'sc2',name:'Bartosz Wundersee',role:'Opiekun muzyczny'}], structure:[] },
    'dzieci-maryi':    { count:11, countUnit:'osób', members:[
      {id:'dm1',name:'ks. Marcin Wójcik',role:'Opiekun'},{id:'dm2',name:'Ania Wencel',role:'Moderatorka'},
      {id:'dm3',name:'Kasia Gudzik',role:'Animatorka'},{id:'dm4',name:'Jadzia Pluta',role:'Animatorka'},
      {id:'dm5',name:'Amelka Cieślik',role:'Animatorka'},{id:'dm6',name:'Zuzia Marszałek',role:''},
      {id:'dm7',name:'Karolina Kubica',role:''},{id:'dm8',name:'Agata Pietrzyk',role:''},
      {id:'dm9',name:'Zuzia Redosz',role:''},{id:'dm10',name:'Zosia Redosz',role:''},{id:'dm11',name:'Maya Marchewka',role:''}
    ], structure:[] },
    'zywy-rozaniec':   { count:0, countUnit:'osób', members:[], structure:[] },
    'franciszkanie':   { count:16, countUnit:'tercjarzy', members:[{id:'fz1',name:'s. Aniela Liszka',role:'Przełożona'}], structure:[] },
    'charytatywny':    { count:0, countUnit:'osób', members:[], structure:[] }
  };
  Object.keys(seed).forEach(function(slug) {
    db.prepare('INSERT OR IGNORE INTO wspolnoty (slug,data) VALUES (?,?)').run(slug, JSON.stringify(seed[slug]));
  });
})();

app.get('/api/wspolnoty', function(req,res) {
  var rows=db.prepare('SELECT slug,data FROM wspolnoty').all();
  var result={};
  rows.forEach(function(r){ result[r.slug]=JSON.parse(r.data); });
  res.json(result);
});
app.put('/api/wspolnoty/:slug', function(req,res) {
  db.prepare('INSERT OR REPLACE INTO wspolnoty (slug,data) VALUES (?,?)').run(req.params.slug, JSON.stringify(req.body));
  res.json({ok:true});
});

// SMS — logowanie wysyłek
db.exec(`CREATE TABLE IF NOT EXISTS sms_log (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  sent_at  TEXT NOT NULL,
  telefon  TEXT DEFAULT '',
  type     TEXT DEFAULT 'reminder'
)`);

app.get('/api/sms/stats', function(req, res) {
  var ym = new Date().toISOString().slice(0,7);
  var r = db.prepare("SELECT COUNT(*) as cnt FROM sms_log WHERE sent_at LIKE ?").get(ym + '%');
  res.json({ thisMonth: r ? r.cnt : 0, limit: 300 });
});

function getSmsMonthCount() {
  var ym = new Date().toISOString().slice(0,7);
  var r = db.prepare("SELECT COUNT(*) as cnt FROM sms_log WHERE sent_at LIKE ?").get(ym + '%');
  return r ? r.cnt : 0;
}

// SMS — przypomnienia automatyczne
function getSetting(key, def) {
  try {
    var r = db.prepare('SELECT value FROM settings WHERE key=?').get(key);
    return r ? JSON.parse(r.value) : def;
  } catch(e) { return def; }
}

function isoToday(offsetDays) {
  var d = new Date();
  d.setDate(d.getDate() + (offsetDays||0));
  return d.toISOString().slice(0,10);
}

async function sendReminderSms(telefon, intention, date, time) {
  var token = process.env.SMSPLANET_TOKEN;
  if (!token) return;
  if (getSmsMonthCount() >= 300) {
    console.log('SMS limit miesięczny wyczerpany — pominięto przypomnienie do', telefon);
    return;
  }
  var d = new Date(date + 'T12:00:00');
  var ds = d.getDate() + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear();
  var intTxt = intention ? ' (' + intention.substring(0,60) + (intention.length>60?'...':'')+')' : '';
  var msg = 'Parafia NSPJ: Przypomnienie o intencji' + intTxt + ' w dniu ' + ds + ' o godz. ' + (time||'') + '. Tel. 32 431 29 92';
  var phone = String(telefon).replace(/[\s\-]/g,'');
  if (/^\d{9}$/.test(phone)) phone = '+48'+phone;
  else if (/^48\d{9}$/.test(phone)) phone = '+'+phone;
  var params = new URLSearchParams();
  params.set('from','ParafiaNSPJ'); params.set('to',phone); params.set('msg',msg);
  try {
    await fetch('https://api2.smsplanet.pl/sms', {
      method:'POST',
      headers:{'Authorization':'Bearer '+token,'Content-Type':'application/x-www-form-urlencoded'},
      body: params.toString()
    });
    db.prepare('INSERT INTO sms_log (sent_at, telefon, type) VALUES (?,?,?)').run(new Date().toISOString(), telefon, 'reminder');
  } catch(e) { console.error('SMS reminder error:', e.message); }
}

async function checkSmsReminders() {
  if (!getSetting('smsRemindersEnabled', false)) return;
  var today = isoToday(0);
  var hour = new Date().getHours();
  var rows1 = db.prepare('SELECT * FROM intencje WHERE r1_date=? AND r1_hour=? AND telefon!=\'\' AND reminder1_sent=0').all(today, hour);
  for (var i=0; i<rows1.length; i++) {
    await sendReminderSms(rows1[i].telefon, rows1[i].intention, rows1[i].date, rows1[i].time);
    db.prepare('UPDATE intencje SET reminder1_sent=1 WHERE id=?').run(rows1[i].id);
    console.log('SMS reminder1 sent for intencja', rows1[i].id, rows1[i].date, 'hour', hour);
  }
  var rows2 = db.prepare('SELECT * FROM intencje WHERE r2_date=? AND r2_hour=? AND telefon!=\'\' AND reminder2_sent=0').all(today, hour);
  for (var j=0; j<rows2.length; j++) {
    await sendReminderSms(rows2[j].telefon, rows2[j].intention, rows2[j].date, rows2[j].time);
    db.prepare('UPDATE intencje SET reminder2_sent=1 WHERE id=?').run(rows2[j].id);
    console.log('SMS reminder2 sent for intencja', rows2[j].id, rows2[j].date, 'hour', hour);
  }
}

// Uruchom co godzinę (na początku każdej pełnej godziny) + raz 30s po starcie
function scheduleReminders() {
  var now = new Date();
  var next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()+1, 0, 0);
  setTimeout(function() { checkSmsReminders(); setInterval(checkSmsReminders, 60*60*1000); }, next - now);
}
setTimeout(checkSmsReminders, 30000);
scheduleReminders();

// SMS — wysyłka przez SMSPlanet API
app.post('/api/sms/wyslij', async function (req, res) {
  const token = process.env.SMSPLANET_TOKEN;
  if (!token) return res.status(500).json({ error: 'Brak konfiguracji SMS (SMSPLANET_TOKEN)' });
  if (getSmsMonthCount() >= 300) {
    return res.status(429).json({ error: 'Miesięczny limit 300 SMS wyczerpany. Skontaktuj się z administratorem.' });
  }

  const { to, msg, from } = req.body;
  if (!to || !msg) return res.status(400).json({ error: 'Brak numeru lub tresci' });

  // Normalizacja numeru: usuń spacje/myślniki, dodaj +48 jeśli 9-cyfrowy
  let phone = String(to).replace(/[\s\-]/g, '');
  if (/^\d{9}$/.test(phone))   phone = '+48' + phone;
  else if (/^48\d{9}$/.test(phone)) phone = '+' + phone;

  const params = new URLSearchParams();
  params.set('from', from || 'ParafiaNSPJ');
  params.set('to',   phone);
  params.set('msg',  msg);

  try {
    const r = await fetch('https://api2.smsplanet.pl/sms', {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString()
    });
    const data = await r.json();
    if (data.messageId || data.messageCount) {
      db.prepare('INSERT INTO sms_log (sent_at, telefon, type) VALUES (?,?,?)').run(new Date().toISOString(), to, 'manual');
      res.json({ ok: true, messageId: data.messageId });
    } else {
      res.status(400).json({ error: data.errorMsg || 'Blad SMSPlanet', details: data });
    }
  } catch (e) {
    res.status(500).json({ error: 'Blad polaczenia z SMSPlanet: ' + e.message });
  }
});

// ── Galerie ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS galerie (
    id           TEXT PRIMARY KEY,
    slug         TEXT DEFAULT '',
    tytul        TEXT NOT NULL,
    data         TEXT DEFAULT '',
    opis         TEXT DEFAULT '',
    folder       TEXT DEFAULT '',
    cover        TEXT DEFAULT '',
    cover_pos    TEXT DEFAULT '40%',
    zdjecia      TEXT DEFAULT '[]',
    opublikowana INTEGER DEFAULT 1,
    featured     INTEGER DEFAULT 0,
    pinned       INTEGER DEFAULT 0
  )
`);

function rowToGaleria(row) {
  var z = [];
  try { z = JSON.parse(row.zdjecia || '[]'); } catch(e) { z = []; }
  return {
    id: row.id, slug: row.slug || '', tytul: row.tytul,
    data: row.data || '', opis: row.opis || '',
    folder: row.folder || '', cover: row.cover || '',
    cover_pos: row.cover_pos || '40%', zdjecia: z,
    opublikowana: !!row.opublikowana,
    featured: !!row.featured, pinned: !!row.pinned
  };
}

(function seedGalerie() {
  var c = db.prepare('SELECT COUNT(*) as c FROM galerie').get().c;
  if (c > 0) return;
  var d = [
    {id:'gal-001',slug:'100-lat-parafii-01-08-2025-r',tytul:"100 lat Parafii - 1 sierpnia 2025",data:'2025-08-01',folder:'100-lat-parafii-01-08-2025-r',cover:'public/img/galerie/100-lat-parafii-01-08-2025-r/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg"],pub:1,feat:1},
    {id:'gal-002',slug:'120-lat-osp-czerwionka',tytul:"120 lat OSP Czerwionka",data:'2024-06-01',folder:'120-lat-osp-czerwionka',cover:'public/img/galerie/120-lat-osp-czerwionka/01.jpg',z:["01.jpg","02.jpg"],pub:1,feat:0},
    {id:'gal-003',slug:'20-piesza-pielgrzymka-do-sanktuarium-matki-bozej-pokornej-w-rudach',tytul:"20. Piesza Pielgrzymka do Rud",data:'2024-08-10',folder:'20-piesza-pielgrzymka-do-sanktuarium-matki-bozej-pokornej-w-rudach',cover:'public/img/galerie/20-piesza-pielgrzymka-do-sanktuarium-matki-bozej-pokornej-w-rudach/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg"],pub:1,feat:0},
    {id:'gal-004',slug:'akcja-sprzatanie',tytul:"Akcja Sprzątanie",data:'2024-04-13',folder:'akcja-sprzatanie',cover:'public/img/galerie/akcja-sprzatanie/01.jpeg',z:["01.jpeg","02.jpeg","03.jpeg","04.jpeg","05.jpeg","06.jpeg","07.jpeg","08.jpeg","09.jpeg","10.jpeg","11.jpeg","12.jpeg","13.jpeg","14.jpeg"],pub:1,feat:0},
    {id:'gal-005',slug:'boze-cialo-2024-r',tytul:"Boże Ciało 2024",data:'2024-05-30',folder:'boze-cialo-2024-r',cover:'public/img/galerie/boze-cialo-2024-r/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg","17.jpg","18.jpg"],pub:1,feat:0},
    {id:'gal-006',slug:'boze-cialo',tytul:"Boże Ciało",data:'2023-06-08',folder:'boze-cialo',cover:'public/img/galerie/boze-cialo/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg","17.jpg","18.jpg"],pub:1,feat:0},
    {id:'gal-007',slug:'boze-narodzenie-2024',tytul:"Boże Narodzenie 2024",data:'2024-12-25',folder:'boze-narodzenie-2024',cover:'public/img/galerie/boze-narodzenie-2024/01.jpeg',z:["01.jpeg","02.jpeg","03.jpeg","04.jpeg","05.jpeg","06.jpeg","07.jpeg","08.jpeg","09.jpeg","10.jpeg","11.jpeg","12.jpeg","13.jpeg","14.jpeg","15.jpeg","16.jpeg"],pub:1,feat:0},
    {id:'gal-008',slug:'budowa-luty-2025',tytul:"Budowa - luty 2025",data:'2025-02-15',folder:'budowa-luty-2025',cover:'public/img/galerie/budowa-luty-2025/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg","17.jpg","18.jpg","19.jpg","20.jpg"],pub:1,feat:1},
    {id:'gal-009',slug:'droga-krzyzowa-2024',tytul:"Droga Krzyżowa 2024",data:'2024-03-22',folder:'droga-krzyzowa-2024',cover:'public/img/galerie/droga-krzyzowa-2024/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg","17.jpg","18.jpg","19.jpg","20.jpg","21.jpg","22.jpg"],pub:1,feat:0},
    {id:'gal-010',slug:'dzien-fatimski-13-pazdziernika',tytul:"Dzień Fatimski 13 października",data:'2024-10-13',folder:'dzien-fatimski-13-pazdziernika',cover:'public/img/galerie/dzien-fatimski-13-pazdziernika/01.jpeg',z:["01.jpeg","02.jpeg"],pub:1,feat:0},
    {id:'gal-011',slug:'etap-przygotowania-placu-budowy-1',tytul:"Etap przygotowania placu budowy cz. 2",data:'2023-09-01',folder:'etap-przygotowania-placu-budowy-1',cover:'public/img/galerie/etap-przygotowania-placu-budowy-1/01.jpeg',z:["01.jpeg","02.jpeg"],pub:1,feat:0},
    {id:'gal-012',slug:'etap-przygotowania-placu-budowy',tytul:"Etap przygotowania placu budowy",data:'2023-07-01',folder:'etap-przygotowania-placu-budowy',cover:'public/img/galerie/etap-przygotowania-placu-budowy/01.jpeg',z:["01.jpeg","02.jpeg","03.jpeg","04.jpeg","05.jpeg","06.jpeg","07.jpeg","08.jpeg","09.jpeg","10.jpeg","11.jpeg","12.jpeg","13.jpeg","14.jpeg"],pub:1,feat:0},
    {id:'gal-013',slug:'intencje-mszalne-ad-2024',tytul:"Intencje mszalne AD 2024",data:'2024-01-01',folder:'intencje-mszalne-ad-2024',cover:'public/img/galerie/intencje-mszalne-ad-2024/01.jpg',z:["01.jpg"],pub:0,feat:0},
    {id:'gal-014',slug:'kolejny-etap-budowy-jesien-2025',tytul:"Kolejny etap budowy - jesień 2025",data:'2025-10-01',folder:'kolejny-etap-budowy-jesien-2025',cover:'public/img/galerie/kolejny-etap-budowy-jesien-2025/01.jpeg',z:["01.jpeg","02.jpeg","03.jpeg","04.jpeg","05.jpeg","06.jpeg","07.jpeg","08.jpeg","09.jpeg","10.jpeg","11.jpeg","12.jpeg","13.jpeg","14.jpeg"],pub:1,feat:0},
    {id:'gal-015',slug:'kosciol-i-podziemia-05-03-2025',tytul:"Kościół i podziemia - 5 marca 2025",data:'2025-03-05',folder:'kosciol-i-podziemia-05-03-2025',cover:'public/img/galerie/kosciol-i-podziemia-05-03-2025/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg"],pub:1,feat:1},
    {id:'gal-016',slug:'kosciol-noca',tytul:"Kościół nocą",data:'2024-11-01',folder:'kosciol-noca',cover:'public/img/galerie/kosciol-noca/01.jpeg',z:["01.jpeg","02.jpeg","03.jpeg","04.jpeg","05.jpeg","06.jpeg","07.jpeg","08.jpeg","09.jpeg","10.jpeg"],pub:1,feat:0},
    {id:'gal-017',slug:'kosciol-z-wewnatrz',tytul:"Kościół od wewnątrz",data:'2024-05-01',folder:'kosciol-z-wewnatrz',cover:'public/img/galerie/kosciol-z-wewnatrz/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpeg","05.jpeg","06.jpeg","07.jpeg","08.jpeg","09.jpeg","10.jpg","11.jpg","12.jpg","13.jpeg","14.jpeg","15.jpeg","16.jpeg","17.jpeg","18.jpeg"],pub:1,feat:0},
    {id:'gal-018',slug:'kosciol-z-zewnatrz',tytul:"Kościół z zewnątrz",data:'2024-04-01',folder:'kosciol-z-zewnatrz',cover:'public/img/galerie/kosciol-z-zewnatrz/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg","17.jpg","18.jpg","19.jpg","20.jpg","21.jpg","22.jpg"],pub:1,feat:0},
    {id:'gal-019',slug:'noclegownia-budynek-starego-kosciola',tytul:"Noclegownia - stary kościół",data:'2023-06-22',folder:'noclegownia-budynek-starego-kosciola',cover:'public/img/galerie/noclegownia-budynek-starego-kosciola/01.jpg',z:["01.jpg","02.jpg"],pub:1,feat:0},
    {id:'gal-020',slug:'nowy-etap-budowy',tytul:"Nowy etap budowy",data:'2024-06-01',folder:'nowy-etap-budowy',cover:'public/img/galerie/nowy-etap-budowy/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg"],pub:1,feat:0},
    {id:'gal-021',slug:'nowy-kosciol-i-podziemia-stan-05-03-2025',tytul:"Nowy kościół i podziemia - stan 5.03.2025",data:'2025-03-05',folder:'nowy-kosciol-i-podziemia-stan-05-03-2025',cover:'public/img/galerie/nowy-kosciol-i-podziemia-stan-05-03-2025/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg"],pub:1,feat:0},
    {id:'gal-022',slug:'odpust-eucharystia',tytul:"Odpust - Eucharystia",data:'2024-06-09',folder:'odpust-eucharystia',cover:'public/img/galerie/odpust-eucharystia/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg","17.jpg","18.jpg","19.jpg","20.jpg","21.jpg","22.jpg"],pub:1,feat:0},
    {id:'gal-023',slug:'odpust-parafialny-09-06-2024-r',tytul:"Odpust parafialny - 9 czerwca 2024",data:'2024-06-09',folder:'odpust-parafialny-09-06-2024-r',cover:'public/img/galerie/odpust-parafialny-09-06-2024-r/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg","17.jpg","18.jpg","19.jpg","20.jpg","21.jpg","22.jpg"],pub:1,feat:1},
    {id:'gal-024',slug:'odpust-parafialny-2023',tytul:"Odpust parafialny 2023",data:'2023-06-11',folder:'odpust-parafialny-2023',cover:'public/img/galerie/odpust-parafialny-2023/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg"],pub:1,feat:0},
    {id:'gal-025',slug:'odpust-parafialny-2025',tytul:"Odpust parafialny 2025",data:'2025-06-08',folder:'odpust-parafialny-2025',cover:'public/img/galerie/odpust-parafialny-2025/01.jpeg',z:["01.jpeg","02.jpeg","03.jpeg","04.jpeg","05.jpeg","06.jpeg","07.jpeg","08.jpeg","09.jpeg","10.jpeg","11.jpeg","12.jpeg","13.jpeg","14.jpeg","15.jpeg","16.jpeg"],pub:1,feat:0},
    {id:'gal-026',slug:'pielgrzyma-iii-zakonu-do-bujakowa',tytul:"Pielgrzymka III Zakonu do Bujakowa",data:'2024-09-01',folder:'pielgrzyma-iii-zakonu-do-bujakowa',cover:'public/img/galerie/pielgrzyma-iii-zakonu-do-bujakowa/01.jpeg',z:["01.jpeg","02.jpeg","03.jpeg","04.jpeg"],pub:1,feat:0},
    {id:'gal-027',slug:'pielgrzymka-do-rud-raciborskich',tytul:"Pielgrzymka do Rud Raciborskich",data:'2024-07-01',folder:'pielgrzymka-do-rud-raciborskich',cover:'public/img/galerie/pielgrzymka-do-rud-raciborskich/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg"],pub:1,feat:0},
    {id:'gal-028',slug:'pielgrzymka-do-rud',tytul:"Pielgrzymka do Rud",data:'2023-07-01',folder:'pielgrzymka-do-rud',cover:'public/img/galerie/pielgrzymka-do-rud/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg"],pub:1,feat:0},
    {id:'gal-029',slug:'pielgrzymka-dzieci-komunijnych-do-wroclawia',tytul:"Pielgrzymka dzieci komunijnych do Wrocławia",data:'2024-05-01',folder:'pielgrzymka-dzieci-komunijnych-do-wroclawia',cover:'public/img/galerie/pielgrzymka-dzieci-komunijnych-do-wroclawia/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg"],pub:1,feat:0},
    {id:'gal-030',slug:'plyty-elewacji-zewnetrznej',tytul:"Płyty elewacji zewnętrznej",data:'2025-01-01',folder:'plyty-elewacji-zewnetrznej',cover:'public/img/galerie/plyty-elewacji-zewnetrznej/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg"],pub:1,feat:0},
    {id:'gal-031',slug:'pozegnanie-ks-proboszcza-antoniego-szczypkii',tytul:"Pożegnanie ks. proboszcza Antoniego Szczypki",data:'2023-09-06',folder:'pozegnanie-ks-proboszcza-antoniego-szczypkii',cover:'public/img/galerie/pozegnanie-ks-proboszcza-antoniego-szczypkii/01.jpg',z:["01.jpg","02.jpg","03.jpg"],pub:1,feat:0},
    {id:'gal-032',slug:'rada-budowy',tytul:"Rada Budowy",data:'2024-08-01',folder:'rada-budowy',cover:'public/img/galerie/rada-budowy/01.jpg',z:["01.jpg","02.jpg","03.jpeg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpeg","11.jpg","12.jpg","13.jpg","14.jpg"],pub:1,feat:0},
    {id:'gal-033',slug:'suma-odpustowa-09-06-2024r',tytul:"Suma odpustowa - 9 czerwca 2024",data:'2024-06-09',folder:'suma-odpustowa-09-06-2024r',cover:'public/img/galerie/suma-odpustowa-09-06-2024r/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg","17.jpg","18.jpg","19.jpg","20.jpg"],pub:1,feat:1},
    {id:'gal-034',slug:'swietliki-i-podziemia',tytul:"Świetliki i podziemia",data:'2024-12-01',folder:'swietliki-i-podziemia',cover:'public/img/galerie/swietliki-i-podziemia/01.jpeg',z:["01.jpeg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpeg","07.jpg","08.jpg","09.jpg","10.jpg"],pub:1,feat:0},
    {id:'gal-035',slug:'swieto-ministrantow',tytul:"Święto ministrantów",data:'2024-08-06',folder:'swieto-ministrantow',cover:'public/img/galerie/swieto-ministrantow/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg"],pub:1,feat:0},
    {id:'gal-036',slug:'wczesna-komunia-swieta-2023',tytul:"Wczesna Komunia Święta 2023",data:'2023-05-14',folder:'wczesna-komunia-swieta-2023',cover:'public/img/galerie/wczesna-komunia-swieta-2023/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg"],pub:1,feat:0},
    {id:'gal-037',slug:'wizytacja-kanoniczna-2025-r',tytul:"Wizytacja kanoniczna 2025",data:'2025-05-09',folder:'wizytacja-kanoniczna-2025-r',cover:'public/img/galerie/wizytacja-kanoniczna-2025-r/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg","17.jpg","18.jpg","19.jpg","20.jpg"],pub:1,feat:1},
    {id:'gal-038',slug:'wycieczka',tytul:"Wycieczka parafialna",data:'2024-06-01',folder:'wycieczka',cover:'public/img/galerie/wycieczka/01.jpg',z:["01.jpg"],pub:1,feat:0},
    {id:'gal-039',slug:'wylewka-w-podziemiach-1',tytul:"Wylewka w podziemiach cz. 2",data:'2024-10-01',folder:'wylewka-w-podziemiach-1',cover:'public/img/galerie/wylewka-w-podziemiach-1/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg"],pub:1,feat:0},
    {id:'gal-040',slug:'wylewka-w-podziemiach',tytul:"Wylewka w podziemiach",data:'2024-09-15',folder:'wylewka-w-podziemiach',cover:'public/img/galerie/wylewka-w-podziemiach/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg"],pub:1,feat:0},
    {id:'gal-041',slug:'zegnamy-ksiedza-antoniego',tytul:"Żegnamy ks. Antoniego",data:'2023-09-06',folder:'zegnamy-ksiedza-antoniego',cover:'public/img/galerie/zegnamy-ksiedza-antoniego/01.jpg',z:["01.jpg","02.jpg","03.jpg","04.jpg","05.jpg","06.jpg","07.jpg","08.jpg","09.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.jpg","15.jpg","16.jpg"],pub:1,feat:0}
  ];
  var stmt = db.prepare(`INSERT INTO galerie
    (id,slug,tytul,data,opis,folder,cover,cover_pos,zdjecia,opublikowana,featured,pinned)
    VALUES (?,?,?,?,?,?,?,'40%',?,?,?,0)`);
  d.forEach(function(g) {
    stmt.run(g.id, g.slug, g.tytul, g.data, '', g.folder, g.cover,
      JSON.stringify(g.z||[]), g.pub, g.feat);
  });
  console.log('Galerie: zainicjalizowano ' + d.length + ' galerii domyślnych');
})();

app.get('/api/galerie', function(req, res) {
  var rows = db.prepare('SELECT * FROM galerie ORDER BY pinned DESC, data DESC').all();
  res.json(rows.map(rowToGaleria));
});

app.post('/api/galerie', function(req, res) {
  var b = req.body;
  if (!b.tytul) return res.status(400).json({ error: 'Tytuł jest wymagany' });
  var id = b.id || ('gal' + Date.now().toString(36));
  db.prepare(`INSERT INTO galerie (id,slug,tytul,data,opis,folder,cover,cover_pos,zdjecia,opublikowana,featured,pinned)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, b.slug||id, b.tytul, b.data||'', b.opis||'', b.folder||'',
      b.cover||'', b.cover_pos||'40%', JSON.stringify(b.zdjecia||[]),
      b.opublikowana?1:0, b.featured?1:0, b.pinned?1:0);
  res.status(201).json(rowToGaleria(db.prepare('SELECT * FROM galerie WHERE id=?').get(id)));
});

app.put('/api/galerie/:id', function(req, res) {
  var b = req.body;
  if (!b.tytul) return res.status(400).json({ error: 'Tytuł jest wymagany' });
  var r = db.prepare(`UPDATE galerie SET
    slug=?,tytul=?,data=?,opis=?,folder=?,cover=?,cover_pos=?,zdjecia=?,opublikowana=?,featured=?,pinned=?
    WHERE id=?`)
    .run(b.slug||req.params.id, b.tytul, b.data||'', b.opis||'', b.folder||'',
      b.cover||'', b.cover_pos||'40%', JSON.stringify(b.zdjecia||[]),
      b.opublikowana?1:0, b.featured?1:0, b.pinned?1:0, req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Nie znaleziono galerii' });
  res.json(rowToGaleria(db.prepare('SELECT * FROM galerie WHERE id=?').get(req.params.id)));
});

app.delete('/api/galerie/:id', function(req, res) {
  var r = db.prepare('DELETE FROM galerie WHERE id=?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Nie znaleziono galerii' });
  res.json({ ok: true });
});

// Serwuj pliki z katalogu aplikacji
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '.')));

// Multer — zapis do public/img/galerie/{folder}/
// Pliki dostępne pod URL-em /public/img/galerie/{folder}/nazwa.jpg
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = (req.body.folder || 'misc')
      .trim()
      .replace(/[^a-zA-Z0-9\-_]/g, '_')
      .substring(0, 120);
    const dir = path.join(__dirname, 'public', 'img', 'galerie', folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const safe = file.originalname
      .replace(/[^a-zA-Z0-9\-_.]/g, '_')
      .substring(0, 200);
    cb(null, safe);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Dozwolone tylko jpg/png/gif/webp'));
    }
  }
});

app.post('/api/galeria/upload', upload.array('files', 100), function (req, res) {
  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: 'Brak plików' });
  }
  var folder = (req.body.folder || 'misc')
    .trim()
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .substring(0, 120);
  res.json({ ok: true, folder: folder, zdjecia: req.files.map(function (f) { return f.filename; }) });
});

// Globalny handler błędów (m.in. multer)
app.use(function (err, req, res, next) {
  res.status(400).json({ error: err.message || 'Błąd serwera' });
});

app.listen(PORT, function () {
  console.log('Serwer parafii uruchomiony na porcie ' + PORT);
});
