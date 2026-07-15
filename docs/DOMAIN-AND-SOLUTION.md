# Domain and Solution

Domain model and technical solution for the Mini Operations Wallet Portal API.

## 1. Domain

### Product

Backend operations wallet API used as a **system-admin** surface (no auth yet). Manages users, wallets, credits/debits, an append-only ledger, and a system-wide daily summary. No UI. No wallet-to-wallet transfer endpoints.

### Objects

| Object | Meaning |
|--------|---------|
| **User** | Account holder: `id`, `name`, `phone`, `email`, `status` (`active` \| `inactive`), timestamps |
| **Wallet** | Ledger account for one user and one currency; holds `balance` (never negative); `status` (`active` \| `frozen`) |
| **Credit** | Money **into** a wallet → increases balance and writes a transaction |
| **Debit** | Money **out** of a wallet → decreases balance if funds allow and writes a transaction |
| **Transaction** | Append-only ledger row: `type`, `amount`, `balanceBefore`, `balanceAfter`, `referenceId`, `description`, `createdAt` |
| **DailySummary** | One row per UTC calendar date (system-wide): `totalCredits`, `totalDebits`, `transactionCount`, `activeWallets` |

- A user may own **multiple wallets**.
- **`activeWallets`:** count of wallets with **at least one transaction** on that UTC date.

### APIs

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/users` | Create user |
| `GET` | `/users` | List users (pagination + `search`) |
| `POST` | `/wallets` | Create wallet (opening balance `0`) |
| `GET` | `/wallets` | List wallets (pagination; optional `userId`, `currency`, `status`) |
| `GET` | `/wallets/:id` | Get wallet |
| `POST` | `/wallets/:id/credit` | Credit wallet |
| `POST` | `/wallets/:id/debit` | Debit wallet |
| `GET` | `/wallets/:id/transactions` | List wallet ledger |
| `GET` | `/reports/daily-summary` | System-wide daily summary (single date; no pagination) |

Credit/debit are blocked when the user is `inactive` or the wallet is `frozen`.

---

## 2. Solution decisions

| Topic | Decision |
|-------|----------|
| Money storage | Postgres `numeric(19,2)`; app uses decimal-safe arithmetic (never JS `number` floats) |
| Idempotency | Client **must** send `referenceId`; duplicate for same wallet → **409 Conflict** |
| Uniqueness | **Per wallet:** unique `(wallet_id, reference_id)` |
| Concurrency | DB transaction + **pessimistic lock** (`SELECT … FOR UPDATE`) on the wallet row |
| Ledger | Append-only transaction rows only (no transfers) |
| Daily summary | Persisted `DailySummary` table; upserted on each successful credit/debit |
| Day boundary | **UTC** date derived from transaction time |
| Empty day | `GET` returns **200 with zeros** if no row exists for that date |
| Seeds | `SEED_DATA=true` gates seeding of **3 users** each with a **USD** wallet at balance **100** |
| Pagination | `page` default 1, `limit` default 20, max 100 |
| Search | Users: `search` on name/email/phone; Wallets: `userId` / `currency` / `status`; Transactions: `type`, `referenceId`; Daily summary: `date` only (single resource) |
| Structure | Thin controllers; `WalletsService` owns credit/debit + locking + ledger + summary upsert |

### Credit / debit flow

1. Begin DB transaction  
2. Lock wallet row (`FOR UPDATE`)  
3. Validate wallet/user status and funds (debit)  
4. If `referenceId` already exists for this wallet → **409**  
5. Compute `balanceBefore` / `balanceAfter`  
6. Update wallet balance  
7. Insert transaction  
8. Upsert `DailySummary` for UTC date  
9. Commit  

### Module layout

```
src/
  users/
  wallets/           # credit/debit live here
  transactions/      # entity + list by wallet
  reports/           # DailySummary
  common/            # pagination DTOs, money helpers
  database/          # TypeORM config, seeds (SEED_DATA)
```

### Known limitations

- No authentication/authorization yet (implicit system admin).
- No transfer endpoint.
- Daily summaries use UTC days only.
- Schema `synchronize` is for non-production; use migrations in production.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md), [FRONTEND-API-CONTEXT.md](./FRONTEND-API-CONTEXT.md).
