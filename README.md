# Mini Operations Wallet Portal

NestJS backend API for the Mini Operations Wallet Portal, with PostgreSQL, TypeORM, Swagger, and Docker support.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (22 recommended)
- [npm](https://www.npmjs.com/) 10+
- [Docker](https://www.docker.com/) and Docker Compose (optional, for containerized setup)

## Quick Start (Local)

### 1. Clone and install

```bash
git clone <repository-url>
cd mini-operations-wallet-portal
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable      | Default                  | Description |
| ------------- | ------------------------ | ----------- |
| `NODE_ENV`    | `development`            | Runtime environment |
| `PORT`        | `3000`                   | API port |
| `DB_HOST`     | `localhost`              | PostgreSQL host |
| `DB_PORT`     | `5432`                   | PostgreSQL port |
| `DB_USERNAME` | `postgres`               | Database user |
| `DB_PASSWORD` | `postgres`               | Database password |
| `DB_DATABASE` | `mini_operations_wallet` | Database name |
| `SEED_DATA`   | `false`                  | When `true`, seed 3 users with USD wallets @ balance `100` |

### 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

Or create a local database named `mini_operations_wallet` matching `.env`.

### 4. Run the API

```bash
# optional: seed demo users/wallets
# set SEED_DATA=true in .env

npm run start:dev
```

- **API base:** http://localhost:3000/api  
- **Swagger:** http://localhost:3000/api/docs  
- **Health:** http://localhost:3000/api/health  

## Docker (Full Stack)

```bash
docker compose up --build
```

```bash
docker compose down        # stop
docker compose down -v     # stop + wipe DB volume
```

## API overview

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/users` | Create user |
| `GET` | `/api/users` | List users (`page`, `limit`, `search`) |
| `POST` | `/api/wallets` | Create wallet (balance starts at `0`) |
| `GET` | `/api/wallets` | List wallets (`page`, `limit`, optional `userId`, `currency`, `status`) |
| `GET` | `/api/wallets/:id` | Get wallet |
| `POST` | `/api/wallets/:id/credit` | Credit (`amount`, `referenceId`, optional `description`) |
| `POST` | `/api/wallets/:id/debit` | Debit (same body; no negative balance) |
| `GET` | `/api/wallets/:id/transactions` | Ledger (`page`, `limit`, `type`, `referenceId`) |
| `GET` | `/api/reports/daily-summary?date=YYYY-MM-DD` | System-wide UTC daily summary (zeros if empty; no pagination) |
| `GET` | `/api/health` | Health check |

**Important:** Clients must generate and send `referenceId` on credit/debit (unique **per wallet**). Retries must reuse the same id. Duplicates → `409`. See [docs/FRONTEND-API-CONTEXT.md](docs/FRONTEND-API-CONTEXT.md).

## Seed data

Set `SEED_DATA=true` then restart the API. Seeds (idempotent by email):

| Email | Wallet |
| ----- | ------ |
| `seed.alice@example.com` | USD @ `100.00` |
| `seed.bob@example.com` | USD @ `100.00` |
| `seed.carol@example.com` | USD @ `100.00` |

## Project structure

```
src/
├── users/
├── wallets/            # credit/debit + locking live here
├── transactions/
├── reports/            # daily summary
├── common/             # pagination, money helpers
├── database/           # TypeORM config + SeedModule
├── health/
└── main.ts
```

## Available Scripts

| Script | Description |
| ------ | ----------- |
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled build |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests |
| `npm run migration:run` | Run migrations |

## Architecture and domain docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack and layout  
- [docs/DOMAIN-AND-SOLUTION.md](docs/DOMAIN-AND-SOLUTION.md) — domain + technical decisions  
- [docs/FRONTEND-API-CONTEXT.md](docs/FRONTEND-API-CONTEXT.md) — FE-oriented API guide  

## Known limitations

- No authentication (implicit system-admin API).
- No wallet-to-wallet transfer endpoint.
- Daily summaries bucket by **UTC** date.
- `synchronize` is enabled outside production; use migrations in production.

## Production Notes

- Set `NODE_ENV=production` (disables schema sync).
- Prefer migrations over `synchronize`.
- Keep `SEED_DATA=false` in production unless intentionally seeding.
- Production image: `docker build --target production -t mini-operations-wallet-portal .`

## AI usage disclosure

Parts of this project’s initial scaffolding (NestJS layout, Docker/Compose setup, TypeORM/PostgreSQL wiring, health module, Swagger bootstrap, domain docs, and feature modules) were generated and assisted with Cursor AI. Business logic and subsequent features are developed by the team; AI may also be used for scaffolding, refactors, and explanations. Review and ownership remain with the human authors.

## License

UNLICENSED — private project
