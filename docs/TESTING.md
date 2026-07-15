# Testing

## Automated unit tests

```bash
npm test
```

Key cases in [`src/wallets/wallets.service.spec.ts`](../src/wallets/wallets.service.spec.ts):

| Test | What it proves |
|------|----------------|
| Credit | Balance increases; `balanceBefore` / `balanceAfter` recorded |
| Debit | Balance decreases when funds allow |
| Duplicate `referenceId` | Second call → `ConflictException` with clear message |
| Insufficient funds | Debit rejected with meaningful error |
| Frozen wallet | Credit/debit → `ForbiddenException` |
| Inactive user | Credit/debit → `ForbiddenException` |
| Concurrent debits (simulated) | Two overlapping `60` debits from `100` → one success, one reject; final balance `40.00` |

Failed API operations return Nest HTTP exceptions with explicit messages (validation, not found, insufficient funds, frozen/inactive, duplicate reference).

## Integration / e2e tests

```bash
docker compose up postgres -d
npm run test:e2e
```

Uses real Nest + TypeORM + Postgres (from `.env`). Cases in [`test/wallets.e2e-spec.ts`](../test/wallets.e2e-spec.ts):

| Test | What it proves |
|------|----------------|
| HTTP credit | `POST .../credit` → 201, balance updated |
| HTTP debit | `POST .../debit` → 201 |
| Duplicate `referenceId` | Second call → **409** + clear message |
| Overdraft | → **400** Insufficient funds |
| Concurrent HTTP debits | Two parallel 60 debits on a funded wallet → one 201, one 400; final balance `40.00` (real `FOR UPDATE`) |

Also: [`test/app.e2e-spec.ts`](../test/app.e2e-spec.ts) smoke-tests `GET /api`.

## Concurrency / idempotency

**Idempotency:** Client `referenceId`; unique `(walletId, referenceId)`; duplicate → **409**.

**Concurrency:** DB transaction + wallet `SELECT … FOR UPDATE`. Covered in unit (simulated lock) and e2e (two real HTTP clients + Postgres).

## Frontend manual checklist

See [README.md](../README.md#frontend-manual-checklist).

## Bonus: why add integration / e2e?

| | Unit | Integration / e2e |
|--|------|-------------------|
| Speed / CI | Fast, no DB | Needs Postgres |
| HTTP + ValidationPipe | Not covered | Covered |
| Real row locks / SQL | Simulated | Proven against Postgres |
| Flakiness | Low | Higher (env, timing) |

**We added a small e2e suite** for credit/debit/duplicate/overdraft/concurrent debits because the assignment marks this as bonus and it raises confidence that Nest + Postgres locking work end-to-end.

**Still optional for CI:** keep `npm test` as the default gate; run `npm run test:e2e` when Postgres is up (local or CI service container).
