# Utrzymanie serwisu — rutyna dewelopera

Projekt: Parafia NSPJ Czerwionka  
Serwer: VPS CyberFolks vroot_START, IP 91.228.196.179, Ubuntu 24.04  
Stack: Node.js 22 + Express + SQLite + nginx + PM2  
Domena: sacrum.wideart.agency  
Dostep: PuTTY (SSH), WinSCP (pliki), panel CyberFolks (VPS)

---

## CO TYDZIEN (~15 min)

### 1. Sprawdzenie monitoringu i alertow

UptimeRobot wysyla maila automatycznie gdy strona padnie. Nie trzeba nic robic — czekasz na alert.  
Opcjonalnie: wejdz na uptimerobot.com i sprawdz dashboard.

### 2. Przeglad logow serwera

Wejdz przez PuTTY:

```bash
pm2 logs --lines 50
```

Szukasz linii z `Error`, `ECONNREFUSED`, `SQLITE_BUSY` lub innych bledow.  
Jesli czysto — OK.  
Jesli bledy sie powtarzaja — diagnoza i naprawa.

### 3. Weryfikacja cronow SMS

To samo co logi — w `pm2 logs` widac linie typu:

```
SMS reminder wyslany do 600123456
```

lub bledy SMS. Cron odpala sie co godzine automatycznie.  
Sprawdzasz czy sa wpisy z ostatnich dni.

Mozna tez sprawdzic bezposrednio w bazie:

```bash
cd /var/www/kosciol/data
sqlite3 parafia.db "SELECT * FROM sms_log ORDER BY sent_at DESC LIMIT 10;"
```

---

## CO MIESIAC (~40 min)

### 4. Backup bazy danych

Baza SQLite zawiera dane osobowe parafian (RODO). To najwazniejszy plik na serwerze.

**Przez WinSCP:**
1. Polacz sie z serwerem (91.228.196.179)
2. Przejdz do `/var/www/kosciol/data/`
3. Pobierz `parafia.db` na lokalny dysk
4. Zapisz z data w nazwie, np. `parafia_2026-08-13.db`

**Alternatywnie przez PuTTY (kopia na serwerze):**

```bash
cp /var/www/kosciol/data/parafia.db /var/www/kosciol/data/backups/parafia_$(date +%Y%m%d).db
```

Uwaga: kopia na tym samym serwerze nie chroni przed awaria dysku. Zawsze pobieraj na lokalny dysk.

### 5. Kontrola zuzycia SMS

Wejdz na panel SMSPlanet w przegladarce. Sprawdz ile SMS-ow wyslano w tym miesiacu.  
Limit w systemie: 300/miesiac.

Mozna tez sprawdzic z PuTTY:

```bash
cd /var/www/kosciol/data
sqlite3 parafia.db "SELECT COUNT(*) FROM sms_log WHERE sent_at LIKE '$(date +%Y-%m)%';"
```

### 6. Kontrola dysku, RAM, obciazenia serwera

```bash
# Miejsce na dysku
df -h

# RAM i procesy
htop
# (wyjscie z htop: klawisz Q)

# Rozmiar bazy
ls -lh /var/www/kosciol/data/parafia.db
```

VPS ma 30 GB dysku. Obecnie ~19% zajete. Sledz wzrost — galeria ze zdjeciami bedzie rosla.

### 7. Sprawdzenie dostepnych patchy bezpieczenstwa

```bash
apt list --upgradable
```

Jesli sa krytyczne patche (kernel, openssl, nginx) — zainstaluj od razu:

```bash
sudo apt update && sudo apt upgrade -y
```

Jesli nie pilne — mozna zostawic do kwartalnego przegladu.

---

## CO KWARTAL (~1.5h)

### 8. Aktualizacja systemu operacyjnego

```bash
sudo apt update && sudo apt upgrade -y
```

Po upgrade sprawdz czy serwis dziala:

```bash
pm2 status
```

Jesli PM2 pokazuje `online` — OK. Jesli `errored` — sprawdz logi: `pm2 logs`.

### 9. Sprawdzenie wersji Node.js

```bash
node -v
```

Porownaj z aktualna wersja LTS na https://nodejs.org  
Jesli Twoja wersja ma krytyczne CVE (luki bezpieczenstwa) — update:

```bash
# Przy uzyciu nvm (jesli zainstalowany):
nvm install --lts
nvm use --lts
pm2 restart all

# Lub reczny update:
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
pm2 restart all
```

### 10. Test auto-odnawiania certyfikatu SSL

```bash
sudo certbot renew --dry-run
```

