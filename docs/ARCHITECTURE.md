# Architecture

Concise reference for the Mini Operations Wallet Portal API.

## Purpose

NestJS backend for wallet/operations workflows. PostgreSQL is the system of record via TypeORM.

## Runtime stack

```
Client / Swagger
       │
       ▼
  NestJS (HTTP, /api)
       │
       ├── Modules (controllers → services)
       │
       ▼
  TypeORM
       │
       ▼
  PostgreSQL
```

## Request flow

1. Request hits the API (global prefix `/api`).
2. Global `ValidationPipe` validates/transforms DTOs.
3. Feature module controller → service → TypeORM repository/entity.
4. Response returned as JSON.
5. Swagger UI at `/api/docs` documents controllers as they are added.

## Layout

| Path | Role |
|------|------|
| `src/main.ts` | Bootstrap: prefix, validation, Swagger, listen |
| `src/app.module.ts` | Root module (config, TypeORM, feature modules) |
| `src/health/` | Health check (`GET /api/health` + DB ping) |
| `src/database/typeorm.config.ts` | Nest TypeORM config from env |
| `src/database/data-source.ts` | TypeORM CLI data source (migrations) |
| `src/database/migrations/` | Versioned schema migrations |
| `Dockerfile` | Build recipe for the API image |
| `docker-compose.yml` | Orchestrates Postgres (+ optional API) |
| `.env` / `.env.example` | Runtime configuration |

Feature modules follow Nest conventions: `module` + `controller` + `service` + `*.entity.ts` + DTOs.

## Run modes

| Mode | How | When |
|------|-----|------|
| Host API | `npm run start:dev` + Compose Postgres (or local DB) | Day-to-day development |
| Full Docker | `docker compose up --build` | Run API + DB as containers |

- Host: `DB_HOST=localhost`
- Compose API service: `DB_HOST=postgres`

## Key decisions

- **Modules** — Isolate features; import each into `AppModule`.
- **Config** — `@nestjs/config` + env files; no hardcoded secrets.
- **Validation** — Global pipe (`whitelist`, `forbidNonWhitelisted`, `transform`).
- **Entities** — `autoLoadEntities: true` so module entities register automatically.
- **Schema** — `synchronize` only when not production; use migrations for prod.
- **Health** — Terminus + DB ping for ops/readiness.
- **Docker split** — Dockerfile packages the API; Compose wires services (especially Postgres).
- **API docs** — Swagger from day one so routes stay discoverable as features land.
