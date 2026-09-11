# Plan wdrożenia systemu logowania — Parafia NSPJ

## Konta użytkowników

| Rola | Login | Osoba | Uprawnienia |
|---|---|---|---|
| `superadmin` | `kryptoholik` | Developer | Wszystko + zarządzanie kontami |
| `admin` | `proboszcz` (lub imię) | ks. Tomasz Żołna | Wszystkie treści, ustawienia parafii (bez kont) |

## Stos techniczny (bez nowych paczek npm)

- **Hashing haseł** — `crypto.pbkdf2Sync` (wbudowany Node.js)
- **Sesja** — losowy token 64-hex przechowywany w SQLite
- **Cookie** — `parish_session=TOKEN; HttpOnly; Secure; SameSite=Strict`
- **Wygaśnięcie sesji** — 8 godzin, refresh przy aktywności
- **Rate limiting** — max 5 błędnych prób logowania / 15 min (blokada IP)

## Nowe tabele SQLite

```sql
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  username     TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role         TEXT NOT NULL CHECK(role IN ('superadmin','admin')),
  active       INTEGER NOT NULL DEFAULT 1,
  last_login   TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip         TEXT
);
```

## Endpointy do dodania w server.js

```
POST /api/auth/login    — weryfikacja hasła, tworzenie sesji, set-cookie
POST /api/auth/logout   — usunięcie sesji z SQLite, clear-cookie
GET  /api/auth/me       — zwraca { id, username, display_name, role } dla aktualnej sesji
PUT  /api/auth/password — zmiana hasła (zalogowany użytkownik)
GET  /api/users         — lista kont (tylko superadmin)
PUT  /api/users/:id     — edycja konta (tylko superadmin)
```

## Middleware do dodania

```javascript
// requireAuth — chroni WSZYSTKIE /api/* (poza /api/auth/login) i pliki /admin/* (poza login.html)
function requireAuth(req, res, next) { ... }

// requireSuperAdmin — chroni /api/users/* i sekcję zarządzania kontami
function requireSuperAdmin(req, res, next) { ... }
```

Przepływ:
1. Wyciągnij `parish_session` z cookie
2. Sprawdź token w tabeli `sessions` (czy istnieje i `expires_at > NOW`)
3. Jeśli OK → `req.user = { id, username, role }` → `next()`
4. Jeśli nie → API: `401 Unauthorized` / strona: redirect na `/admin/login.html`

## Kolejność wdrożenia

1. **Tabele + seed** — dodaj `users` i `sessions` do `db.exec(...)` w server.js; seed 2 konta z zahashowanymi hasłami
2. **Endpointy auth** — `POST /api/auth/login`, `logout`, `me`
3. **Middleware** — `requireAuth` na wszystkich `/api/*` i `express.static` dla `/admin`
4. **login.html** — podłączyć formularz do `POST /api/auth/login` → redirect po sukcesie
5. **Sidebar** — pobrać `/api/auth/me`, wyświetlić imię + rolę, przycisk Wyloguj
6. **Zakładka "Użytkownicy i role"** — lista kont, zmiana hasła, dezaktywacja (tylko superadmin)

## Ważne uwagi

- Hasła startowe wstawiamy **bezpośrednio jako hash do SQLite na serwerze** — NIE do repo git
- Plik `data/parafia.db` jest w `.gitignore` — baza nigdy nie trafia do GitHub
- Przy wdrożeniu: uruchomić skrypt seedujący konta na serwerze przez SSH
- `login.html` musi pozostać dostępny bez uwierzytelnienia (`/admin/login.html` whitelisted)

## Status

- [ ] Wdrożenie zaplanowane na ~tydzień 25–31 sierpnia 2026
- [ ] Decyzja o hasłach startowych: podać developerowi lub wygenerować losowe