Jesli wynik: `Congratulations, all simulated renewals succeeded` — OK.  
Jesli blad — napraw zanim certyfikat wygasnie (Let's Encrypt = 90 dni).

Sprawdz date wygasniecia:

```bash
sudo certbot certificates
```

### 11. Przeglad logow nginx — podejrzany ruch

```bash
# Ostatnie 100 requestow
tail -100 /var/log/nginx/access.log

# Szukaj podejrzanych sciezek (proba wlamania)
grep -i "wp-admin\|phpmyadmin\|.env\|passwd" /var/log/nginx/access.log | tail -20

# Ile requestow dziennie (czy ktos nie DDoSuje)
awk '{print $4}' /var/log/nginx/access.log | cut -d: -f1 | sort | uniq -c | sort -rn | head -10
```

Typowe: boty skanujace WordPressa (wp-admin, wp-login). Nasza strona nie jest na WordPressie wiec zwracaja 404 — to normalne.

### 12. Optymalizacja bazy danych (VACUUM)

SQLite z czasem zostawia puste miejsce po usunietych rekordach. VACUUM kompresuje baze.

```bash
cd /var/www/kosciol/data
sqlite3 parafia.db "VACUUM;"
sqlite3 parafia.db "ANALYZE;"
```

VACUUM — kompresuje i defragmentuje baze.  
ANALYZE — aktualizuje statystyki dla szybszych zapytan.

Czas wykonania: sekundy. Robic raz na kwartal lub gdy baza urosnie powyzej 50 MB.

---

## CO POL ROKU (~1.5h)

### 13. Audyt zaleznosci npm

```bash
cd /var/www/kosciol
npm audit
```

Jesli sa `critical` lub `high` — napraw:

```bash
npm audit fix
pm2 restart all
```

Jesli `npm audit fix` nie pomoze — trzeba recznie zaktualizowac pakiet w `package.json`.

### 14. Weryfikacja warunkow API SMS (SMSPlanet)

Wejdz na panel SMSPlanet. Sprawdz:
- Czy konto jest aktywne
- Czy stawka za SMS sie nie zmienila
- Czy nadawca `ParafiaNSPJ` jest nadal zatwierdzony
- Czy token API jest wazny

Token jest ustawiony w PM2 jako zmienna srodowiskowa `SMSPLANET_TOKEN`.

### 15. Test odtworzenia z backupu

Wez ostatni backup `parafia_YYYYMMDD.db` z lokalnego dysku i sprawdz czy da sie go otworzyc:

```bash
# Na lokalnym komputerze (potrzebujesz sqlite3):
sqlite3 parafia_20260813.db "SELECT COUNT(*) FROM intencje;"
sqlite3 parafia_20260813.db "SELECT COUNT(*) FROM parafianie;"
```

Jesli zwraca liczby — backup jest poprawny.  
Jesli blad `database is malformed` — backup jest uszkodzony i trzeba pobrac nowy.

---

## CO ROK (~2.5h)

### 16. Oplata i odnowienie VPS

Panel CyberFolks — sprawdz date wygasniecia VPS.  
Oplac przed wygasnieciem zeby uniknac wylaczenia serwera.

### 17. Sprawdzenie domeny

Jesli domena jest u parafii — upewnij sie ze ja oplacili.  
Jesli domena jest u nas — oplac przed wygasnieciem.

Sprawdz date wygasniecia:

```bash
whois nspjczerwionka.pl | grep -i expir
```

### 18. Pelny audyt bezpieczenstwa serwera

```bash
# Kto ma dostep do serwera
cat /etc/passwd | grep -v nologin | grep -v false

# Jakie porty sa otwarte
ss -tlnp

# Status firewalla
sudo ufw status

# Uprawnienia do plikow bazy (RODO!)
ls -la /var/www/kosciol/data/

# Czy nginx nie wystawia czegos czego nie powinien
sudo nginx -T | grep location

# Ostatnie logowania SSH
last -10

# Nieudane proby logowania
sudo grep "Failed password" /var/log/auth.log | tail -20
```

Co sprawdzasz:
- Czy nie ma nieznanych uzytkownikow na serwerze
- Czy otwarte sa tylko porty 22 (SSH), 80 (HTTP), 443 (HTTPS)
- Czy firewall jest wlaczony
- Czy baza danych nie jest dostepna publicznie (uprawnienia pliku)
- Czy nikt nie probowal sie wlamac (auth.log)

---

## SYTUACJE AWARYJNE

### Strona nie dziala (UptimeRobot alert)

```bash
# Sprawdz czy PM2 dziala
pm2 status

# Jesli errored — restart
pm2 restart all

# Jesli dalej nie dziala — sprawdz logi
pm2 logs --lines 100

# Sprawdz nginx
sudo systemctl status nginx

# Jesli nginx padl
sudo systemctl restart nginx
```

### Baza danych zablokowana (SQLITE_BUSY)

```bash
# Sprawdz kto trzyma lock
fuser /var/www/kosciol/data/parafia.db

# Restart PM2 zwykle rozwiazuje problem
pm2 restart all
```

### Dysk pelny

```bash
# Co zajmuje miejsce
du -sh /var/www/kosciol/* | sort -rh | head -10

# Stare logi PM2
pm2 flush

# Stare logi nginx
sudo truncate -s 0 /var/log/nginx/access.log
```

### SMS nie wychodza

1. Sprawdz token: `pm2 env 0 | grep SMSPLANET`
2. Sprawdz saldo na panelu SMSPlanet
3. Sprawdz limit miesieczny w bazie:
   ```bash
   sqlite3 /var/www/kosciol/data/parafia.db "SELECT COUNT(*) FROM sms_log WHERE sent_at LIKE '$(date +%Y-%m)%';"
   ```
4. Sprawdz logi: `pm2 logs --lines 50`

---

## SZACUNKOWY CZAS PRACY

| Czestotliwosc | Czas/raz | Razy/rok | Razem/rok |
|---|---|---|---|
| Co tydzien | 15 min | 52 | ~13h |
| Co miesiac | 40 min | 12 | ~8h |
| Co kwartal | 1.5h | 4 | ~6h |
| Co pol roku | 1.5h | 2 | ~3h |
| Co rok | 2.5h | 1 | ~2.5h |
| **RAZEM** | | | **~32.5h/rok** |

To jest sama rutyna — bez awarii, bez zgloszen ksiedza, bez zmian w kodzie.
