# Porty projektu Kšírovka (rozsah 3800–3899)

| Služba              | Port | URL / připojení                    |
| ------------------- | ---- | ---------------------------------- |
| Frontend (Vite)     | 3800 | http://localhost:3800              |
| API (Fastify)       | 3801 | http://localhost:3801              |
| PostgreSQL (Docker) | 3840 | localhost:3840                     |
| Redis (Docker)      | 3841 | localhost:3841                     |

Při změně portů upravte: `apps/web/vite.config.ts`, `apps/api/src/config.ts`, `.env`, `docker-compose.yml`.
