# Homework 3 — AI Agent Guidelines

> Use this file with [`specification.md`](specification.md) (primary product spec) and Cursor config under [`.cursor/`](.cursor/) (rules + skills). Key rules: [`Agent-Output-Rules.mdc`](.cursor/rules/Agent-Output-Rules.mdc), [`Stack-Domain-Rules.mdc`](.cursor/rules/Stack-Domain-Rules.mdc), [`Agent-Context-Startup-Rules.mdc`](.cursor/rules/Agent-Context-Startup-Rules.mdc).

**Workspace:** Work only under `homework-3/` unless the user explicitly expands scope. Do not modify `homework-1/` or `homework-2/`.

---

## 1. Product context

You are helping build (or specify) a **Ukraine-focused household budget platform**:

- **MVP:** Bank API ingest (Mono, OTP, Privat24) → **admin/superadmin confirm** → deduplicated ledger → role-scoped budget → **CSV export**.
- **Out of MVP:** File upload (`PH2-FILE`), receipt OCR (`PH2-OCR`), manual cash (`PH2-CASH`), cross-source dedup (`PH2-XDEDUP`), event bus, non-CSV export.
- **North star:** One trustworthy view of **booked** bank spending per household with UA privacy and immutable audit.

**IDs:** `MO-1`…`MO-8`, `SVC-*`, `TASK-{SVC}-{nnn}`, `PH2-*` — see [`docs/registry/scope-and-traceability.md`](docs/registry/scope-and-traceability.md).

**Demo household:** Mars Family — [`mocks/household-family.json`](mocks/household-family.json) (mother=superadmin, father=admin, cat=viewer for permission edge tests).

---

## 2. Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | **Angular** (strict mode), standalone components preferred |
| API gateway | **NestJS** `gateway-bff` — JWT, RBAC, proxy only; **no business DB** |
| Services | **NestJS** microservices, one deployable per `SVC-*` |
| Persistence | **Mongoose** per service; **one MongoDB database per service** on a shared cluster |
| Inter-service | **REST** only in MVP (`/api/v1` public, `/internal/v1` service-to-service) |
| Jobs | Cron in `SVC-BANK` (sync), worker in `SVC-EXP` (CSV) — no message bus in MVP |

**Post-MVP note:** Services may migrate to PostgreSQL independently; keep REST contracts stable.

---

## 3. Monorepo layout (hypothetical)

### Implementation location (documentation only)

| Location | Contents |
|----------|----------|
| `homework-3/` | **Specs, mocks, agents** — graded deliverables; do not put application source here |
| `homework-3/platform/` | **Future code only** — NestJS `apps/` + `services/` when user requests implementation |
| Repo root `homework-1/`, `homework-2/` | Out of scope — never modify for HW3 |

When the user asks for implementation, scaffold under `homework-3/platform/` unless they specify otherwise:

```text
homework-3/
  specification.md
  agents.md
  docs/
  mocks/
  platform/                    # implementation root (not required for grading)
    apps/
      web/                       # Angular — SVC-BFF client
      gateway-bff/               # SVC-BFF — port 3000
    services/
      identity-household/        # SVC-ID — identity_mvp — 3001
      bank-connector/            # SVC-BANK — bank_mvp — 3002
      ledger/                    # SVC-LED — ledger_mvp — 3003
      budget/                    # SVC-BUD — budget_mvp — 3004
      export/                    # SVC-EXP — export_mvp — 3005
      audit/                     # SVC-AUD — audit_mvp — 3006
```

**N.B.** Homework grading is **spec-first**; create `platform/apps/` and `platform/services/` only when the user requests code. Default work stays under `homework-3/` documentation.

---

## 4. Service boundaries (non-negotiable)

| Rule | Detail |
|------|--------|
| **Ledger sole writer** | Only `SVC-LED` inserts/updates/deletes `ledger_mvp.transactions` |
| **Confirm before ledger** | `SVC-BANK` holds previews in `bank_mvp`; apply via `POST /internal/imports/{previewId}/apply` after confirm |
| **Booked-only consumers** | `SVC-BUD` and `SVC-EXP` read ledger with `status=booked` |
| **No cross-DB writes** | Never write another service’s MongoDB database or collections |
| **BFF is thin** | No domain logic, no Mongo in BFF; enforce RBAC and forward `X-Request-Id`, `X-Actor-User-Id` |
| **Audit append-only** | All writers call `SVC-AUD` `POST /internal/audit/events`; no secrets in payload |

