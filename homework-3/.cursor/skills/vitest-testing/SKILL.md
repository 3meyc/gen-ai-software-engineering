---
name: vitest-testing
description: >-
  Write Vitest tests for homework-3 platform (NestJS microservices, Angular) per
  specification verification. Use when adding tests, fixing test failures, or
  implementing TASK-* DoD that requires unit/integration coverage.
---

# Vitest Testing (HW3 Platform)

Use when implementing under `homework-3/platform/`. Rule: [`Vitest-Testing-Rules.mdc`](../../rules/Vitest-Testing-Rules.mdc).

**Spec authority:** [`docs/testing/testing-strategy.md`](../../docs/testing/testing-strategy.md), [`agents.md`](../../agents.md) §8, [`specification.md`](../../specification.md) §11.

**Toolchain:** npm workspaces + Vitest only — [`docs/architecture/monorepo-and-tooling.md`](../../docs/architecture/monorepo-and-tooling.md). **HW3 is NestJS, not Hono.**

---

## Test layers

| Layer | When | NestJS pattern |
|-------|------|----------------|
| **Unit** | Dedup engine, redaction, audit validator, pure mappers | Vitest `describe`/`it`; no HTTP |
| **Integration** | Service + Mongo; BFF guards | `Test.createTestingModule` + **supertest** on `app.getHttpServer()` |
| **E2E-doc** | Mars Family flows | Documented steps; optional Playwright later |

**Booked-only:** Tests must not assert budget/export totals from pending preview rows.

---

## HTTP integration (supertest)

```typescript
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

it('viewer export returns 403', async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  await request(app.getHttpServer())
    .post('/api/v1/households/hh_mars_001/exports')
    .set('Authorization', 'Bearer <viewer-jwt>')
    .send({ format: 'csv', date_from: '2026-06-01', date_to: '2026-06-30', status: 'booked' })
    .expect(403);
  await app.close();
});
```

Align status codes with [`docs/api/errors-and-status-codes.md`](../../docs/api/errors-and-status-codes.md) and request bodies with [`docs/api/openapi/`](../../docs/api/openapi/).

---

## Fixtures (required)

| File | Use |
|------|-----|
| [`mocks/household-family.json`](../../mocks/household-family.json) | RBAC seed (`hh_mars_001`) |
| [`mocks/sample-transactions.json`](../../mocks/sample-transactions.json) | Ledger reconcile |
| [`mocks/sample-budget-period.json`](../../mocks/sample-budget-period.json) | MO-5 actuals |
| [`mocks/sample-export-manifest.json`](../../mocks/sample-export-manifest.json) | MO-6 columns |
| [`mocks/bank-payloads/`](../../mocks/bank-payloads/) | Adapter unit tests |

See [`docs/testing/fixtures-guide.md`](../../docs/testing/fixtures-guide.md). Normalize fixture numeric amounts to **strings** when asserting API responses.

---

## MO smoke checks (minimum)

| MO | Assert |
|----|--------|
| MO-1 | Sync creates preview, not ledger row; token encrypted |
| MO-2 | Father confirm OK; son confirm `403` |
| MO-3 | Double apply idempotent |
| MO-4 | Admin household txns; cat export `403` |
| MO-5 | Actuals match booked; pending excluded |
| MO-6 | CSV columns + user redaction |
| MO-7 | Audit rejects token-like payload |
| MO-8 | Ops audit returns `import.confirmed` chain |

---

## Vitest standards

1. Import `describe`, `it`, `expect`, `vi` from `vitest`.
2. No `node:test` / `node:assert` / **Jest**.
3. Run via `npm test` in the workspace package (Vitest config per package).
4. Prefer one behavior per test; name tests by outcome (`viewer export returns 403`).

---

## Related

- Repo-root Hono Vitest skill (`/.cursor/skills/vitest-testing/`) — **not applicable to HW3**; use Nest + supertest patterns above only.
