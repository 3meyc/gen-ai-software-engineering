# How to Review and Verify (Homework 3)

> **This submission is a specification package only** — there is no runnable application in `homework-3/` today. Use this guide to review the graded artifacts, inspect HTTP contracts and fixtures, and (optionally) preview how a future implementation would be run under [`platform/`](platform/README.md).

For submission rationale and best-practice references, see [`README.md`](README.md). Assignment brief: [`TASKS.md`](TASKS.md).

---

## Prerequisites

| Tool | Required? | Purpose |
|------|-------------|---------|
| Web browser | Yes | Read `specification.md`, browse docs and mocks |
| Git | Yes | Clone or check out your `homework-3/` branch |
| [Swagger Editor](https://editor.swagger.io) | Recommended | Preview OpenAPI YAML |
| Node.js 18+ | Optional | `npx @redocly/cli` for local API docs preview |
| VS Code + OpenAPI extension | Optional | In-editor schema preview |

No `npm install` is required for the **current** graded package.

---

## Quick reviewer checklist

Use this list when preparing or reviewing a pull request:

- [ ] Read [`specification.md`](specification.md) §1–§14 (layered spec, edge cases §10, verification §11, tasks §13)
- [ ] Spot-check traceability: [`docs/registry/scope-and-traceability.md`](docs/registry/scope-and-traceability.md) and [`docs/registry/traceability-matrix.md`](docs/registry/traceability-matrix.md)
- [ ] Open public BFF OpenAPI in Swagger Editor (steps below)
- [ ] Open [`mocks/household-family.json`](mocks/household-family.json) and confirm Mars Family roles match [`docs/domain/household-rbac.md`](docs/domain/household-rbac.md)
- [ ] Skim [`agents.md`](agents.md) and [`.cursor/README.md`](.cursor/README.md) for agent constraints
- [ ] Embed PR screenshots (AI workflow, OpenAPI preview, key spec sections) per course [`README.md`](../README.md) — store copies under `docs/screenshots/` when you add them

---

## Step 1 — Navigate the repository

From the repo root:

```powershell
cd homework-3
```

Suggested reading order (full index: [`docs/README.md`](docs/README.md)):

1. [`specification.md`](specification.md) §1–§4 — objective, `MO-*`, NFR/SLOs  
2. [`docs/registry/scope-and-traceability.md`](docs/registry/scope-and-traceability.md) — frozen IDs  
3. [`docs/architecture/architecture-overview.md`](docs/architecture/architecture-overview.md) — seven services + BFF  
4. [`docs/domain/`](docs/domain/) — canonical model, dedup, RBAC  
5. [`docs/api/`](docs/api/) — routes, headers, errors, OpenAPI  
6. [`docs/services/`](docs/services/) — per-service behavior and §9 persistence  
7. [`mocks/`](mocks/) — Mars Family fixtures  

---

## Step 2 — Inspect HTTP contracts (OpenAPI)

Canonical JSON shapes live under [`docs/api/openapi/`](docs/api/openapi/).

### Option A — Swagger Editor (no install)

1. Open https://editor.swagger.io  
2. **File → Import file** (or paste YAML)  
3. Import one of:
   - [`docs/api/openapi/public-bff.openapi.yaml`](docs/api/openapi/public-bff.openapi.yaml) — public `/api/v1` BFF  
   - [`docs/api/openapi/internal.openapi.yaml`](docs/api/openapi/internal.openapi.yaml) — service `/internal/v1`  
4. Confirm shared components resolve via [`docs/api/openapi/components/schemas.yaml`](docs/api/openapi/components/schemas.yaml)

Cross-check routes and status codes against:

- [`docs/api/public-routes.md`](docs/api/public-routes.md)  
- [`docs/api/internal-routes.md`](docs/api/internal-routes.md)  
- [`docs/api/errors-and-status-codes.md`](docs/api/errors-and-status-codes.md)  

### Option B — Redocly CLI (optional, requires Node)

```powershell
cd docs\api\openapi
npx --yes @redocly/cli preview-docs public-bff.openapi.yaml
```

Follow the URL printed in the terminal. Repeat with `internal.openapi.yaml` if needed.

More detail: [`docs/api/openapi/README.md`](docs/api/openapi/README.md).

---

## Step 3 — Validate fixtures and test scenarios

| File | Verify |
|------|--------|
| [`mocks/household-family.json`](mocks/household-family.json) | `hh_mars_001`, roles (`superadmin` / `admin` / `user` / `viewer`), bank connections |
| [`mocks/sample-transactions.json`](mocks/sample-transactions.json) | `source_system` ∈ `mono`, `otp`, `privat24`; booked rows for `MO-3` |
| [`mocks/sample-budget-period.json`](mocks/sample-budget-period.json) | Booked-only actuals for `MO-5` |
| [`mocks/sample-export-manifest.json`](mocks/sample-export-manifest.json) | Column/redaction rules; viewer export denied (`MO-6`) |
| [`mocks/bank-payloads/`](mocks/bank-payloads/) | Optional provider raw samples for adapter tests |

Scenario matrix (who can confirm import, export, etc.): [`docs/testing/fixtures-guide.md`](docs/testing/fixtures-guide.md).

**Note:** Fixture JSON may use numeric `amount` for readability; API and persistence require **string decimals** per [`specification.md` §5](specification.md#5-implementation-notes) and OpenAPI `DecimalAmount`.

### Optional — JSON syntax check (Node)

From `homework-3/`:

```powershell
node -e "const f=['mocks/household-family.json','mocks/sample-transactions.json']; f.forEach(p=>{JSON.parse(require('fs').readFileSync(p,'utf8')); console.log('OK',p)})"
```

---

## Step 4 — Verification and testing documentation

No automated test suite ships with this homework. Verification is **documented** in:

| Document | Content |
|----------|---------|
| [`specification.md` §11](specification.md#11-verification) | How each `MO-*` is verified |
| [`docs/testing/testing-strategy.md`](docs/testing/testing-strategy.md) | Unit / integration / E2E-doc categories |
| [`docs/testing/fixtures-guide.md`](docs/testing/fixtures-guide.md) | Which mock file applies to which `MO-*` |

When implementing later, the standard stack is **npm workspaces + Vitest + supertest + mongodb-memory-server** — see [`docs/architecture/monorepo-and-tooling.md`](docs/architecture/monorepo-and-tooling.md).

---

## Step 5 — Work with an AI agent (optional)

1. Open `homework-3/` in Cursor (or your editor with project rules).  
2. Read [`agents.md`](agents.md) before asking for doc or code changes.  
3. Follow [`.cursor/rules/`](.cursor/rules/) — especially stack, startup, and Vitest rules under [`.cursor/README.md`](.cursor/README.md).  
4. For implementation tasks, start from [`specification.md` §13](specification.md#13-low-level-tasks) and the matching `docs/services/*.md` §7 DoD.

Archived build narrative (optional): [`plans/README.md`](plans/README.md).

---

## Future — run the platform (not in current submission)

[`platform/`](platform/README.md) is reserved for NestJS + Angular code. **It is not scaffolded in the graded spec package.**

When you add implementation:

1. Scaffold per [`agents.md` §3](agents.md#3-monorepo-layout-hypothetical) and [`docs/architecture/monorepo-and-tooling.md`](docs/architecture/monorepo-and-tooling.md).  
2. Configure env vars per [`docs/architecture/configuration.md`](docs/architecture/configuration.md).  
3. From `homework-3/platform/` (once `package.json` exists):

   ```powershell
   npm install
   npm test
   ```

4. Start services per port table in `agents.md` (BFF typically `3000`; internal services on documented ports).  
5. Align controllers with [`docs/api/openapi/`](docs/api/openapi/) and persistence with each `docs/services/*.md` §9.

Until then, treat this section as a **forward-looking** runbook only.

---

## Related entry points

| Document | Role |
|----------|------|
| [`README.md`](README.md) | Graded submission summary and rationale |
| [`TASKS.md`](TASKS.md) | Course assignment requirements |
| [`specification.md`](specification.md) | Primary graded artifact |
| [`docs/README.md`](docs/README.md) | Documentation index and source-of-truth table |
