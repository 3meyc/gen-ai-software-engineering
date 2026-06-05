# Platform (Implementation Root)

> **Not required for Homework 3 grading.** This folder is reserved for NestJS + Angular code when you choose to implement [`specification.md` §13](../specification.md#13-low-level-tasks).

---

## Layout (when scaffolded)

```text
platform/
  package.json              # npm workspaces root
  apps/
    web/
    gateway-bff/
  services/
    identity-household/
    bank-connector/
    ledger/
    budget/
    export/
    audit/
```

Specifications, mocks, and agent rules stay in parent `homework-3/` — **do not** move `specification.md` or `docs/` here.

---

## Before coding

1. [`agents.md` §3](../agents.md#3-monorepo-layout-hypothetical) — layout and ports  
2. [`docs/architecture/monorepo-and-tooling.md`](../docs/architecture/monorepo-and-tooling.md) — npm + Vitest + supertest  
3. [`docs/api/openapi/`](../docs/api/openapi/) — HTTP JSON contracts  
4. [`docs/services/`](../docs/services/) §9 — Mongoose persistence per service  
5. [`docs/testing/testing-strategy.md`](../docs/testing/testing-strategy.md) — verification per `MO-*`

See [`agents.md` §3](../agents.md#3-monorepo-layout-hypothetical).
