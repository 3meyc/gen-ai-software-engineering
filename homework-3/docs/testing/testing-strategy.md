# Testing Strategy (Documentation)

> Consolidates [`specification.md` §11](../../specification.md#11-verification) and [`agents.md` §8](../../agents.md). Homework is **spec-only**; this defines boundaries for future implementation.

---

## Test layers

| Layer | Scope | Tools (when implemented) |
|-------|--------|---------------------------|
| **Unit** | Pure logic: dedup engine, amount normalization, audit payload validator, export redaction manifest | Vitest/Jest in each service |
| **Integration** | Service + MongoDB; `BankProvider` mocks; BFF guard matrix | `app.request()` or supertest + test DB |
| **E2E-doc** | Scripted scenarios (father confirms, son denied, cat export denied) | Documented steps + fixtures; optional Playwright later |

**Rule:** No test may assert budget/export totals from **pending** preview rows — booked-only per spec §5.

---

## Verification per mid-level objective

| MO | Primary test types | Key assertions | Fixtures |
|----|-------------------|----------------|----------|
| **MO-1** | Integration | Encrypted token storage; sync creates preview, not ledger row | [`household-family.json`](../../mocks/household-family.json) connections |
| **MO-2** | E2E-doc, Integration | Father confirm → ledger count; user confirm → `403` | Mars seed, preview id |
| **MO-3** | Unit, Integration | Level-1/2 dedup; double apply idempotent | [`sample-transactions.json`](../../mocks/sample-transactions.json) |
| **MO-4** | Integration | Admin sees all txns; son subset; cat export `403` | Mars Family |
| **MO-5** | Integration | `bp_2026_06` actuals = booked sum; pending excluded | [`sample-budget-period.json`](../../mocks/sample-budget-period.json) |
| **MO-6** | Integration | CSV columns match manifest; user omits `attributed_user_id` | [`sample-export-manifest.json`](../../mocks/sample-export-manifest.json) |
| **MO-7** | Unit, Manual | Audit rejects token strings; no DELETE on audit; erasure checklist | compliance docs |
| **MO-8** | Integration | Ops audit returns `import.confirmed` chain | Mars household id |

Detail: [`fixtures-guide.md`](fixtures-guide.md). Task mapping: [`../registry/traceability-matrix.md`](../registry/traceability-matrix.md).

---

## Cross-cutting checks

1. **Correlation:** `X-Request-Id` present on BFF → downstream calls in integration tests.
2. **Reconciliation report:** After apply, body includes `created`, `updated`, `duplicate_skipped`.
3. **HTTP catalog:** Edge scenarios match [`../api/errors-and-status-codes.md`](../api/errors-and-status-codes.md).

---

## SLO verification hooks (documentation only)

When implementing, add non-functional smoke checks aligned with [`specification.md` §4](../../specification.md#4-non-functional-and-policy):

| Metric | Hook |
|--------|------|
| BFF read p95 < 300 ms | Load test or APM on `GET .../transactions` |
| Confirm → apply < 5 s (≤ 500 txns) | Timer on confirm E2E-doc |
| Export max 50 000 rows | Job rejection or cap test |
| Pagination | Default 50, max 200 on ledger list |

---

## Per-service hooks

Each [`services/*.md`](../services/) §7 lists service-specific tests. Implement those when executing matching `TASK-*` in spec §13.

---

## Related documents

- [`fixtures-guide.md`](fixtures-guide.md)
- [`../../agents.md`](../../agents.md) §8
- [`../api/errors-and-status-codes.md`](../api/errors-and-status-codes.md)
