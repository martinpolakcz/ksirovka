# PROJECT CONTEXT: Kšírovka
> **Umístění souboru:** `rhino/PROJECT_CONTEXT.md`  
> **Typ projektu:** Hybrid (Web SPA + Fastify API + Expo mobil)  
> **Stav:** Produkční API+web na VPS běží (`9afc089`)  
> **Poslední aktualizace:** 2026-09-24 21:40

---

## 0. Pravidlo tohoto dokumentu
Tento soubor je **jediný zdroj pravdy** pro dlouhodobého AI agenta. Každá změna stavu, úkolu, chyby, deploye, prostředí, rozpočtu nebo architektury se zapisuje sem okamžitě. Související konfigurace a skripty k evidenci patří **výhradně do `rhino/`**.

---

## 1. Hlavní popis projektu
- **Cíl projektu:** Modernizovat web areálu [Kšírovka](https://ksirovka.cz) (golf, fotbalgolf, minigolf, Hopsálkov, Body studio) a propojit ho s mobilní scorecard appkou, aby denní / týdenní / měsíční / roční výsledky hráčů byly na webu i v telefonu.
- **Klíčové vlastnosti:**
  - Redesign webu `ksirovka.cz` 1:1 obsahově ze starého CMS, UI vícejazyčné.
  - API-first backend (obsah, kontakt, TV, admin, scorecard).
  - Mobilní **Kšírovka Scorecard** — 18 jamek, 1–10 hráčů, formáty jednotlivci / dvojice / foursome / fourball.
  - Sync dokončených kol: `POST /api/v1/scorecard/rounds` (idempotentní na `client_round_id`).
  - Klubové žebříčky: `GET /api/v1/scorecard/stats?period=day|week|month|year` — na webu `/vysledky`, v appce obrazovka Žebříčky.
  - Oficiální žebříčky berou jen plných 18 jamek; období v TZ Europe/Prague.
  - Produkce na VPS: jeden image (web dist + Fastify), Caddy, Postgres. Image staví CI, server jen stahuje.
- **Použitý tech stack:**
  - Frontend: React 19.2, TypeScript, Vite 8, Tailwind CSS 4, shadcn/Radix, TanStack Query 5, Zustand 5, Framer Motion 12, i18next, React Router 7. Workspace `@ksirovka/web` v `apps/web`.
  - Backend: Node.js, Fastify 5, TypeScript, Drizzle ORM 0.44, Zod. Workspace `@ksirovka/api` v `apps/api`.
  - Databáze & Storage: PostgreSQL 16. Lokálně `postgres:16-alpine` na **3840**. Redis/Valkey 8 na **3841** (lokálně; v API se zatím nepoužívá). Produkce: Postgres v compose na VPS, bez Redis.
  - Mobil: Expo SDK **54**, React Native 0.81.5, Expo Router 6, Zustand, AsyncStorage. Bundle ID `cz.ksirovka.scorecard`. i18n: vlastní typed messages (`src/i18n`) cs/sk/en/de/pl/vi, locale v persist store. Header v `Screen` je v layoutu pod safe area: vlevo Open-Meteo teplota + otevírací doba (K Lávce 705/8), vpravo glóbus jazyka. Google Play účet schválený 2026-09-23; `eas submit` pořád čeká na Service Account JSON.
  - Ostatní: Docker Compose (lokálně jen DB). Produkce: Caddy + image z GHCR. iOS přes EAS Build / EAS Submit. Android: package `cz.ksirovka.scorecard`; Play Developer účet zaplacený 2026-09-20, app/listing ještě ne.

### Repos / kopie (kritické)
| Cesta | Co to je |
| --- | --- |
| `/Users/martin.polak/Projects/ksirovka` | Web + API (tento dokument žije tady v `rhino/`) |
| `/Users/martin.polak/Projects/ksirovka-app2/ksirovka-app` | **Pracovní kopie mobilu** — odtud se staví a nahrává na App Store |
| `/Users/martin.polak/Projects/ksirovka-app/ksirovka-app` | Starší kopie mobilu, držet v synchronu jen pokud se používá |
| `/Users/martin.polak/Projects/ksirovka-app2` | Git root mobilu + nesouvisející `dochazkovy_system` — **nespouštět `npm start` z `app/`** |

Expo účet: `martinpolak` (`martin.polak.cz@gmail.com`). EAS projekt: `@martinpolak/ksirovka-scorecard`, ID `3e1b9028-9b2a-4fd7-b318-fb0bbaf8ff9b`.

---

## 2. Popis prostředí
### Testovací prostředí (Staging / Dev)
- **URL / IP:** `http://localhost:3800` (web), `http://127.0.0.1:3801` (API, `/health`), Postgres `localhost:3840`, Redis `localhost:3841`. Mobil v simulátoru: Metro localhost, API přes proxy `/api` → 3801.
- **Infrastruktura:** Docker Compose na notebooku (jen DB + Redis). Web a API jako `npm run dev`. Staging compose na VPS je připravený (`deploy/docker-compose.staging.yml`, port 8088, vlastní Postgres, služby `ksirovka-staging-*`) — **ještě nenasazený**.
- **Přístup / Konfigurace:**
  ```bash
  cd /Users/martin.polak/Projects/ksirovka
  npm install
  docker compose up -d
  cp .env.example .env
  npm run db:migrate
  npm run dev
  ```

### Produkční prostředí (Prod)
- **URL / IP:**
  - Nový stack (web + API + scorecard): `https://ksirovka.martinpolak.cz` na VPS **`62.83.17.63`** (Netcup).
  - Oficiální marketingový web: `https://ksirovka.cz` (WebSupport A `109.123.222.131`, statické SPA / FTP) — DNS se zatím **nepřepíná**.
  - Mobil v releasu volá `https://ksirovka.martinpolak.cz/api/v1` (není potřeba nový TestFlight build, jakmile API na téhle URL žije).
  - App Store Connect: Apple ID **6811373052**.
- **Infrastruktura:** Docker Compose v `/opt/ksirovka-deploy`: Caddy :80/:443, `ksirovka-api` (jeden image z GHCR), `ksirovka-postgres`. Image staví CI, tag = krátký git commit. Rollback = starší tag, bez buildu na serveru.
- **DNS (ověřeno 2026-09-14 17:11):**
  - `ksirovka.martinpolak.cz` **A = 62.83.17.63**.
  - **AAAA = `2a0a:4cc0:61:4215:c477:34ff:feb2:9147`** (IPv6 VPS). `/health` přes `-6` vrací `9afc089`.
- **SSH:** `$HOME/.ssh/netcup_ksirovka_ed25519` → `root@62.83.17.63` (Debian 13). Docker nainstalován `server-setup.sh`.
- **Git / CI:** https://github.com/martinpolakcz/ksirovka — `main` `9afc089`, CI success, image `ghcr.io/martinpolakcz/ksirovka:9afc089`.
- **Běží:** Caddy + `ksirovka-api` + Postgres. `/health` A i AAAA i `APP_COMMIT` = `9afc089` (ověřeno 2026-09-20 15:38). Záloha před deployem `ksirovka-20260920-133722.sql.gz` (13 tabulek). Migrace přidala `tv_data_settings` (cron vypnutý). Rollback = `316718a`.

Jediné místo s IP a doménami: `deploy/target.env`.

---

## 3. Postupy pro nasazování nové verze (Deployment Guide)
Migrace jen přidávají. Přejmenování sloupce = dva deploye. Rollback nevrací databázi.

### Nasazení na Testovací prostředí (Staging)
1. **Příprava & Build:** CI na `main` postaví image. Lokálně:
   ```bash
   cd /Users/martin.polak/Projects/ksirovka
   npm install && docker compose up -d && npm run build
   ```
2. **Migrations & Database:**
   ```bash
   npm run db:migrate
   ```
3. **Restart / Reload služby:**
   ```bash
   ./scripts/deploy.sh --staging
   curl -fsS http://62.83.17.63:8088/health
   ```

### Nasazení na Produkční prostředí (Production)
1. **Záloha:**
   ```bash
   ./scripts/backup.sh
   ```
2. **Deploy krok za krokem:**
   ```bash
   # 1) pubkey na VPS (Netcup console / ssh-copy-id)
   # 2) opravit AAAA u ksirovka.martinpolak.cz
   # 3) GitHub repo + první push na main → CI postaví image
   ./scripts/server-setup.sh
   # na serveru doplnit /opt/ksirovka-deploy/.env (PG_PASSWORD hex, ADMIN_*)
   # docker login ghcr.io na VPS
   ./scripts/deploy.sh          # aktuální commit
   ./scripts/deploy.sh a1b2c3d  # konkrétní tag
   ```
3. **Healthcheck & Verification:**
   ```bash
   curl -fsS https://ksirovka.martinpolak.cz/health
   # očekáváno: {"status":"ok","commit":"<tag>"} — musí sedět s nasazeným tagem
   curl -fsS "https://ksirovka.martinpolak.cz/api/v1/scorecard/stats?period=day"
   dig +short A ksirovka.martinpolak.cz
   dig +short AAAA ksirovka.martinpolak.cz
   ssh -i ~/.ssh/netcup_ksirovka_ed25519 root@62.83.17.63 \
     'docker exec ksirovka-ksirovka-api-1 printenv APP_COMMIT ADMIN_PASSWORD | sed "s/./*/g"'
   ./scripts/versions.sh
   ./scripts/rollback.sh        # bez argumentu = o krok zpět
   ```

#### Reload `.env` na produkci (bez nového image)
Soubor je `/opt/ksirovka-deploy/.env`. Compose ho interpoluje **při vytvoření** kontejneru. `docker compose restart` nestačí.

```bash
ssh -i ~/.ssh/netcup_ksirovka_ed25519 root@62.83.17.63
cd /opt/ksirovka-deploy
# upravit .env (nano /opt/ksirovka-deploy/.env)
docker compose up -d --force-recreate ksirovka-api
# když se měnilo KSIROVKA_DOMAIN / CADDY_EMAIL:
# docker compose up -d --force-recreate caddy
docker exec ksirovka-ksirovka-api-1 printenv ADMIN_PASSWORD CORS_ORIGIN | sed 's/./*/g'
curl -fsS https://ksirovka.martinpolak.cz/health
```

Postgres **nerecreatuj** kvůli env — `POSTGRES_PASSWORD` platí jen při prvním startu volume. Do API se dostane jen to, co je ve `deploy/docker-compose.yml` u `environment:` (`PG_PASSWORD`, `ADMIN_*`, `CORS_ORIGIN`, `LEGACY_SITE_URL`).

#### iOS Scorecard (EAS → App Store Connect)
Aktuální IPA: **1.0.0 (8)** `72635b31` finished 2026-09-24 21:33; auto-submit `fde82224` ve frontě na TestFlight. V TestFlight pořád **1.0.0 (7)** `9ccdda44`, dokud Apple build 8 nezpracuje. Produkční URL `https://ksirovka.martinpolak.cz/api/v1`. Rollback iOS = build 7.

#### Android Scorecard (EAS → Google Play)
Účet schválený 2026-09-23. Nový AAB **1.0.0 (6)** ve frontě `7b48d674` (header počasí). Preview APK `57338960`. V Console pořád AAB **1.0.0 (5)**. `eas submit` pořád bez Service Account JSON. Playbook: `rhino/android-play-store.md`.

```bash
cd /Users/martin.polak/Projects/ksirovka-app2/ksirovka-app
# jen telefon (APK / internal):
npx eas-cli build --platform android --profile preview
# obchod (.aab):
npx eas-cli build --platform android --profile production
npx eas-cli submit --platform android --profile production
```

První Play submit = internal testing. Tester instaluje přes **opt-in odkaz + Obchod Play**, ne přes aplikaci Play Console. Production listing až po Data safety, content rating a privacy URL.

---

## 4. Přístupové údaje a hesla (Project Credentials Reference)
- ⚠️ **UPOZORNĚNÍ:** Jen názvy a vault. Žádná čistá hesla.
- **Správce hesel (Vault Link):** `op://RHINO/rhino-ksirovka-prod/` (viz `rhino` workspace `secrets-map.yaml`)
- **Klíčové proměnné:**
  - `DATABASE_URL` — `postgresql://ksirovka:HEX@ksirovka-postgres:5432/ksirovka` (heslo hex)
  - `PG_PASSWORD` — hex, povinné v `/opt/ksirovka-deploy/.env`
  - `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` — TV admin
  - `CORS_ORIGIN` — `https://ksirovka.martinpolak.cz,https://ksirovka.cz,http://localhost:3800`
  - `APP_COMMIT` — razítko z image (CI)
  - `WEB_DIST` — `/app/web-dist` v kontejneru
  - Mobil: `EXPO_PUBLIC_API_URL` volitelné; prod fallback `https://ksirovka.martinpolak.cz/api/v1`
- **Účty (názvy, ne hesla):**
  - Expo: `martinpolak`
  - Apple ID: `martin.polak.cz@gmail.com`
  - GHCR: `ghcr.io/martinpolakcz/ksirovka`
  - VPS: `root@62.83.17.63` (Netcup)
  - Kontakt: `info@ksirovka.cz`

---

## 5. Finanční náklady a rozpočet
| Položka / Služba | Prostředí / Typ | Náklady (Kč nebo USD / měsíc) | Způsob platby | Poznámka |
| --- | --- | --- | --- | --- |
| Doména `ksirovka.cz` | Prod | [Doplnit] | WebSupport | Oficiální web areálu |
| Doména `martinpolak.cz` | Prod API/web | [Doplnit] | [Doplnit] | Subdoména `ksirovka.martinpolak.cz` |
| Hosting WebSupport | Prod marketing | [Doplnit] | WebSupport | Statika + PHP, bez Node |
| VPS Netcup | Prod API+web+DB | [Doplnit] | Netcup | `62.83.17.63` |
| Expo EAS | iOS/Android build | 0 (Free) / [ověřit kvóty] | Karta na expo.dev | |
| Apple Developer Program | Prod iOS | 99 USD / rok | Apple ID | |
| Google Play Developer | Prod Android | 25 USD jednorázově | Google účet | Účet schválený 2026-09-23; app + service account ještě chybí |
| **Celkem měsíčně** | | **[Suma — doplnit VPS + hosting]** | | |

---

## 6. Úkoly a stav projektu (To-Do List)

### 🔴 Vysoká priorita (Blockery / Blízké termíny)
- [x] **Pubkey na VPS** — SSH jako root funguje.
- [x] **AAAA** u `ksirovka.martinpolak.cz` = IPv6 VPS; `/health` přes IPv6 vrací `316718a`.
- [x] **GitHub + CI** — https://github.com/martinpolakcz/ksirovka, image `316718a`.
- [x] **`server-setup.sh` + první `deploy.sh`** — ověřeno zvenčí, commit sedí.
- [x] **Nasadit `9afc089`** — `/tv` mobil + mazání kol. `/health` A i AAAA = `9afc089`. Cron retence na prod vypnutý.
- [ ] **Otestovat kolo v TestFlight** — sync na `/vysledky` i Žebříčky.
- [x] **TV reklamy z ksirovka.cz** — 2026-09-20. 15 záznamů v `tv_promos` lokálně i na prod (8 původních + 7 z hero/dlaždic). Image pořád `9afc089`, jen data. `npm run db:seed-tv` doplní chybějící.
- [ ] Import obsahu do produkční DB (`import:content`) — homepage z API je zatím prázdná.
- [x] **Mobil: název na ikoně Kšírovka** — 2026-09-20. `expo.name` + `CFBundleDisplayName` + Android `label` = Kšírovka. iOS 1.0.0 (7) v TestFlight (`9ccdda44` / submit `409d2554`). Android AAB `414162cf` + APK `926c8d8c`. Play submit pořád bez service account.
- [ ] App Store listing + Submit for Review (screenshoty, privacy). IPA 1.0.0 (8) hotové; TestFlight ještě 1.0.0 (7), dokud Apple nezpracuje submit.
- [x] **Nový iOS/Android EAS build** — 2026-09-20. iOS 1.0.0 (5) v TestFlight (internal beta). Android APK + AAB hotové. Play submit blokuje chybějící Google Service Account.
- [ ] **Android na Play** — AAB 1.0.0 (5) je v knihovně Console. Druhý upload stejného souboru padá („kód verze 5 už byl použit“) — přidat z knihovny, ne nahrávat znovu. Listing pořád chybí.

### 🟡 Střední priorita (Nové funkce / Refaktoring)
- [x] **Mobil: mezera tlačítek + i18n** — 2026-09-20 v `ksirovka-app2`. Mezera (`gap`) mezi Uložit profil / Odhlásit se i u stacked tlačítek na about/results/scorecard. Jazyky cs/sk/en/de/pl/vi, detekce zařízení + picker, persist `locale`.
- [x] **Mobil: jazyk vpravo nahoře** — 2026-09-23. Místo chipů malá ikona (glóbus + kód) na `Screen`, menu po klepnutí.
- [x] **Mobil: header pod status bar + počasí** — 2026-09-24 v `ksirovka-app2`. Jazyk už není `absolute top: 4` (překrýval signál/baterii). Vlevo chip: teplota Open-Meteo na Kšírovce + drobný text Otevřeno do / Otevře v. Bez počtu hráčů (0 by bylo prázdné). Žádný nový backend.
- [ ] **Liquid glass na chromu scorecard** — pin `LiveStandings` + akcí přes `expo-blur`, ať mřížka jamek jede pod lištou. Audit: `rhino/ui-liquid-glass.md`.
- [ ] Import obsahu do produkční DB (`import:content`) až poběží API.
- [ ] Staging na VPS (`./scripts/deploy.sh --staging`) s vlastními daty.
- [ ] Privacy policy stránka.
- [ ] Android listing v Play Console (screenshoty, Data safety) až po prvním AAB.
- [ ] Sjednotit pracovní a starší kopii mobilu.

### 🟢 Nízká priorita / Návrhy (Backlog)
- [ ] Přepnout `ksirovka.cz` A/AAAA na VPS (až bude stack ověřený).
- [ ] Rezervační systém.
- [ ] CDN pro obrázky.
- [ ] EAS Workflows: build + TestFlight po pushi.

---

## 7. Otevřené body a diskuse (Open Points)
- [ ] **ADMIN_PASSWORD** je vygenerovaný hex v `/opt/ksirovka-deploy/.env` — 2026-09-20 ho uživatel hledal (není v UI ani v gitu). Pořád uložit do vaultu.
- [ ] **ksirovka.cz vs martinpolak.cz** — ostré API je na subdoméně (appka to tak má). Apex zůstává na WebSupport, dokud se nerozhodne o přepnutí.
- [ ] Apple login v EAS: dočasný `EXPO_APP_STORE_AUTH_SERVICE_KEY` (eas-cli#4392).
- [ ] Privacy / GDPR text — blokuje App Store i Google Play.
- [x] Google Play Developer účet — zaplaceno 2026-09-20 (uživatel). App + service account ještě chybí.
- [ ] **Liquid glass vs. overlay:** dnešní lišty obsah neoverlayují, jen mu berou výšku. Sklo má smysl až po pinu chromu (scorecard spodní lišta první). Karty na plochém gradientu zatím ne.

---

## 8. Seznam chyb (Issue Tracker)
### Otevřené chyby (Active Bugs)
| ID | Popis chyby | Závažnost | Prostředí | Krok k reprodukci |
| --- | --- | --- | --- | --- |
| BUG-04 | Statický FTP web nemá live `/vysledky` | Med | Prod (`ksirovka.cz`) | Otevřít `/vysledky` na ostrém hostingu bez API |

### Vyřešené chyby (Resolved Bugs Audit)
| ID | Popis chyby | Datum opravy | Způsob řešení / Commit |
| --- | --- | --- | --- |
| BUG-01 | `eas build` / Apple login: `iTunes service key is empty` | 2026-09-12 | `EXPO_APP_STORE_AUTH_SERVICE_KEY` + ASC API key |
| BUG-02 | EAS `npm ci` EUSAGE — závislosti mimo lockfile | 2026-09-12 | Závislosti odstraněny, build `f2c5af4a-…` prošel |
| BUG-03 | Produkční API pro scorecard neběželo | 2026-09-14 | VPS + CI image `316718a`; `/health` A i AAAA sedí |
| BUG-05 | AAAA mířila na WebSupport | 2026-09-14 | AAAA = `2a0a:4cc0:61:4215:c477:34ff:feb2:9147` |
| BUG-06 | `/tv` na mobilu rozbitý layout | 2026-09-20 | Responzivní sloupec do `lg`; image `9afc089` |
| BUG-07 | iframe `/tv` na martinpolak.cz freelancer | 2026-09-20 | Caddy: `/tv` bez X-Frame-Options, `frame-ancestors` jen martinpolak.cz. Image pořád `9afc089`. |
| BUG-08 | Jazyk v appce pod ikonami status baru | 2026-09-24 | Header row v layoutu pod SafeArea; `LanguagePicker` už není absolute. |

---

## 9. Monitoring a zdraví systému
- **Monitoring nástroje:** zatím žádné. Po nasazení: `./scripts/versions.sh`, `/health` zvenčí.
- **Důležité logy:**
  - Produkce: `ssh root@62.83.17.63 'cd /opt/ksirovka-deploy && docker compose logs -f ksirovka-api'`
  - Lokální API: stdout `npm run dev -w @ksirovka/api`
  - EAS: `https://expo.dev/accounts/martinpolak/projects/ksirovka-scorecard/builds`
- **Kritické metriky:**
  - `/health` → `{"status":"ok","commit":"<tag>"}` musí sedět s `IMAGE_TAG`.
  - Scorecard rate limit: 40 req / 15 min / IP.
  - Záloha: denní dump, ověření počtem `CREATE TABLE` (≥ 12), kopie mimo server (`~/ksirovka-backups`).
  - TestFlight 1.0.0 (5) internal beta (nahráno 2026-09-20); (3) pořád platné.

---

## 10. Architektura scorecard (stručně)
```
Mobil (Expo) --POST /api/v1/scorecard/rounds--> Fastify + Postgres (VPS)
     |                                              |
     +--GET /api/v1/scorecard/stats                 +-- Web /vysledky
```
- Idempotence: unikátní `client_round_id`; duplicita vrací `{ success: true, duplicate: true }`.
- Login v appce je lokální profil (e-mail + jméno v AsyncStorage), ne OIDC.
- Store build jde na HTTPS `https://ksirovka.martinpolak.cz/api/v1`.
- TV admin `/admin/kola` maže kola (cascade hráči + jamky). Cron retence běží v procesu API (ne systemd): jednou denně v `runHour` Europe/Prague, maže kola starší než `retentionDays`. Výchozí vypnuto.
- TV reklamy: tabulka `tv_promos`, admin `/admin` → reklamy, board `GET /api/v1/tv/board`. Výchozí sada 15 kusů v `apps/api/src/data/tv-promos.ts` (hero + dlaždice ksirovka.cz). Na prod nahráno 2026-09-20 (15 řádků).

---

## 11. Mobilní UI (liquid glass)
- Obal: `Screen` = `LinearGradient` `#111f19 → #21382d`; horní řádek v toku pod safe area (počasí vlevo, jazyk vpravo), ne overlay.
- `Card` = `rgba(38,68,53,0.85)` v toku, ne overlay.
- Jediné místo, kde chrom sedí na obsahu: **scorecard** — `LiveStandings` (0.95) + akční tlačítka pod `ScrollView` (v toku, ne `absolute`).
- Detail auditu: `rhino/ui-liquid-glass.md`.
- **Logo (2026-09-20):** motiv tyrkys + oranžový oblouk + tečka. `Logo.tsx` bere `assets/logo-mark.png`. Store ikony v 1.0.0 (5) / Android versionCode 2.
