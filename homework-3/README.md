# Homework 3: Specification-Driven Design — Household Budget Platform

> **Student name:** [Your Name]  
> **Date submitted:** [Date]  
> **AI tools used:** [e.g. Cursor, Claude]

---

## Homework summary

This submission is a **specification package only** (no application code) for a Ukraine-focused **household budget platform**: aggregate bank transactions from Mono, OTP, and Privat24; require **admin/superadmin confirmation** before ledger writes; plan budgets from **booked** transactions; export **CSV** with role-based visibility; maintain immutable audit and UA-aligned privacy controls.

The graded artifact is [`specification.md`](specification.md). Supporting material includes agent guidelines, Cursor rules, architecture and domain docs, service boundaries, and JSON mocks (Mars Family household).

| Deliverable | Path |
|-------------|------|
| Layered product spec | [`specification.md`](specification.md) |
| Agent guidelines | [`agents.md`](agents.md) |
| Cursor rules | [`.cursor/rules/Agent-Output-Rules.mdc`](.cursor/rules/Agent-Output-Rules.mdc), [`.cursor/rules/Stack-Domain-Rules.mdc`](.cursor/rules/Stack-Domain-Rules.mdc) |
| Task description | [`TASKS.md`](TASKS.md) |
| Reference docs | [`docs/`](docs/) |
| Fixtures | [`mocks/`](mocks/) |

---

## Rationale

### Why microservices (seven NestJS services + BFF)

1. **Bounded contexts** map cleanly to regulated concerns: identity, bank ingest, ledger truth, budget, export, audit.
2. **Ledger isolation** — only `SVC-LED` writes canonical transactions, which simplifies dedup guarantees and compliance narrative.
3. **Independent scaling** — sync jobs and CSV workers do not contend with read-heavy BFF paths.
4. **MVP integration simplicity** — REST + scheduled jobs avoid operating an event bus before volume justifies it.

