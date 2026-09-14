# Kšírovka – moderní web

Redesign webu [ksirovka.cz](https://ksirovka.cz) s WOW efektem, API-first architekturou a přípravou na budoucí rezervační systém.

## Stack

| Vrstva | Technologie |
|--------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, Framer Motion |
| Backend | Fastify 5, TypeScript, Drizzle ORM |
| DB | PostgreSQL 16 |
| Cache | Redis (Valkey) |

## Rychlý start (lokálně s API)

```bash
# 1. Závislosti
npm install

# 2. Infrastruktura
docker compose up -d

# 3. Env
cp .env.example .env

# 4. Import obsahu ze starého webu
npm run import:content
npm run sync:static-content
npm run db:migrate
npm run db:seed

# 5. Dev servery
npm run dev
```

- Frontend: http://localhost:3800
- API: http://localhost:3801
- PostgreSQL: localhost:3840
- Redis: localhost:3841

## Nasazení na VPS (produkce)

Image staví CI, server ho jen stahuje. Verze = krátký git commit. Rollback je přepnutí na starší tag, databázi nevrací. Migrace jen přidávají.

```bash
./scripts/server-setup.sh   # jednou, idempotentní
./scripts/deploy.sh         # aktuální commit (musí být v GHCR)
./scripts/versions.sh
./scripts/backup.sh
./scripts/rollback.sh       # o krok zpět
```

Cíl (IP, domény, registr) je jen v `deploy/target.env`. Tajemství jen v `/opt/ksirovka-deploy/.env` na serveru — `PG_PASSWORD` jako hex.

Ověření zvenčí: `curl -fsS https://ksirovka.martinpolak.cz/health` musí vrátit stejný `commit`, jaký jsi poslal.

Mobilní Scorecard v releasu volá `https://ksirovka.martinpolak.cz/api/v1`. Nový TestFlight kvůli VPS není potřeba.

## Nasazení na webhosting (FTP)

Sdílený hosting neběží Node API — build je **statický SPA** s vestavěným obsahem:

```bash
npm run build:webhosting
```

Nahrajte **obsah** složky `deploy/ftp-upload/` do `web/` (nebo `www/`) na FTP:

- `index.html`, `index.php`, `.htaccess`, `assets/`
- Build nastaví `VITE_STATIC_ONLY=true` (bez volání API)
- Kontaktní formulář otevře e-mailového klienta (`mailto`)
- Obrázky se načítají z `https://ksirovka.cz` (dokud nebudou na CDN)

Obnovení obsahu ze živého webu:

```bash
npm run refresh:content   # import + sync do frontendu
npm run build:webhosting
```

## Architektura

- **Stateless API** – škálovatelné instance, stav v PostgreSQL/Redis (lokálně / VPS)
- **FTP režim** – statický frontend + `static-content.ts` fallback
- **Zero Trust ready** – rate limiting, helmet, validace (Zod), připraveno na OIDC
- **Rezervace (budoucí)** – tabulka `reservation_slots` připravena ve schématu
- **Obsah 1:1** – crawler importuje HTML ze starého webu

## Jazyky

UI (menu, formuláře, patička) je vícejazyčné. Texty stránek z CMS zůstávají česky.

## Bezpečnost

- Citlivé údaje pouze v `.env` / Secret Manager (nikdy v kódu)
- Rate limit na kontaktní formulář (když běží API)
- IP hash pro audit log (ne plaintext IP)
