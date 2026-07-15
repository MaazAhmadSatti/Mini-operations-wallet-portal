# Mini Operations Wallet Portal

NestJS + PostgreSQL wallet ops API with a minimal React admin UI.

## Prerequisites (install these)

| Tool | Version | Why |
|------|---------|-----|
| [Node.js](https://nodejs.org/) | 20+ (22 recommended) | Runs Nest API and Vite/React UI |
| npm | 10+ (comes with Node) | Installs project dependencies |
| [Docker](https://www.docker.com/) + Compose | recent | Postgres via `docker compose` (or use your own Postgres 16+) |

**Stack (installed by `npm install` — do not install globally):**

| Area | Packages |
|------|----------|
| Backend | NestJS 11, TypeORM, PostgreSQL driver (`pg`), Swagger, Terminus, decimal.js, Jest |
| Frontend (`frontend/`) | React 19, React Router, Vite 6, TypeScript |

Check versions:

```bash
node -v
npm -v
docker -v
docker compose version
```

## Quick start

```bash
cp .env.example .env
docker compose up postgres -d
npm install
# optional: SEED_DATA=true in .env
npm run start:dev
```

- API: http://localhost:3000/api  
- Swagger: http://localhost:3000/api/docs  

**Frontend**

```bash
cd frontend && npm install && npm run dev
```

- UI: http://localhost:5173 (proxies `/api` → `:3000`)

| Env | Default | Notes |
|-----|---------|--------|
| `PORT` | `3000` | API |
| `DB_*` | local postgres | See `.env.example` |
| `SEED_DATA` | `false` | `true` → 3 users + USD wallets @ `100.00` |

## API (summary)

Users, wallets, credit/debit, transactions, `GET /reports/overview`, `GET /reports/daily-summary?date=`.  
Credit/debit require client `referenceId` (unique per wallet); duplicates → **409**.  
Details: [docs/FRONTEND-API-CONTEXT.md](docs/FRONTEND-API-CONTEXT.md).

## Docs

| Doc | Content |
|-----|---------|
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Stack / layout |
| [DOMAIN-AND-SOLUTION](docs/DOMAIN-AND-SOLUTION.md) | Domain + technical decisions |
| [FRONTEND-API-CONTEXT](docs/FRONTEND-API-CONTEXT.md) | API contract for UI/clients |
| [FRONTEND](docs/FRONTEND.md) | UI structure + how it works |
| [TESTING](docs/TESTING.md) | Automated tests + concurrency notes |

## Frontend manual checklist

With API + `SEED_DATA=true` and UI running:

1. **Dashboard** — overview cards show totals (not blank / error).
2. **Users** — list seed users; search by name/email; create a user (success banner).
3. **Wallets** — list wallets; open one; optional create wallet for a user id.
4. **Wallet detail** — balance/status visible; **credit** then **debit**; table updates; banners clear.
5. **Errors** — debit more than balance → meaningful error; frozen/inactive if you set status via API → blocked with message.
6. **Daily report** — pick today’s UTC date; after credit/debit, credits/debits/count move; empty day shows zeros.

## Tests

```bash
npm test                 # unit (no DB)
npm run test:e2e         # integration — needs Postgres up
```

Unit: credit, debit, duplicate `referenceId`, status guards, concurrent lock simulation.  
E2E: same money flows over HTTP against real Postgres (see [docs/TESTING.md](docs/TESTING.md)).

## Scripts

`start:dev` · `build` · `test` · `lint` · `migration:run` · frontend: `cd frontend && npm run dev`

## Known limitations

No auth · no transfers · daily buckets in **UTC** · `synchronize` off in production (use migrations).

## AI usage disclosure

**Used AI (Cursor) for:** Nest/Docker/TypeORM scaffold; feature modules (users/wallets/transactions/reports); locking/idempotency wiring; seed flag; Vite React admin UI; docs drafts; unit tests for money moves.

**Manually designed / decided:** Product rules (per-wallet `referenceId`, 409 on duplicate, UTC daily summary, zeros for empty days, `SEED_DATA` gate, money as `numeric(19,2)` + strings, same-repo frontend, overview API for dashboard, UI layout).

**Tradeoffs:** Pessimistic row locks (simple correctness over optimistic retries); decimal strings over JS floats and over integer cents (readable multi-currency codes); UUID ids (safe without auth) over sequential ints; thin hooks/pages UI over a heavy FE framework; overview aggregate endpoint vs FE summing pages; unit tests for fast CI plus a small Postgres e2e suite for real locks (optional in CI).

Review and ownership remain with the human authors.

## License

UNLICENSED — private project
