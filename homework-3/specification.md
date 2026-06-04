# Household Budget Platform — Product Specification (MVP)

> Ingest this specification, implement the low-level tasks, and satisfy the high- and mid-level objectives. Supporting depth lives in [`docs/`](docs/) and [`mocks/`](mocks/); this document is **self-contained enough to grade** without opening every reference file.

**IDs:** `MO-1`…`MO-8` (objectives), `SVC-*` (services), `PH2-*` (Phase 2 only), `TASK-{SVC}-{nnn}` (implementation slices). Registry: [`docs/registry/scope-and-traceability.md`](docs/registry/scope-and-traceability.md).

### Contents (grader skim)

| § | Section |
|---|---------|
| [1](#1-high-level-objective) | High-level objective |
| [2](#2-mid-level-objectives) | Mid-level objectives (`MO-1`…`MO-8`) |
| [3](#3-stakeholders) | Stakeholders |
| [4](#4-non-functional-and-policy) | Non-functional, SLOs, audit |
| [5](#5-implementation-notes) | Stack, DB names, booked-only |
| [6](#6-ingestion-sources) | MVP banks + deferred `PH2-*` |
| [7](#7-bankprovider) | BankProvider port |
| [8](#8-canonical-model-and-dedup) | Canonical model and dedup |
| [9](#9-household-rbac) | RBAC + Mars Family |
| [10](#10-edge-cases-and-failure-modes) | Edge cases |
| [11](#11-verification) | Verification per `MO-*` |
| [12](#12-context-beginning--ending) | Context beginning / ending |
| [13](#13-low-level-tasks) | **38** low-level tasks |
| [14](#14-phase-2-roadmap) | Phase 2 roadmap |
| [A](#appendix-a--traceability-audit-phase-7) | Traceability audit |
| [B](#appendix-b--mars--locked-decisions-checklist) | Mars / locked decisions |

**Locked MVP decisions (in-body):** admin/superadmin **confirm import**; **CSV-only** export; **booked-only** budget/export; cluster DBs `identity_mvp` … `audit_mvp`; demo household **`hh_mars_001`** (Mars Family).

---

## 1. High-level objective

Household members in Ukraine see a **single, trustworthy view of booked bank spending** per household: connect Mono, OTP, or Privat24 through one abstraction; **confirm imports** before they affect the ledger; plan budgets from **booked** transactions only; export household data as **CSV**—with role-appropriate visibility, immutable audit, and UA-aligned privacy controls.

**MVP boundary:** MVP delivers **bank API ingest → admin/superadmin confirm → deduplicated ledger → role-scoped budget → CSV export** on NestJS + Angular + MongoDB (one database per service on a shared cluster). **No** file upload, receipt OCR, manual cash, event bus, or non-CSV export in MVP.

---

## 2. Mid-level objectives

| ID | Title | Observable outcome (MVP) |
|----|--------|---------------------------|
| **MO-1** | Bank connection and sync | Admin/superadmin connects Mono, OTP, or Privat24 via `BankProvider`; accounts list; incremental sync runs on schedule with checkpoint; tokens stored per lifecycle doc; disconnect/revoke supported. |
| **MO-2** | Import preview and confirmation | Pending transactions appear in preview; **admin** or **superadmin** confirms import; unconfirmed data never affects budget; superadmin actions audited with `actor_role=superadmin`. |
| **MO-3** | Idempotent ledger and dedup | Confirmed imports write to ledger once; duplicate provider/overlap cases follow dedup rules; budget and export read **booked** canonical rows only. |
| **MO-4** | Household RBAC and visibility | Roles enforced on every BFF-proxied action; admins see household-wide data; users/viewers see per-user scope; viewer cannot export or connect banks. |
| **MO-5** | Budget from booked spend | Categories, periods, limits; actuals from booked ledger only; rollup respects MO-4 visibility. |
| **MO-6** | CSV export and download | Authorized roles request async CSV; manifest columns and PII redaction per role; download audited. |
| **MO-7** | Immutable audit and UA compliance | Security-sensitive actions append to audit service; UA personal data minimization and erasure paths; no tokens/PAN in logs. |
| **MO-8** | Ops / compliance read-only views | Superadmin or ops role queries audit and export history without mutating household data. |

---

## 3. Stakeholders

| Stakeholder | Needs | Spec touchpoints |
|-------------|-------|------------------|
| **Household end-users** | Connect banks (admins), review spending, set budgets, export own data | MO-1–MO-6, §9 RBAC, mock [Mars Family](mocks/household-family.json) |
| **Household admin** (e.g. father) | Confirm imports, household-wide budget, full CSV | MO-2, MO-5, MO-6 |
| **Household superadmin** (e.g. mother) | Member management, erasure, platform ops audit | MO-4, MO-7, MO-8 |
| **Internal ops / compliance** | Read-only audit trail, export job history, erasure evidence | MO-7, MO-8, [`docs/compliance/compliance-ukraine.md`](docs/compliance/compliance-ukraine.md) |
| **Support** (optional) | Manual re-auth guidance when bank tokens expire | §10 edge cases |

---

## 4. Non-functional and policy

### Security and privacy

- JWT authentication via `SVC-ID`; RBAC enforced at `SVC-BFF` and originating services.
- Bank tokens encrypted at rest; never logged. Masked PAN only in storage and CSV where allowed.
- Ukraine personal data: minimization, erasure orchestration, purpose limitation — see [`docs/compliance/compliance-ukraine.md`](docs/compliance/compliance-ukraine.md).
- **Booked-only** for budget actuals and export default (`status=booked`).

### Audit

- Append-only `audit_mvp.audit_events`; **7-year** retention (assumed).
- Writers: `SVC-BANK`, `SVC-LED`, `SVC-BUD`, `SVC-EXP`, `SVC-ID`. No secrets in `payload`.

### Assumed SLO targets (MVP)

> Numbers are **assumed targets** for a household-scale FinTech MVP (not load-tested in homework).

| Metric | Target | Rationale |
|--------|--------|-----------|
| BFF read p95 | **< 300 ms** | Snappy dashboard; excludes large CSV download stream |
| BFF write p95 (confirm, export create) | **< 800 ms** | User waits for acknowledgment; heavy work async |
| Confirm → ledger apply (≤ 500 txns) | **< 5 s** | Acceptable admin wait; progress UI if async |
| Bank sync job per account p95 | **< 60 s** | Provider-dependent; backoff on `429` |
| Export max rows per job | **50 000** | Protect worker memory; paginate provider fetch separately |
| Ledger list default page | **50** rows; max **200** | Standard cursor pagination |
| Import preview retention (unconfirmed) | **90 days** | Purge job daily |
| Erasure: token revoke | **Immediate** | Security |
| Erasure: PII delete in service DBs | **≤ 30 days** | UA-aligned assumption |
| Erasure request acknowledgment | **≤ 24 h** business | Compliance SLA |

### Reliability

- Idempotent import apply on same `previewId`.
- Scheduled bank sync every **15 min** per active connection (no event bus).
- Service-to-service calls use correlation id `X-Request-Id`.

---

## 5. Implementation notes

| Topic | Rule |
|-------|------|
| **Stack** | Angular (strict), NestJS microservices, Mongoose, **REST** only between services |
| **Monorepo layout** | `apps/web` (Angular), `apps/gateway-bff`, `services/{identity-household,bank-connector,ledger,budget,export,audit}` |
| **Money** | `decimal(18,2)` or string decimal in TS; **never** `number` for money math |
| **Currency** | Default **UAH** (ISO 4217); store `currency` on every txn |
| **Amount + direction** | Signed `amount` must agree with `direction` (positive=credit, negative=debit); reject mismatches in preview — see §8 |
| **Idempotency** | Primary key `(source_system, source_transaction_id)`; fallback fingerprint per dedup doc |
| **Booked-only** | `SVC-BUD` and `SVC-EXP` query ledger with `status=booked`; pending preview rows stay in `bank_mvp` only |
| **Data ownership** | One MongoDB **database per service** on shared cluster; **no cross-service collection writes** |
| **Ledger invariant** | Only `SVC-LED` writes `ledger_mvp.transactions` |
| **DB names** | `identity_mvp`, `bank_mvp`, `ledger_mvp`, `budget_mvp`, `export_mvp`, `audit_mvp` |
| **Post-MVP** | Each service may migrate to **PostgreSQL** independently; REST contracts unchanged |
| **Integration** | REST + cron jobs; internal routes `/internal/v1` with service token or mTLS |
| **Logging** | No access tokens, refresh tokens, full account numbers, or full CSV rows in logs |

---

## 6. Ingestion sources

### MVP (implemented)

| Source ID | Source | Trust | Confirmation | Owner |
|-----------|--------|-------|--------------|-------|
| `mono` | Mono Bank API | High | Admin/superadmin confirm batch | `SVC-BANK` |
| `otp` | OTP Bank API | High | Same | `SVC-BANK` |
| `privat24` | Privat24 API | High | Same | `SVC-BANK` |

**Pipeline:** `BankProvider.fetchTransactions` → normalize to preview → admin/superadmin confirm (`MO-2`) → `SVC-LED` reconcile/upsert (`MO-3`) → audit (`MO-7`).

### Phase 2 (deferred — not in MVP task DoD)

| ID | Source | Notes |
|----|--------|-------|
| `PH2-FILE` | Bank export file | Always confirm; row fingerprint idempotency |
| `PH2-OCR` | Receipt OCR | **Always confirm** (policy locked) |
| `PH2-CASH` | Manual cash | Separate trust model |
| `PH2-XDEDUP` | Cross-source dedup | Receipt vs bank **out of MVP** |

Full matrix: [`docs/domain/ingestion-sources-matrix.md`](docs/domain/ingestion-sources-matrix.md).

---

## 7. BankProvider

Abstract port implemented in `SVC-BANK` for Mono, OTP, Privat24:

| Method | Purpose |
|--------|---------|
| `authenticate` / `completeAuthentication` | OAuth flow |
| `listAccounts` | Accounts/cards after connect |
| `fetchTransactions` | Incremental fetch with checkpoint |
| `getCheckpoint` / `revoke` | Watermark and disconnect |

**Per-bank highlights:**

| Aspect | Mono | OTP | Privat24 |
|--------|------|-----|----------|
| Txn ID field | `id` | `transactionId` | `ref` / `paymentRef` |
| Amount | Signed string | Absolute + `debitCredit` → normalize | Signed `amount` |
| Pagination | Cursor | offset/limit | `continue` token |
| Typical failures | `401`, `429` | `403` consent revoked | `400` date range |

No adapter writes to `ledger_mvp`. Detail: [`docs/domain/bank-provider-adapter.md`](docs/domain/bank-provider-adapter.md).

---

## 8. Canonical model and dedup

### Canonical model (summary)

- **Entities:** Transaction, Account, Import metadata.
- **MVP `source_system`:** `mono`, `otp`, `privat24`.
- **MVP `source_kind`:** `bank_api` only on ledger writes.
- **Statuses:** `pending`, `booked`, `reversed`, `failed` — budget/export use **`booked`** only.
- **Amount rule:** signed `amount` + matching `direction`; quarantine rows that disagree after normalization.

Full schema: [`docs/domain/canonical-banking-transaction-model.md`](docs/domain/canonical-banking-transaction-model.md).  
Fixtures: [`mocks/sample-transactions.json`](mocks/sample-transactions.json).

### Deduplication (summary)

| Level | Match | Action |
|-------|-------|--------|
| 1 | `(source_system, source_transaction_id)` | Update existing |
| 2 | Deterministic fingerprint (account, time, amount, currency, …) | Treat as duplicate |
| 3 | Fuzzy | Review queue (rare for bank API in MVP) |

**MVP scope:** Within-bank only; **no** `PH2-XDEDUP` receipt-vs-bank merge.

Full rules: [`docs/domain/deduplication-reconciliation-specification.md`](docs/domain/deduplication-reconciliation-specification.md).

---

## 9. Household RBAC

### Roles

| Role | Scope |
|------|-------|
| **superadmin** | Full household + erasure + ops audit (with platform flag) |
| **admin** | Connect bank, **confirm import**, household-wide budget/txns, CSV |
| **user** | Own linked txns/budget; CSV own scope; **cannot** confirm import |
| **viewer** | Read-only scoped view; **no** bank connect, confirm, or export |

### Mock household: Mars Family (`hh_mars_001`)

| Member | `user_id` (fixture) | Role |
|--------|---------------------|------|
| Elena (mother) | `usr_mars_mother` | superadmin |
| Oleksandr (father) | `usr_mars_father` | admin — **can confirm import** |
| Maksym, Sofia (son, daughter) | `usr_mars_son`, `usr_mars_daughter` | user |
| Barsik (cat) | `usr_mars_cat` | viewer — demo profile; **no export** |
| Ihor (uncle), Oksana (niece) | `usr_mars_uncle`, `usr_mars_niece` | viewer |

Fixture: [`mocks/household-family.json`](mocks/household-family.json) (`household_id`: **`hh_mars_001`**). Son/daughter are **user** (not viewer) to test per-user scope. Active bank connections in fixture: father's Mono, mother's OTP.

### Permission matrix (abbreviated)

| Action | superadmin | admin | user | viewer |
|--------|:----------:|:-----:|:----:|:------:|
| Connect / sync bank | ✓ | ✓ | — | — |
| Confirm import | ✓ | ✓ | — | — |
| View transactions | household | household | own | scoped read |
| Budget actuals | household | household | own slice | read-only slice |
| CSV export | ✓ | ✓ | own scope | **denied** |
| Ops audit read | ✓ | — | — | — |

Full matrix: [`docs/domain/household-rbac.md`](docs/domain/household-rbac.md).

---

## 10. Edge cases and failure modes

| Scenario | Expected behavior | Audit / compliance |
|----------|-------------------|-------------------|
| Token revoked **mid-import** | Preview marked `aborted`; no ledger apply; user prompted to re-connect | `token.revoked`, `import.aborted` |
| Duplicate overlap on re-sync | Level-1 update or `duplicate.skipped` in apply summary | `duplicate.skipped` |
| User attempts confirm import | BFF `403`; service not called | — |
| **Cat (viewer)** calls export API | BFF `403` | `export.denied` |
| Admin confirms while sync still running | Allowed; confirm pins **preview version** at confirm time | `import.confirmed` |
| Empty budget month (no booked txns) | Actuals `0`; UI shows empty state | — |
| Export requested during active sync | Export uses **snapshot timestamp** at job creation; consistent booked set | `export.requested` |
| Bank `429` rate limit | Sync job retries with exponential backoff; preview flag `delayed` | — |
| Sign/direction mismatch in mapping | Row quarantined in preview; not confirmable until fixed | — |
| Uncle views daughter's transactions | Denied (no shared account in mock) | — |
| Double confirm same `previewId` | Idempotent apply; no duplicate ledger rows | `import.confirmed` (idempotent) |
| Superadmin confirms when father absent | Allowed; audited `actor_role=superadmin` | `import.confirmed` |
| Pending txn in preview | Excluded from budget actuals and export | — |
| Erasure in progress | New sync blocked; tokens revoked immediately | `erasure.requested` |

---

## 11. Verification

Verification is **documented** (no code required for homework). Each `MO-*` maps to test categories and fixtures.

| MO | Verification approach |
|----|----------------------|
| **MO-1** | Integration: mock `BankProvider` + OAuth callback; assert encrypted token storage; sync creates preview. Fixture: connections in [`mocks/household-family.json`](mocks/household-family.json). |
| **MO-2** | E2E-doc: father confirms preview → ledger row count matches; son confirm → `403`. |
| **MO-3** | Unit: reconciliation engine Level-1/2; integration: double apply idempotent; reconcile counts vs [`mocks/sample-transactions.json`](mocks/sample-transactions.json). |
| **MO-4** | Integration per role: admin sees all txns; son sees subset; cat export `403`. Seed: Mars Family. |
| **MO-5** | Integration: `bp_2026_06` actuals match booked sum in [`mocks/sample-budget-period.json`](mocks/sample-budget-period.json); pending excluded. |
| **MO-6** | Integration: CSV columns match [`mocks/sample-export-manifest.json`](mocks/sample-export-manifest.json); user redaction omits `attributed_user_id`. |
| **MO-7** | Unit: audit payload validator rejects tokens; append-only API has no DELETE; compliance checklist in [`docs/compliance/compliance-ukraine.md`](docs/compliance/compliance-ukraine.md). |
| **MO-8** | Integration: ops `GET /ops/audit/events` returns `import.confirmed` chain for household. |

**Cross-cutting:** Correlation id on BFF → downstream; reconciliation report after each apply (`created`, `updated`, `duplicate_skipped`).

**Manual compliance review (MO-7):** Confirm erasure SLA steps documented; export manifest PII flags; 7-year audit retention stated.

---

## 12. Context beginning / ending

### Platform beginning

```text
homework-3/                    # specs + mocks only (this homework)
  docs/                        # reference architecture
  mocks/                       # Mars Family + sample data
  specification.md             # this file
  platform/                    # optional; empty until implementation requested
```

**Implementation location:** Application code belongs under `homework-3/platform/` (not repo root, not `homework-1/` or `homework-2/`). See [`agents.md` §3](agents.md#3-monorepo-layout-hypothetical).

Hypothetical implementation repo **before** tasks:

```text
homework-3/platform/apps/web/           # Angular shell, empty routes
homework-3/platform/apps/gateway-bff/  # Nest bootstrap, GET /health only
homework-3/platform/services/         # six empty Nest services, no Mongoose schemas
```

No MongoDB data; no JWT issuer; no bank adapters.

### Platform ending (after all tasks)

```text
homework-3/platform/apps/web/              # routes: dashboard, banks, import preview, budget, export
homework-3/platform/apps/gateway-bff/    # full /api/v1 proxy + RBAC guards
homework-3/platform/services/identity-household/   # identity_mvp + Mars seed
homework-3/platform/services/bank-connector/         # bank_mvp + Mono/OTP/Privat24 adapters + sync cron
homework-3/platform/services/ledger/               # ledger_mvp.transactions (sole writer)
homework-3/platform/services/budget/               # budget_mvp periods/categories/rollups
homework-3/platform/services/export/               # export_mvp CSV jobs
homework-3/platform/services/audit/                # audit_mvp append-only events
```

Shared MongoDB cluster with six databases (§5). REST map: [`docs/architecture/architecture-overview.md`](docs/architecture/architecture-overview.md).

### Per-service ending (condensed)

| SVC | Database | Key artifacts |
|-----|----------|---------------|
| `SVC-BFF` | — | Proxy modules, JWT guards, ops route |
| `SVC-ID` | `identity_mvp` | `users`, `households`, `memberships`, Mars seed |
| `SVC-BANK` | `bank_mvp` | `connections`, `tokens`, `import_previews`, adapters |
| `SVC-LED` | `ledger_mvp` | `transactions`, dedup engine, internal apply |
| `SVC-BUD` | `budget_mvp` | `budget_periods`, rollups from ledger |
| `SVC-EXP` | `export_mvp` | `export_jobs`, CSV worker |
| `SVC-AUD` | `audit_mvp` | `audit_events` immutable |

Detail: [`docs/services/`](docs/services/).

---

## 13. Low-level tasks

**Count:** 38 tasks (`TASK-BFF-*` … `TASK-WEB-*`). **Scope guard:** No task ID, file path, or DoD references `PH2-FILE`, `PH2-OCR`, `PH2-CASH`, or `PH2-XDEDUP` implementation (Phase 2 is §6 and §14 only).

Each task references one or more `MO-*`, includes a prompt-style intent, hypothetical path, and definition of done (DoD). Traceability counts: [Appendix A](#appendix-a--traceability-audit-phase-7).

### TASK-BFF-001 — JWT auth guard

**MO:** MO-4  
**Prompt:** Implement a NestJS JWT guard on `apps/gateway-bff` that validates Bearer tokens from `SVC-ID` and attaches `user_id`, `household_id`, `role` to the request context.  
**File:** `apps/gateway-bff/src/auth/jwt-auth.guard.ts`  
**DoD:** Missing/invalid token returns `401`; valid token populates context used by role decorators.

### TASK-BFF-002 — Role decorator and guard

**MO:** MO-4  
**Prompt:** Add `@Roles(...)` decorator and guard that returns `403` when role not in allowed set.  
**File:** `apps/gateway-bff/src/auth/roles.guard.ts`  
**DoD:** Viewer blocked from `POST .../exports`; user blocked from `POST .../confirm`.

### TASK-BFF-003 — Bank connection proxy routes

**MO:** MO-1, MO-4  
**Prompt:** Proxy `POST/GET/DELETE .../bank-connections` to `SVC-BANK` with admin/superadmin guard.  
**File:** `apps/gateway-bff/src/routes/bank-connections.controller.ts`  
**DoD:** Routes forward `X-Request-Id` and `X-Actor-User-Id`; viewer receives `403`.

### TASK-BFF-004 — Import preview and confirm proxy

**MO:** MO-2, MO-4  
**Prompt:** Proxy import preview GET and confirm POST; user sees filtered preview only.  
**File:** `apps/gateway-bff/src/routes/import-previews.controller.ts`  
**DoD:** Confirm requires admin/superadmin; confirm forwards actor headers to `SVC-BANK`.

### TASK-BFF-005 — Transactions list proxy

**MO:** MO-3, MO-4  
**Prompt:** Proxy `GET .../transactions` to `SVC-LED` with membership context for filtering.  
**File:** `apps/gateway-bff/src/routes/transactions.controller.ts`  
**DoD:** Default query `status=booked`; pagination params forwarded; cursor max 200.

### TASK-BFF-006 — Budget and export proxy

**MO:** MO-5, MO-6, MO-4  
**Prompt:** Proxy budget period routes and export create/status/download.  
**File:** `apps/gateway-bff/src/routes/budget.controller.ts`, `exports.controller.ts`  
**DoD:** Export create rejects viewer; download streams only when job `completed`.

### TASK-BFF-007 — Ops audit proxy

**MO:** MO-8  
**Prompt:** Expose `GET /ops/audit/events` for superadmin/ops role only.  
**File:** `apps/gateway-bff/src/routes/ops-audit.controller.ts`  
**DoD:** Read-only; no mutation routes; filters passed to `SVC-AUD`.

### TASK-ID-001 — User and household schemas

**MO:** MO-4  
**Prompt:** Create Mongoose schemas for `users`, `households`, `memberships` in `identity_mvp`.  
**File:** `services/identity-household/src/households/household.schema.ts`  
**DoD:** Unique index on `(household_id, user_id)` for memberships.

### TASK-ID-002 — JWT issue on login

**MO:** MO-4  
**Prompt:** Implement `POST /auth/login` and `POST /auth/refresh` issuing JWT with `household_id`, `user_id`, `role`.  
**File:** `services/identity-household/src/auth/auth.controller.ts`  
**DoD:** JWT claims documented; refresh rotates token; passwords never stored in audit.

### TASK-ID-003 — Mars Family seed

**MO:** MO-4  
**Prompt:** Seed script loading [`mocks/household-family.json`](mocks/household-family.json) with all seven members and roles.  
**File:** `services/identity-household/seeds/mars-family.ts`  
**DoD:** Integration test asserts mother=superadmin, cat=viewer, father=admin.

### TASK-ID-004 — Invitation and role change

**MO:** MO-4  
**Prompt:** Implement invite create and `PATCH` member role with rule: admin cannot grant superadmin.  
**File:** `services/identity-household/src/memberships/memberships.controller.ts`  
**DoD:** Admin patching superadmin returns `403`; audit event on role change.

### TASK-ID-005 — Erasure request orchestration

**MO:** MO-7  
**Prompt:** Implement `POST .../erasure-requests` for superadmin and self-service user; emit audit event.  
**File:** `services/identity-household/src/erasure/erasure.service.ts`  
**DoD:** Request persisted; `erasure.requested` audit event; tokens revoke triggered via bank client stub.

### TASK-BANK-001 — BankProvider port and types

**MO:** MO-1  
**Prompt:** Define `BankProvider` interface and shared types per bank-provider doc.  
**File:** `services/bank-connector/src/providers/bank-provider.port.ts`  
**DoD:** All three `sourceSystem` values typed; `FetchOptions` includes checkpoint.

### TASK-BANK-002 — Mono adapter

**MO:** MO-1, MO-3  
**Prompt:** Implement Mono adapter: map `id`, signed amount, `time` to canonical preview fields.  
**File:** `services/bank-connector/src/providers/mono.adapter.ts`  
**DoD:** Unit test maps sample Mono payload; amount sign matches direction rule.

### TASK-BANK-003 — OTP and Privat24 adapters

**MO:** MO-1  
**Prompt:** Implement OTP (`debitCredit` normalization) and Privat24 adapters.  
**File:** `services/bank-connector/src/providers/otp.adapter.ts`, `privat24.adapter.ts`  
**DoD:** OTP absolute amount converts to signed canonical amount; pagination handled.

### TASK-BANK-004 — Encrypted token storage

**MO:** MO-1, MO-7  
**Prompt:** Store OAuth tokens encrypted in `bank_mvp.tokens`; never log raw secrets.  
**File:** `services/bank-connector/src/tokens/token.repository.ts`  
**DoD:** Log redaction test; disconnect deletes token document.

### TASK-BANK-005 — Incremental sync job

**MO:** MO-1  
**Prompt:** Cron job every 15 min calling `fetchTransactions` with checkpoint; writes/updates `import_previews`.  
**File:** `services/bank-connector/src/sync/incremental-sync.job.ts`  
**DoD:** Preview status `pending_confirmation`; checkpoint advanced on success; `429` backoff.

### TASK-BANK-006 — Import preview API

**MO:** MO-2  
**Prompt:** `GET import-previews/{id}` returns summary and txn list; user-filtered by connection owner.  
**File:** `services/bank-connector/src/import/preview.service.ts`  
**DoD:** Unconfirmed preview does not call ledger; quarantined rows flagged in response.

### TASK-BANK-007 — Confirm import orchestration

**MO:** MO-2, MO-3  
**Prompt:** Confirm endpoint calls `SVC-LED` `POST /internal/imports/{previewId}/apply` and records audit.  
**File:** `services/bank-connector/src/import/confirm.service.ts`  
**DoD:** Double confirm idempotent; `import.confirmed` audit; apply summary returned to client.

### TASK-BANK-008 — Revoke mid-preview handling

**MO:** MO-1, MO-2  
**Prompt:** On revoke during open preview, set preview `aborted` and block confirm.  
**File:** `services/bank-connector/src/connections/revoke.handler.ts`  
**DoD:** Confirm on aborted preview returns `409`; `token.revoked` audit emitted.

### TASK-LED-001 — Transaction schema and indexes

**MO:** MO-3  
**Prompt:** Mongoose schema for canonical transaction with unique `(source_system, source_transaction_id)`.  
**File:** `services/ledger/src/transactions/transaction.schema.ts`  
**DoD:** Matches canonical doc fields; `source_kind` default `bank_api`.

### TASK-LED-002 — Reconciliation engine Level 1–2

**MO:** MO-3  
**Prompt:** Implement create/update/duplicate-skip per deduplication spec.  
**File:** `services/ledger/src/dedup/reconciliation.engine.ts`  
**DoD:** Unit tests for duplicate skip and update; fingerprint fallback when id missing.

### TASK-LED-003 — Internal apply import handler

**MO:** MO-2, MO-3  
**Prompt:** `POST /internal/imports/{previewId}/apply` upserts booked rows only.  
**File:** `services/ledger/src/imports/apply-import.handler.ts`  
**DoD:** Response includes `created`, `updated`, `duplicate_skipped`; idempotent on same previewId.

### TASK-LED-004 — Booked transaction list with RBAC filter

**MO:** MO-3, MO-4  
**Prompt:** Public list endpoint applies household vs user filter on `attributed_user_id`.  
**File:** `services/ledger/src/queries/list-booked.handler.ts`  
**DoD:** User cannot see father's txns in Mars fixture; cursor pagination enforced.

### TASK-LED-005 — Internal bulk read for budget/export

**MO:** MO-5, MO-6  
**Prompt:** `GET /internal/transactions` with `status=booked` and date range for downstream services.  
**File:** `services/ledger/src/queries/internal-list.handler.ts`  
**DoD:** Only `SVC-BUD` and `SVC-EXP` service tokens allowed; max page size 200.

### TASK-BUD-001 — Categories and budget periods

**MO:** MO-5  
**Prompt:** CRUD for `categories` and `budget_periods` with household scope.  
**File:** `services/budget/src/periods/periods.service.ts`  
**DoD:** Unique `(household_id, start_date)`; admin can create period.

### TASK-BUD-002 — Actuals rollup from ledger

**MO:** MO-5, MO-3  
**Prompt:** Compute `actual_booked` per category by summing ledger debits for period; **booked only**.  
**File:** `services/budget/src/rollups/actuals.service.ts`  
**DoD:** Matches [`mocks/sample-budget-period.json`](mocks/sample-budget-period.json) totals for `bp_2026_06`.

### TASK-BUD-003 — Visibility filter

**MO:** MO-4, MO-5  
**Prompt:** Admin household-wide actuals; user own `attributed_user_id`; viewer read-only slice.  
**File:** `services/budget/src/rollups/visibility.filter.ts`  
**DoD:** Son does not see father's utilities total; viewer cannot PUT categories.

### TASK-EXP-001 — Export job schema and create API

**MO:** MO-6  
**Prompt:** Create `export_jobs` with `format=csv` only; status lifecycle `queued` → `processing` → `completed`.  
**File:** `services/export/src/jobs/create-export.handler.ts`  
**DoD:** Rejects non-csv format; rejects >50k row estimate with `400`.

### TASK-EXP-002 — CSV generator worker

**MO:** MO-6, MO-3  
**Prompt:** Worker paginates ledger internal API and writes CSV per manifest.  
**File:** `services/export/src/jobs/csv-generator.worker.ts`  
**DoD:** Output columns match manifest; snapshot time fixed at job creation.

### TASK-EXP-003 — Role-based redaction

**MO:** MO-6, MO-4  
**Prompt:** Apply column inclusion and row scope from [`mocks/sample-export-manifest.json`](mocks/sample-export-manifest.json).  
**File:** `services/export/src/redaction/column-manifest.ts`  
**DoD:** User export omits `attributed_user_id`; masks `counterparty_account` last4.

### TASK-EXP-004 — Download endpoint and audit

**MO:** MO-6, MO-7  
**Prompt:** Stream CSV on download; emit `export.completed` with row count.  
**File:** `services/export/src/download/download.controller.ts`  
**DoD:** Incomplete job returns `409`; audit has no full CSV body in payload.

### TASK-AUD-001 — Append-only event schema

**MO:** MO-7  
**Prompt:** Define `audit_events` schema and `POST /internal/audit/events` insert-only handler.  
**File:** `services/audit/src/events/append.handler.ts`  
**DoD:** No UPDATE/DELETE routes; payload validator rejects token-like strings.

### TASK-AUD-002 — Ops query API

**MO:** MO-8  
**Prompt:** `GET /ops/audit/events` with filters and cursor pagination.  
**File:** `services/audit/src/query/ops-query.handler.ts`  
**DoD:** Superadmin can filter by `household_id` and `event_type`; read-only.

### TASK-AUD-003 — Standard event type catalog

**MO:** MO-7, MO-8  
**Prompt:** Document and enforce allowed `event_type` enum for MVP writers.  
**File:** `services/audit/src/events/event-types.ts`  
**DoD:** All types in audit service doc §5 present; unknown type returns `400`.

### TASK-WEB-001 — Angular dashboard shell

**MO:** MO-4, MO-5  
**Prompt:** Create routed shell: login, household dashboard, role-aware nav hiding export for viewers.  
**File:** `apps/web/src/app/app.routes.ts`  
**DoD:** Cat profile sees transactions read-only; no export button.

### TASK-WEB-002 — Import preview and confirm UI

**MO:** MO-2  
**Prompt:** Admin confirm flow with preview summary and apply result counts.  
**File:** `apps/web/src/app/features/import/import-confirm.component.ts`  
**DoD:** User role does not show confirm button; father can confirm.

### TASK-WEB-003 — Budget period view

**MO:** MO-5  
**Prompt:** Display period limits vs actuals with overspend indicator.  
**File:** `apps/web/src/app/features/budget/budget-period.component.ts`  
**DoD:** Admin sees household totals; son sees personal envelope only.

---

## 14. Phase 2 roadmap

| ID | Capability | Notes |
|----|------------|-------|
| `PH2-FILE` | Bank file upload | Reuse confirm UX; row-hash idempotency |
| `PH2-OCR` | Receipt OCR | Always confirm; image retention per data-lifecycle |
| `PH2-CASH` | Manual cash | New `source_kind=manual`; separate validation |
| `PH2-XDEDUP` | Cross-source dedup | User merge/split for receipt vs bank |
| — | PostgreSQL migration | Per-service, REST unchanged |
| — | Event bus | Optional async decoupling post-MVP |

**Scope guard:** §13 tasks MUST NOT require Phase 2 implementation. Phase 2 rows in §6 are informative only. Receipt-vs-bank dedup remains **`PH2-XDEDUP`** (see §8).

---

## Appendix A — Traceability audit (Phase 7)

Audit date: integration pass on `specification.md`. Requirement: each `MO-*` has **≥ 2** tasks in §13 and **≥ 1** verification row in §11.

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

**Cross-cutting in spec (no extra docs required to grade):** §4 SLO table (11 metrics); §10 edge cases (12 rows); §13 task list; §9 Mars Family + RBAC matrix.

**Submission scope:** Homework deliverables live under `homework-3/` only (`specification.md`, `agents.md`, `README.md`, `.cursor/rules/`, `docs/`, `mocks/`). Do not modify `homework-1/` or `homework-2/` for this assignment.

---

## Appendix B — Mars / locked decisions checklist

| Check | Spec location | Expected |
|-------|---------------|----------|
| Admin/superadmin confirm import | §1, §2 `MO-2`, §9 matrix, §10, `TASK-BFF-004`, `TASK-BANK-007` | User/viewer cannot confirm |
| CSV export only (MVP) | §1, §2 `MO-6`, §5, §6, `TASK-EXP-001` | `format=csv` only; no PDF/XLSX tasks |
| Booked-only budget/export | §1, §2 `MO-3`/`MO-5`, §5, §8, `TASK-BUD-002`, `TASK-LED-004` | Pending preview excluded |
| Shared cluster DB names | §5, §12 table | `identity_mvp`, `bank_mvp`, `ledger_mvp`, `budget_mvp`, `export_mvp`, `audit_mvp` |
| Ledger sole writer | §5, §12 `SVC-LED` | No `TASK-*` writes `ledger_mvp` outside LED |
| Mars Family mock | §3, §9, §11 `MO-4`, `TASK-ID-003` | `hh_mars_001`; cat viewer export denied |
| Father confirms import | §11 `MO-2`, `TASK-WEB-002` | Oleksandr (`usr_mars_father`), admin |
| Superadmin override audited | §2 `MO-2`, §10 | `actor_role=superadmin` |
| Cat viewer edge case | §10, §11 `MO-4`/`MO-6`, `TASK-WEB-001` | `export.denied` / BFF `403` |
| Phase 2 not in tasks | §13 scope guard, §14 | `PH2-*` descriptive only |
| Cross-source dedup out of MVP | §8, §14 `PH2-XDEDUP` | Bank-only dedup in `TASK-LED-002` |

---

## Document map

| Topic | Deep dive |
|-------|-----------|
| Docs index & reading order | [`docs/README.md`](docs/README.md) |
| Submission overview & rationale | [`README.md`](README.md) |
| Agent guidelines | [`agents.md`](agents.md) |
| Architecture & REST | [`docs/architecture/architecture-overview.md`](docs/architecture/architecture-overview.md) |
| Scope & traceability | [`docs/registry/scope-and-traceability.md`](docs/registry/scope-and-traceability.md) |
| Task ↔ MO matrix | [`docs/registry/traceability-matrix.md`](docs/registry/traceability-matrix.md) |
| Public / internal API | [`docs/api/`](docs/api/) |
| Testing strategy | [`docs/testing/`](docs/testing/) |
| Compliance | [`docs/compliance/compliance-ukraine.md`](docs/compliance/compliance-ukraine.md) |
| Data lifecycle | [`docs/compliance/data-lifecycle.md`](docs/compliance/data-lifecycle.md) |
| Services | [`docs/services/`](docs/services/) |
| Fixtures | [`mocks/README.md`](mocks/README.md) |

---

*Homework 3 — specification-only deliverable (Phase 7 integration complete). Implementation tasks above describe a hypothetical NestJS + Angular monorepo for agent-driven development.*
