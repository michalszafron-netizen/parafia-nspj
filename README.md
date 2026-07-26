# Parafia NSPJ — Czerwionka-Leszczyny

## Lokalne uruchomienie

```bash
node server.js
```

- Strona główna: http://localhost:3000/demo-parafia-v2/
- Panel admina: http://localhost:3000/demo-parafia-v2/admin/
- Zatrzymanie: Ctrl+C

---

## Serwer VPS

| Co | Wartość |
|---|---|
| IP | 91.228.196.179 |
| SSH | `ssh root@91.228.196.179` |
| Folder projektu | `/var/www/kosciol/` |
| Domena tymczasowa | sacrum.wideart.agency |

### Komendy PM2

```bash
pm2 list                  # lista procesów
pm2 restart kosciol       # restart po wgraniu plików
pm2 logs kosciol          # logi na żywo
pm2 logs kosciol --lines 50   # ostatnie 50 linii logów
pm2 env 0                 # zmienne środowiskowe (PORT, SMSPLANET_TOKEN itd.)
pm2 stop kosciol          # zatrzymanie
pm2 start kosciol         # uruchomienie
```

### Wgrywanie plików

1. WinSCP → SFTP → `91.228.196.179` port 22
2. Kopiuj pliki do `/var/www/kosciol/`
3. Na serwerze: `pm2 restart kosciol`

> **Uwaga:** Statyczne HTML/CSS/JS nie wymagają restartu PM2 — wystarczy odświeżenie przeglądarki.
> Restart wymagany tylko gdy zmieniasz `server.js`.

### Pliki które często idą razem na serwer

| Zmiana | Pliki do wgrania |
|---|---|
| Intencje / strona główna | `demo-parafia-v2/index.html` + `demo-parafia-v2/strony/msze.html` |
| Panel admina (wspólne) | `demo-parafia-v2/admin/assets/admin.js` |
| Backend / API / SMS | `server.js` → potem `pm2 restart kosciol` |

### Nginx

```bash
cat /etc/nginx/sites-available/kosciol   # konfiguracja (proxy → localhost:3000)
nginx -t                                  # test konfiguracji
systemctl reload nginx                    # przeładowanie bez restartu
```

---

## SMS (SMSPlanet.pl)

- Działa **tylko na serwerze** (token ustawiony w PM2)
- Lokalnie SMS nie wychodzi — normalne zachowanie
- Token env: `SMSPLANET_TOKEN` (widoczny przez `pm2 env 0`)
- Nadawca: `ParafiaNSPJ`

---

## Struktura projektu

```
/var/www/kosciol/
├── server.js               # backend Node.js (Express + SQLite)
├── package.json
├── data/
│   └── parafia.db          # baza SQLite (NIE nadpisywać!)
└── demo-parafia-v2/
    ├── index.html           # strona główna
    ├── strony/              # podstrony publiczne
    └── admin/               # panel administracyjny
        └── assets/
            └── admin.js     # wspólny JS panelu (flatpickr, PDF, itp.)
```

> **Uwaga:** Plik `data/parafia.db` to baza danych z prawdziwymi wpisami.
> Nigdy nie nadpisuj go lokalną wersją na serwer.
