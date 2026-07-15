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

Copy the example env file and adjust values if needed:

```bash
cp .env.example .env
```

Default local values:

| Variable     | Default                  | Description              |
| ------------ | ------------------------ | ------------------------ |
| `NODE_ENV`   | `development`            | Runtime environment      |
| `PORT`       | `3000`                   | API port                 |
| `DB_HOST`    | `localhost`              | PostgreSQL host          |
| `DB_PORT`    | `5432`                   | PostgreSQL port          |
| `DB_USERNAME`| `postgres`               | Database user            |
| `DB_PASSWORD`| `postgres`               | Database password        |
| `DB_DATABASE`| `mini_operations_wallet` | Database name            |

### 3. Start PostgreSQL

**Option A — Docker (recommended)**

```bash
docker compose up postgres -d
```

**Option B — Local PostgreSQL**

Create a database named `mini_operations_wallet` and ensure credentials match your `.env`.

### 4. Run the API

```bash
npm run start:dev
```

The API will be available at:

- **API base:** http://localhost:3000/api
- **Swagger docs:** http://localhost:3000/api/docs
- **Health check:** http://localhost:3000/api/health

## Docker (Full Stack)

Run both PostgreSQL and the API with hot reload:

```bash
docker compose up --build
```

Stop services:

```bash
docker compose down
```

Remove volumes (clears database data):

```bash
docker compose down -v
```

## Available Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run start`     | Start in production mode             |
| `npm run start:dev` | Start with watch mode (development)  |
| `npm run start:prod`| Run compiled production build        |
| `npm run build`     | Compile TypeScript to `dist/`        |
| `npm run lint`      | Run ESLint                           |
| `npm run test`      | Run unit tests                       |
| `npm run test:e2e`  | Run end-to-end tests                 |
| `npm run migration:generate -- src/database/migrations/MigrationName` | Generate a migration |
| `npm run migration:run`   | Run pending migrations       |
| `npm run migration:revert`  | Revert last migration        |

## Project Structure

```
src/
├── database/
│   ├── data-source.ts      # TypeORM CLI data source
│   ├── migrations/         # Database migrations
│   └── typeorm.config.ts   # NestJS TypeORM config
├── health/
│   ├── health.controller.ts
│   └── health.module.ts
├── app.module.ts
└── main.ts
```

## Adding New Features

1. Generate a module: `npx nest g module <name>`
2. Generate a controller: `npx nest g controller <name>`
3. Generate a service: `npx nest g service <name>`
4. Create entities in your module folder (e.g. `*.entity.ts`)
5. TypeORM will auto-load entities via `autoLoadEntities: true`

## API Endpoints

| Method | Path          | Description                    |
| ------ | ------------- | ------------------------------ |
| GET    | `/api`        | Root / welcome message         |
| GET    | `/api/health` | Health check (includes DB ping)|

## Production Notes

- Set `NODE_ENV=production` — schema sync is disabled in production
- Use migrations instead of `synchronize: true`
- Build the Docker production image: `docker build --target production -t mini-operations-wallet-portal .`

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for stack, request flow, layout, and design decisions.

## AI usage disclosure

Parts of this project’s initial scaffolding (NestJS layout, Docker/Compose setup, TypeORM/PostgreSQL wiring, health module, Swagger bootstrap, and docs) were generated and assisted with Cursor AI. Business logic and subsequent features are developed by the team; AI may also be used for scaffolding, refactors, and explanations. Review and ownership remain with the human authors.

## License

UNLICENSED — private project