Architecture map: [`docs/architecture/architecture-overview.md`](docs/architecture/architecture-overview.md). Per-service detail: [`docs/services/`](docs/services/).

---

## 5. FinTech and security rules

### Never log or expose in audit payloads

- OAuth access/refresh tokens  
- Full PAN or unmasked account numbers  
- Full CSV row dumps in application logs  
- Passwords or raw JWT strings  

### Always do

- Store **masked PAN** only; encrypt bank tokens at rest ([`docs/compliance/data-lifecycle-mvp.md`](docs/compliance/data-lifecycle-mvp.md))  
- Use **decimal/string** for money — never JavaScript `number` for amounts  
- Default currency **UAH** (ISO 4217)  
- Enforce **signed `amount` + `direction`** agreement (positive=credit, negative=debit); quarantine mismatches in preview  
- Idempotent import: primary key `(source_system, source_transaction_id)`; idempotent apply on same `previewId`  
- **Booked-only** for budget actuals and export  
- Emit audit events for connect, confirm, export, erasure, denied actions  

### Import confirmation (`MO-2`)

- Only **admin** and **superadmin** may confirm (BFF `403` for user/viewer)  
- Unconfirmed preview rows **must not** appear in budget or export  
- Superadmin confirm must set `actor_role=superadmin` in audit  

### RBAC (`MO-4`)

- **Viewer** (e.g. cat profile): no bank connect, no confirm, no export → `403` + `export.denied` audit  
- **User:** per-user transaction and budget scope; export with redaction per manifest  
- **Admin / superadmin:** household-wide visibility where documented  

Matrix: [`docs/domain/household-rbac.md`](docs/domain/household-rbac.md).

---

## 6. Ukraine / compliance

- Jurisdiction: **Ukraine**; lawful basis = user consent at bank connect  
- Follow minimization, erasure, retention in [`docs/compliance/compliance-ukraine.md`](docs/compliance/compliance-ukraine.md)  
- Erasure: revoke tokens immediately; PII deletion orchestration within documented SLA  
- Ops/compliance: read-only audit query (`MO-8`) — no mutation via ops API  

Do not implement Phase 2 OCR/file/cash flows unless the user explicitly expands scope beyond MVP.

---

## 7. Edge cases — agent behavior

When implementing or reviewing code, explicitly handle these (see [`specification.md` §10](specification.md)):

| Scenario | Expected behavior |
|----------|-------------------|
| Token revoked mid-import | Preview `aborted`; confirm returns `409` |
| Duplicate re-sync | Update or `duplicate_skipped`; no second insert |
| User confirms import | `403` at BFF |
| Viewer exports | `403` + `export.denied` |
| Confirm during active sync | Pin preview version at confirm time |
| Export during sync | Snapshot time at job creation |
| Bank `429` | Backoff; do not hammer provider |
| Double confirm same preview | Idempotent ledger apply |
| Empty budget month | Zero actuals; valid empty state |

Prefer **fail closed** on auth and permission errors.

---

## 8. Testing and verification

Map tests to [`specification.md` §11](specification.md) and each task’s **DoD** in §13.

| Category | When to use |
|----------|-------------|
| **Unit** | Dedup engine, amount normalization, audit payload validator, redaction manifest |
| **Integration** | Service + Mongo; `BankProvider` mocks; BFF guard matrix |
| **E2E (documented)** | Father confirms import → ledger count; son confirm → `403`; cat export → `403` |

**Fixtures (required for realistic tests):**

| File | Use |
|------|-----|
| [`mocks/household-family.json`](mocks/household-family.json) | RBAC seed, seven roles |
| [`mocks/sample-transactions.json`](mocks/sample-transactions.json) | Ledger reconcile |
| [`mocks/sample-budget-period.json`](mocks/sample-budget-period.json) | `bp_2026_06` actuals |
| [`mocks/sample-export-manifest.json`](mocks/sample-export-manifest.json) | CSV columns and redaction |

**Per MO smoke checks:**

