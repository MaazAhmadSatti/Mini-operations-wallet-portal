# Frontend API context

Guide for clients (Swagger, FE, Postman) calling the Mini Operations Wallet Portal API.

**Base URL:** `http://localhost:3000/api`  
**Swagger:** `http://localhost:3000/api/docs`

Amounts are decimal strings with up to **2** decimal places (e.g. `"100.00"`). Never use JS floats for money math on the client either when displaying authoritative balances—prefer strings from the API.

---

## Critical: `referenceId` (credit / debit)

### What it is

An **idempotency key** you choose and send on every credit and debit. It prevents double-processing when the network retries or the user double-clicks.

### How the FE should generate and track it

1. **Before** calling credit/debit, generate a UUID: `crypto.randomUUID()`.
2. Put it in the JSON body as `referenceId`.
3. If the request times out or fails with a network error, **retry with the same `referenceId`**.
4. For a **new** user action (new top-up or charge), generate a **new** UUID.

**Tracking tips**

- Keep `{ walletId, type, amount, referenceId }` in component state or `sessionStorage` until the API returns success.
- You may use a stable business id (e.g. invoice number) instead of a UUID, as long as it stays unique **per wallet**.

### Duplicate behavior

If the same `(walletId, referenceId)` was already applied → **`409 Conflict`**. Do **not** send a new UUID to “fix” a failed retry of the same op—that can double-charge/credit.

Uniqueness is **per wallet**, not global: the same string may be used on different wallets, but not twice on one wallet.

---

## Pagination (all list endpoints)

Query params:

| Param | Default | Notes |
|-------|---------|-------|
| `page` | `1` | 1-based |
| `limit` | `20` | Max `100` |

Typical list response shape:

```json
{
  "data": [ ... ],
  "meta": { "total": 42, "page": 1, "limit": 20 }
}
```

---

## APIs

### Health / root

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Welcome message |
| `GET` | `/health` | App + DB health |

---

### Users

#### `POST /users`

Create a user.

**Body**

```json
{
  "name": "Alice Admin",
  "phone": "10000000001",
  "email": "alice@example.com",
  "status": "active"
}
```

`status` optional; defaults to `active`. Allowed: `active` | `inactive`.

#### `GET /users`

List users with pagination and free-text search.

| Query | Purpose |
|-------|---------|
| `page`, `limit` | Pagination |
| `search` | Case-insensitive match on name, email, or phone |

Example: `/users?search=alice&page=1&limit=20`

---

### Wallets

#### `GET /wallets`

List wallets (main way to discover `walletId` for credit/debit/transactions).

| Query | Purpose |
|-------|---------|
| `page`, `limit` | Pagination |
| `userId` | Optional — wallets owned by this user |
| `currency` | Optional — e.g. `USD` |
| `status` | Optional — `active` \| `frozen` |

Example: `/wallets?userId=<uuid>`

Typical FE flow: `GET /users` → pick a user → `GET /wallets?userId=...` → use `wallet.id`.

#### `POST /wallets`

Create a wallet for a user. Opening balance is always **`0`**. Use credit (or seeds) to fund it.

**Body**

```json
{
  "userId": "<uuid>",
  "currency": "USD",
  "status": "active"
}
```

`currency` is a string code (e.g. `USD`). `status` optional; `active` | `frozen`.

#### `GET /wallets/:id`

Fetch one wallet (includes current `balance` as a decimal string).

#### `POST /wallets/:id/credit`

Add money to the wallet.

**Body**

```json
{
  "amount": "25.50",
  "referenceId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "description": "Ops top-up"
}
```

- `amount` must be positive.
- `referenceId` **required**.
- Fails if wallet `frozen` or owner `inactive`.

#### `POST /wallets/:id/debit`

Remove money from the wallet.

**Body** — same shape as credit.

- Fails with a clear error if balance would go negative.
- Same status and `referenceId` rules as credit.

#### `GET /wallets/:id/transactions`

Wallet statement (append-only ledger).

| Query | Purpose |
|-------|---------|
| `page`, `limit` | Pagination |
| `type` | `credit` or `debit` |
| `referenceId` | Exact match filter |

Each row includes `balanceBefore`, `balanceAfter`, `amount`, `type`, `referenceId`, `description`, `createdAt`.

---

### Reports

#### `GET /reports/overview`

System-wide **all-time** metrics for the dashboard (no query params).

```json
{
  "totalWallets": 3,
  "totalBalance": "300.00",
  "totalCredits": "50.00",
  "totalDebits": "15.00",
  "transactionCount": 12
}
```

- `totalBalance` — sum of all wallet balances  
- `totalCredits` / `totalDebits` — sum of ledger amounts by type  
- Money fields are decimal strings (2 places)

#### `GET /reports/daily-summary?date=YYYY-MM-DD`

System-wide summary for one **UTC** calendar date.

Example: `/reports/daily-summary?date=2026-07-15`

**Response fields:** `date`, `totalCredits`, `totalDebits`, `transactionCount`, `activeWallets`.

- `activeWallets` = wallets with ≥1 transaction that UTC day.
- If nothing happened that day → **200** with all totals **0** (not 404).
- **No pagination / free-text search** — this returns a single object for one `date`, not a list.

---

## Status rules (important for UI)

| Entity | Values | Effect |
|--------|--------|--------|
| User | `active`, `inactive` | Inactive users cannot credit/debit their wallets |
| Wallet | `active`, `frozen` | Frozen wallets reject credit/debit |

Surface API error messages directly to operators where possible.

---

## Seed data (local)

When the API runs with `SEED_DATA=true`, it seeds **3 users**, each with a **USD** wallet at balance **100**, so you can exercise credit/debit immediately.

Seed IDs/emails are stable so re-runs do not duplicate if rows already exist.

See [DOMAIN-AND-SOLUTION.md](./DOMAIN-AND-SOLUTION.md) for full domain/solution detail.
