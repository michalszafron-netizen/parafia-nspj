const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// SMS — wysyłka przez SMSPlanet API
app.post('/api/sms/wyslij', async function (req, res) {
  const token = process.env.SMSPLANET_TOKEN;
  if (!token) return res.status(500).json({ error: 'Brak konfiguracji SMS (SMSPLANET_TOKEN)' });

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
      res.json({ ok: true, messageId: data.messageId });
    } else {
      res.status(400).json({ error: data.errorMsg || 'Blad SMSPlanet', details: data });
    }
  } catch (e) {
    res.status(500).json({ error: 'Blad polaczenia z SMSPlanet: ' + e.message });
  }
});

// Serwuj pliki z katalogu aplikacji
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
  res.json({ ok: true, zdjecia: req.files.map(function (f) { return f.filename; }) });
});

// Globalny handler błędów (m.in. multer)
app.use(function (err, req, res, next) {
  res.status(400).json({ error: err.message || 'Błąd serwera' });
});

app.listen(PORT, function () {
  console.log('Serwer parafii uruchomiony na porcie ' + PORT);
});
