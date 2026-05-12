# Homework 1: Build a Simple Banking Transactions API Using AI Assistance

## Collaboration style

When discussing questions, ambiguities, or design choices for this homework:

1. Prefer **numbered lists** so items stay easy to reference and reply to.
2. Use ***Nota bene*** (N.B.) for constraints or assumptions that are easy to skim past but must not be ignored.

## Scope

This homework is fully isolated from other experiments in the repository.

Do NOT:

1. Modify files outside `homework-1`.
2. Introduce shared packages.
3. Refactor repository-wide configs.
4. Change root tooling unless explicitly requested.

## Goal

Build a tiny REST API.

Requirements:

1. Minimal dependencies.
2. Fast iteration.
3. Simple architecture.
4. TypeScript only.
5. No enterprise patterns.

## Tech Stack

1. Node.js (TypeScript + Hono satisfies the “Node” stack requirement for this assignment).
2. TypeScript.
3. Hono.
4. Vitest.
5. tsx.

**N.B.** Do not substitute Python or another runtime for this folder; stay on Node + TypeScript as listed above.

## Architecture Rules

1. Keep everything inside `src/`.
2. Prefer functional style.
3. No DI containers.
4. No ORM initially.
5. No classes unless necessary.
6. No global state.

## API Philosophy

This is intentionally small:

1. Up to 10 endpoints.
2. Simple JSON responses.
3. No auth initially.
4. Use in-memory storage (object); no database abstraction layer unless requested.
5. Return appropriate HTTP status codes (200, 201, 400, 404).
6. Include error handling.

## Domain rules (Task 1 alignment)

**`POST /transactions` — request vs server-generated fields**

Clients send a body shaped like the transaction model. The server **generates** `id` and `timestamp` only (ignore or overwrite client-supplied `id` and `timestamp` if present). **`status` is provided by the client** and must be one of `pending`, `completed`, or `failed`.

Example request body:

```json
{
  "fromAccount": "ACC-1029384756",
  "toAccount": "ACC-5647382910",
  "amount": 250.75,
  "currency": "USD",
  "type": "transfer",
  "status": "pending"
}
```

Example stored / response payload after creation (same shape the list and get-by-id endpoints return):

```json
{
  "id": "txn_9f3c2b7a1d",
  "fromAccount": "ACC-1029384756",
  "toAccount": "ACC-5647382910",
  "amount": 250.75,
  "currency": "USD",
  "type": "transfer",
  "timestamp": "2026-05-12T14:35:22Z",
  "status": "pending"
}
```

**N.B.** `id` and `timestamp` are always server-generated on create. `status` is **not** server-generated; it comes from the POST body (validated against the allowed set).

**Account fields by `type`**

1. `deposit` — use `toAccount` (incoming funds to that account).
2. `withdrawal` — use `fromAccount` (outgoing funds from that account).
3. `transfer` — require both `fromAccount` and `toAccount`.

**`GET /accounts/:accountId/balance`**

1. Consider only transactions with `status === "completed"`.
2. **Deposits** increase balance for `toAccount`; **withdrawals** decrease balance for `fromAccount`; **transfers** move amount from `fromAccount` to `toAccount`.
3. Expose balance **per currency** (multi-currency): aggregate amounts separately for each ISO 4217 `currency` value seen in completed transactions for that account.

## Transaction validation (Task 2)

1. **Accounts** — Must match `ACC-` followed by **one or more** alphanumeric characters (suffix length is not limited to five; longer IDs are fine).
2. **Both account fields** — Validate **`fromAccount` and `toAccount`** against that format on create (not only the field implied by `type`).
3. **Currency** — Accept **any** valid ISO 4217 alphabetic currency code (not a hand-picked short list only). Use an authoritative code list or a maintained library; reject codes that are not valid ISO 4217.
4. **HTTP** — Validation failures return **400** with a clear body (for example the `error` + `details[]` shape in `TASKS.md`).

## Testing

Use:

1. Vitest.
2. Hono native request testing.

Avoid:

1. supertest.
2. Heavy integration frameworks.

## Non-Goals

Do NOT add:

1. NestJS.
2. Express.
3. Redux-like patterns.
4. CQRS.
5. Microservices.
6. Docker orchestration.
7. Kubernetes configs.

## Dependency Philosophy

Prefer:

1. Zero dependencies where practical.
2. Native Node APIs.
3. Lightweight libraries.

## Expected Project Structure

```
src/
  app.ts
  server.ts
  routes/
test/
```

## Important

Treat this homework as disposable experimentation code optimized for learning and speed, not enterprise scalability.
