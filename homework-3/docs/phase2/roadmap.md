# Phase 2 Roadmap

> **Not MVP.** Excerpt from [`specification.md` §14](../../specification.md#14-phase-2-roadmap). No §13 task may require Phase 2 implementation.

| ID | Capability | Notes |
|----|------------|-------|
| `PH2-FILE` | Bank file upload | Reuse confirm UX; row-hash idempotency |
| `PH2-OCR` | Receipt OCR | Always confirm; image retention per [`data-lifecycle-phase2.md`](../compliance/data-lifecycle-phase2.md) |
| `PH2-CASH` | Manual cash | New `source_kind=manual`; separate validation |
| `PH2-XDEDUP` | Cross-source dedup | User merge/split for receipt vs bank |
| `PH2-PET` | Pet profile / allowance ledger | **Easter egg / joke row** — Barsik (`usr_mars_cat`); not implementable in MVP; see [`../../mocks/household-family.json`](../../mocks/household-family.json) |
| — | PostgreSQL migration | Per-service, REST unchanged |
| — | Event bus | Optional async decoupling post-MVP |

**Scope guard:** MVP tasks and MO acceptance criteria MUST NOT require rows above.

**MVP ingestion only:** `mono`, `otp`, `privat24` — see [`domain/ingestion-sources-matrix.md`](../domain/ingestion-sources-matrix.md).
