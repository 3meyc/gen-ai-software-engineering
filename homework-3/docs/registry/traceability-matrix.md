# Traceability Matrix

> **Authority:** Task counts and MO mapping — this document. Full task list — [`specification.md` §13](../../specification.md#13-low-level-tasks). ID registry — [`scope-and-traceability.md`](scope-and-traceability.md).

Audit requirement: each `MO-*` has **≥ 2** tasks in §13 and **≥ 1** verification row in §11.

---

## MO → tasks (Appendix A)

| MO | §13 tasks (count) | §11 verification | Primary `TASK-*` prefixes |
|----|-------------------|------------------|---------------------------|
| MO-1 | 7 | Yes | `TASK-BANK-001`…`005`, `008`; `TASK-BFF-003` |
| MO-2 | 6 | Yes | `TASK-BFF-004`, `TASK-BANK-006`…`007`, `008`; `TASK-LED-003`; `TASK-WEB-002` |
| MO-3 | 10 | Yes | `TASK-LED-001`…`005`; `TASK-BANK-002`, `007`; `TASK-BFF-005`; `TASK-BUD-002`; `TASK-EXP-002` |
| MO-4 | 13 | Yes | `TASK-BFF-001`…`006`; `TASK-ID-001`…`004`; `TASK-LED-004`; `TASK-BUD-003`; `TASK-EXP-003`; `TASK-WEB-001` |
| MO-5 | 6 | Yes | `TASK-BUD-001`…`003`; `TASK-BFF-006`; `TASK-WEB-003` |
| MO-6 | 5 | Yes | `TASK-EXP-001`…`004`; `TASK-BFF-006` |
| MO-7 | 5 | Yes | `TASK-AUD-001`, `003`; `TASK-ID-005`; `TASK-BANK-004`; `TASK-EXP-004` |
| MO-8 | 3 | Yes | `TASK-BFF-007`; `TASK-AUD-002`, `003` |

**Total:** 38 low-level tasks in §13.

---

## MO → services and docs

| MO | Primary services | Supporting docs | Task prefix examples |
|----|------------------|-----------------|----------------------|
| MO-1 | `SVC-BANK`, `SVC-BFF` | `domain/bank-provider-adapter.md`, `domain/ingestion-sources-matrix.md` | `TASK-BANK-*`, `TASK-BFF-*` |
| MO-2 | `SVC-BANK`, `SVC-BFF` | `domain/household-rbac.md` | `TASK-BANK-*`, `TASK-BFF-*` |
| MO-3 | `SVC-LED`, `SVC-BANK` | `domain/canonical-banking-transaction-model.md`, `domain/deduplication-reconciliation-specification.md` | `TASK-LED-*` |
| MO-4 | `SVC-ID`, `SVC-BFF` | `domain/household-rbac.md`, `mocks/household-family.json` | `TASK-ID-*`, `TASK-BFF-*` |
| MO-5 | `SVC-BUD`, `SVC-LED` | `mocks/sample-budget-period.json` | `TASK-BUD-*` |
| MO-6 | `SVC-EXP`, `SVC-LED` | `mocks/sample-export-manifest.json` | `TASK-EXP-*` |
| MO-7 | `SVC-AUD`, all writers | `compliance/compliance-ukraine.md`, `compliance/data-lifecycle-mvp.md` | `TASK-AUD-*`, cross-cutting |
| MO-8 | `SVC-AUD`, `SVC-EXP`, `SVC-BFF` | `compliance/compliance-ukraine.md` | `TASK-AUD-*`, `TASK-EXP-*` |

---

## Grader alignment ([TASKS.md](../../TASKS.md))

| TASKS cross-cutting | Covered by |
|---------------------|------------|
| Edge cases / failure modes | spec §10 + [`api/errors-and-status-codes.md`](../api/errors-and-status-codes.md) |
| Verification | spec §11 + [`testing/testing-strategy.md`](../testing/testing-strategy.md) |
| Performance / SLOs | spec §4 (canonical SLO table) |
| 15–30+ low-level tasks | spec §13 (38 tasks) |
| FinTech / regulated | MO-7, MO-8, spec §4–5 |

---

## Related documents

- [`scope-and-traceability.md`](scope-and-traceability.md)
- [`../../specification.md`](../../specification.md) Appendix A, Appendix B
