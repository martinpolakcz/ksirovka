# PROJECT CONTEXT: Kšírovka
> **Umístění souboru:** `rhino/PROJECT_CONTEXT.md`  
> **Typ projektu:** Hybrid (Web SPA + Fastify API + Expo mobil)  
> **Stav:** Produkční API+web na VPS běží (`316718a`)  
> **Poslední aktualizace:** 2026-09-14 17:12

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
  - Mobil: Expo SDK **54**, React Native 0.81.5, Expo Router 6, Zustand, AsyncStorage. Bundle ID `cz.ksirovka.scorecard`.
  - Ostatní: Docker Compose (lokálně jen DB). Produkce: Caddy + image z GHCR. iOS přes EAS Build / EAS Submit.

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
  - **AAAA = `2a0a:4cc0:61:4215:c477:34ff:feb2:9147`** (IPv6 VPS). `/health` přes `-6` vrací `316718a`.
- **SSH:** `$HOME/.ssh/netcup_ksirovka_ed25519` → `root@62.83.17.63` (Debian 13). Docker nainstalován `server-setup.sh`.
- **Git / CI:** https://github.com/martinpolakcz/ksirovka — `main` `316718a`, CI success, image `ghcr.io/martinpolakcz/ksirovka:316718a`.
- **Běží:** Caddy + `ksirovka-api` + Postgres. `/health` zvenčí i `APP_COMMIT` v kontejneru = `316718a`. Caddyfile inode hostitel = kontejner. Noční záloha timer 03:17 UTC.

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

#### iOS Scorecard (EAS → App Store Connect)
Produkční URL v appce už je `https://ksirovka.martinpolak.cz/api/v1`. Nový build kvůli napojení na VPS **není nutný**, jakmile `/health` a `/api/v1/scorecard/*` zvenčí odpovídají.

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
| Expo EAS | iOS build/submit | 0 (Free) / [ověřit kvóty] | Karta na expo.dev | |
| Apple Developer Program | Prod iOS | 99 USD / rok | Apple ID | |
| **Celkem měsíčně** | | **[Suma — doplnit VPS + hosting]** | | |

---

## 6. Úkoly a stav projektu (To-Do List)

### 🔴 Vysoká priorita (Blockery / Blízké termíny)
- [x] **Pubkey na VPS** — SSH jako root funguje.
- [x] **AAAA** u `ksirovka.martinpolak.cz` = IPv6 VPS; `/health` přes IPv6 vrací `316718a`.
- [x] **GitHub + CI** — https://github.com/martinpolakcz/ksirovka, image `316718a`.
- [x] **`server-setup.sh` + první `deploy.sh`** — ověřeno zvenčí, commit sedí.
- [ ] **Otestovat kolo v TestFlight** — sync na `/vysledky` i Žebříčky.
- [ ] Import obsahu do produkční DB (`import:content`) — homepage z API je zatím prázdná.
- [ ] App Store listing + Submit for Review (screenshoty, privacy, build 1.0.0 (3)).

### 🟡 Střední priorita (Nové funkce / Refaktoring)
- [ ] Import obsahu do produkční DB (`import:content`) až poběží API.
- [ ] Staging na VPS (`./scripts/deploy.sh --staging`) s vlastními daty.
- [ ] Privacy policy stránka.
- [ ] Android / Google Play.
- [ ] Sjednotit pracovní a starší kopii mobilu.

### 🟢 Nízká priorita / Návrhy (Backlog)
- [ ] Přepnout `ksirovka.cz` A/AAAA na VPS (až bude stack ověřený).
- [ ] Rezervační systém.
- [ ] CDN pro obrázky.
- [ ] EAS Workflows: build + TestFlight po pushi.

---

## 7. Otevřené body a diskuse (Open Points)
- [ ] **ADMIN_PASSWORD** je vygenerovaný hex v `/opt/ksirovka-deploy/.env` — uložit do vaultu, do gitu ne.
- [ ] **ksirovka.cz vs martinpolak.cz** — ostré API je na subdoméně (appka to tak má). Apex zůstává na WebSupport, dokud se nerozhodne o přepnutí.
- [ ] Apple login v EAS: dočasný `EXPO_APP_STORE_AUTH_SERVICE_KEY` (eas-cli#4392).
- [ ] Privacy / GDPR text pro App Store.

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
  - TestFlight 1.0.0 (3) vyprší za 90 dní od 2026-09-12.

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
