# Frontend guide

Living document for the admin UI in [`frontend/`](../frontend/). Update this as the UI evolves.

Related: [FRONTEND-API-CONTEXT.md](./FRONTEND-API-CONTEXT.md) (API contract for clients).

## Purpose

Minimal ops UI for the Mini Operations Wallet Portal assignment. Backend-first: the Nest API is the source of truth; the UI is a thin client for demos and manual testing.

## How to run

Terminal 1 — API (repo root):

```bash
npm run start:dev
```

Terminal 2 — UI:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173  

Vite proxies `/api` → `http://localhost:3000` (see `frontend/vite.config.ts`). Nest also allows CORS from `:5173`.

## Architecture (for backend developers)

```
Browser page
    → hooks/          (loading, error, refetch — like a thin app service)
    → api/            (fetch wrappers — like HTTP/repository)
    → Nest /api/*
```

| Folder | Role |
|--------|------|
| `src/api/` | Typed `fetch` to Nest. No UI. |
| `src/hooks/` | Screen data: call API, hold `loading` / `error` / `data`, expose `reload` / mutations. |
| `src/pages/` | Screens: forms + tables compose hooks. |
| `src/components/` | Shared layout, banners, badges. |
| `src/types/` | TypeScript mirrors of API DTOs. Money fields are **strings**. |

### Pages

| Route | Page | APIs |
|-------|------|------|
| `/` | Dashboard | `GET /reports/overview` |
| `/users` | Users | `GET/POST /users` |
| `/wallets` | Wallets list | `GET/POST /wallets` |
| `/wallets/:id` | Wallet detail + credit/debit + txns | wallet + money endpoints |
| `/reports/daily` | Daily report | `GET /reports/daily-summary?date=` |

### Credit / debit

On submit the UI calls `crypto.randomUUID()` and sends it as `referenceId`. Amounts stay strings like `"10.50"`. Errors from Nest (`409`, insufficient funds, etc.) show in a red banner.

## API added for the dashboard

`GET /api/reports/overview` — all-time totals (wallets, balance sum, credits, debits, txn count). See API context doc.

## Presenting locally

1. Start Postgres + API with `SEED_DATA=true` for demo users/wallets.
2. Open Dashboard → Users → Wallets → open a wallet → credit/debit → Daily report for today’s UTC date.