See [`specification.md` §12](specification.md#12-context-beginning--ending) and [`docs/architecture-overview.md`](docs/architecture-overview.md).

### Why MongoDB with one database per service (shared cluster)

1. **Schema flexibility** for provider-specific `metadata` and evolving canonical fields.
2. **Homework-realistic ops** — one cluster, separate DB names (`identity_mvp`, `bank_mvp`, `ledger_mvp`, …) enforces **no cross-service collection writes** without premature distributed SQL complexity.
3. **Clear ownership** — each service’s Mongoose models stay in its DB; ledger remains sole writer of `transactions`.

**PostgreSQL (post-MVP):** Documented as an optional per-service migration with **unchanged REST contracts** when relational reporting or stricter constraints are needed. See [`specification.md` §5](specification.md#5-implementation-notes).

### MVP scope choices

| In MVP | Deferred (Phase 2) |
|--------|-------------------|
| Mono / OTP / Privat24 via `BankProvider` | File upload (`PH2-FILE`) |
| Confirm-before-ledger import | Receipt OCR (`PH2-OCR`, always confirm when built) |
| Booked-only budget + CSV export | Manual cash (`PH2-CASH`) |
| Within-bank dedup | Cross-source dedup receipt vs bank (`PH2-XDEDUP`) |

Boundary sentence: [`specification.md` §1](specification.md#1-high-level-objective). IDs: [`docs/scope-and-traceability.md`](docs/scope-and-traceability.md).

### Performance and SLO targets (assumed)

Targets in [`specification.md` §4](specification.md#4-non-functional-and-policy) are **hypothetical but reasoned** for household-scale FinTech:

- **BFF read p95 &lt; 300 ms** — dashboard responsiveness.
- **Confirm → ledger apply &lt; 5 s** (≤ 500 txns) — admin can wait briefly; larger batches async.
- **Export cap 50 000 rows** — protects workers; bank fetch paginated separately.
- **Cursor pagination (50 default, 200 max)** — predictable memory and API cost.

Verification that implementations respect these is in [`specification.md` §11](specification.md#11-verification).

---

## Industry best practices (where they appear)

| Practice | Why it matters | Primary references |
|----------|----------------|-------------------|
| **Confirm before ingest** | Prevents unreviewed bank data from affecting household truth | [`specification.md` §2 `MO-2`](specification.md#2-mid-level-objectives), [`docs/ingestion-sources-matrix.md`](docs/ingestion-sources-matrix.md), [`docs/household-rbac.md`](docs/household-rbac.md) |
| **Idempotent import / dedup** | Safe re-sync and overlapping date windows | [`specification.md` §8](specification.md#8-canonical-model-and-dedup), [`docs/deduplication-reconciliation-specification.md`](docs/deduplication-reconciliation-specification.md), [`docs/canonical-banking-transaction-model.md`](docs/canonical-banking-transaction-model.md) |
| **Booked-only budget and export** | Pending bank rows are not financial truth | [`specification.md` §5](specification.md#5-implementation-notes), [`docs/services/ledger.md`](docs/services/ledger.md), [`docs/services/budget.md`](docs/services/budget.md) |
| **Immutable audit trail** | Regulated environments need non-repudiation | [`specification.md` §4](specification.md#4-non-functional-and-policy), [`docs/services/audit.md`](docs/services/audit.md), [`docs/compliance-ukraine.md`](docs/compliance-ukraine.md) |
| **UA personal data minimization & erasure** | Ukraine jurisdiction; processor not bank | [`specification.md` §4](specification.md#4-non-functional-and-policy), [`docs/compliance-ukraine.md`](docs/compliance-ukraine.md), [`docs/data-lifecycle.md`](docs/data-lifecycle.md) |
| **RBAC and least privilege** | Viewer cannot export; user cannot confirm import | [`specification.md` §9](specification.md#9-household-rbac), [`mocks/household-family.json`](mocks/household-family.json) |
| **Service boundary: ledger sole writer** | Single source of truth for transactions | [`specification.md` §5](specification.md#5-implementation-notes), [`agents.md` §4](agents.md#4-service-boundaries-non-negotiable) |
| **Secrets never in logs** | FinTech baseline | [`agents.md` §5](agents.md#5-fintech-and-security-rules), [`.cursor/rules/Stack-Domain-Rules.mdc`](.cursor/rules/Stack-Domain-Rules.mdc) |

**Edge cases** (token revoke mid-import, viewer export denied, export during sync, etc.): [`specification.md` §10](specification.md#10-edge-cases-and-failure-modes).

**Executable decomposition:** 38 low-level tasks in [`specification.md` §13](specification.md#13-low-level-tasks), traced to `MO-*` in [`docs/scope-and-traceability.md`](docs/scope-and-traceability.md).

---

## Package layout

```text
homework-3/
  README.md                 # this file
  TASKS.md                  # assignment brief
  specification.md          # graded layered spec
  agents.md                 # AI agent guidelines
  .cursor/rules/            # Cursor agent rules
  docs/
    scope-and-traceability.md
    architecture-overview.md
    canonical-banking-transaction-model.md
    deduplication-reconciliation-specification.md
    data-lifecycle.md
    ingestion-sources-matrix.md
    bank-provider-adapter.md
    household-rbac.md
    compliance-ukraine.md
    services/               # per-service beginning/ending context
  mocks/
    household-family.json   # Mars Family RBAC fixture
    sample-transactions.json
    sample-budget-period.json
    sample-export-manifest.json
```

---

## Demo household (Mars Family)

| Member | Role | Notes |
|--------|------|-------|
| Elena (mother) | superadmin | Erasure, ops audit |
| Oleksandr (father) | admin | Confirm import, household budget |
| Maksym, Sofia | user | Per-user scope |
| Barsik (cat), Ihor, Oksana | viewer | Cat = non-human RBAC edge test; no export |

Fixture: [`mocks/household-family.json`](mocks/household-family.json).

---

## How to read or implement with an AI agent

1. Start with [`specification.md`](specification.md) (sections §1–§14).
2. Follow [`agents.md`](agents.md) and Cursor rules under `.cursor/rules/`.
3. Drill into `docs/` for canonical model, dedup, lifecycle, and per-service REST/index detail.
4. Use `mocks/` as test fixtures; do not invent conflicting field names or roles (`superadmin`, `admin`, `user`, `viewer`; `source_system`: `mono`, `otp`, `privat24`).

---

<div align="center">

*Homework 3 — GenAI and Agentic AI for Software Engineering. Specification depth, traceability, and rationale are the graded focus.*

</div>