- **MO-1:** Encrypted token; sync creates preview, not ledger row  
- **MO-2:** Confirm triggers apply; user cannot confirm  
- **MO-3:** Double apply idempotent; booked-only queries  
- **MO-4:** Mars Family role matrix  
- **MO-5:** Actuals match booked sum; pending excluded  
- **MO-6:** CSV columns + user redaction  
- **MO-7:** Audit rejects token-like payload strings  
- **MO-8:** Ops query returns `import.confirmed` chain  

**SLO awareness:** Respect pagination (50 default, 200 max), export cap 50k rows, BFF read p95 target — see specification §4.

---

## 9. Code style (summary)

Detailed rules: [`.cursor/rules/Stack-Domain-Rules.mdc`](.cursor/rules/Stack-Domain-Rules.mdc).

- TypeScript **strict**; **no `any`** without documented exception  
- **Named exports** for modules; one main class/service per file where practical  
- NestJS: modules per domain; DTOs with `class-validator`; guards for roles  
- Angular: reactive forms; role-aware templates; no secrets in environment samples committed  
- MongoDB: explicit indexes from service docs; use service-specific connection string / DB name  

---

## 10. Reference documents (read before guessing)

| Topic | Document |
|-------|----------|
| Docs index | [`docs/README.md`](docs/README.md) |
| Product spec | [`specification.md`](specification.md) |
| Traceability | [`docs/registry/scope-and-traceability.md`](docs/registry/scope-and-traceability.md) |
| Task ↔ MO matrix | [`docs/registry/traceability-matrix.md`](docs/registry/traceability-matrix.md) |
| Public / internal API | [`docs/api/public-routes.md`](docs/api/public-routes.md), [`internal-routes.md`](docs/api/internal-routes.md) |
| HTTP errors (§10) | [`docs/api/errors-and-status-codes.md`](docs/api/errors-and-status-codes.md) |
| Headers | [`docs/api/headers.md`](docs/api/headers.md) |
| Testing | [`docs/testing/testing-strategy.md`](docs/testing/testing-strategy.md), [`fixtures-guide.md`](docs/testing/fixtures-guide.md) |
| Canonical transactions | [`docs/domain/canonical-banking-transaction-model.md`](docs/domain/canonical-banking-transaction-model.md) |
| Dedup / reconcile | [`docs/domain/deduplication-reconciliation-specification.md`](docs/domain/deduplication-reconciliation-specification.md) |
| Tokens / erasure (MVP) | [`docs/compliance/data-lifecycle-mvp.md`](docs/compliance/data-lifecycle-mvp.md) |
| Bank port | [`docs/domain/bank-provider-adapter.md`](docs/domain/bank-provider-adapter.md) |
| Ingestion matrix | [`docs/domain/ingestion-sources-matrix.md`](docs/domain/ingestion-sources-matrix.md) |
| RBAC | [`docs/domain/household-rbac.md`](docs/domain/household-rbac.md) |
| UA compliance | [`docs/compliance/compliance-ukraine.md`](docs/compliance/compliance-ukraine.md) |

---

## 11. Workflow for agents

0. Read [`docs/README.md`](docs/README.md) and [`docs/api/errors-and-status-codes.md`](docs/api/errors-and-status-codes.md) before coding (see also [`Agent-Context-Startup-Rules.mdc`](.cursor/rules/Agent-Context-Startup-Rules.mdc)).  
1. Read the relevant **`MO-*`** and **`TASK-*`** in `specification.md`.  
2. Check **service doc** under `docs/services/` for endpoints, indexes, and verification hooks.  
3. Implement under `homework-3/platform/` per §3; smallest slice that satisfies **DoD**; tests per [`docs/testing/testing-strategy.md`](docs/testing/testing-strategy.md) and [`.cursor/skills/vitest-testing/SKILL.md`](.cursor/skills/vitest-testing/SKILL.md).  
4. Never bypass **confirm → ledger** or **booked-only** shortcuts for convenience.  
5. On ambiguity, prefer spec + `docs/` over inventing new fields or roles.  
6. Phase 2 (`PH2-*`): mention in design comments only unless user opts in.  
7. Commits/PRs: use [`.cursor/skills/commit-messages/`](.cursor/skills/commit-messages/) and [`.cursor/skills/pr-messages/`](.cursor/skills/pr-messages/) when the user asks.

---

*Homework 3 — agent configuration for specification-driven household budget platform (MVP).*
