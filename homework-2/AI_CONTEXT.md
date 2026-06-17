# Homework 2: Intelligent Customer Support System Using AI Assistance

## Collaboration style

When discussing questions, ambiguities, or design choices for this homework:

1. Prefer **numbered lists** so items stay easy to reference and reply to.
2. Use ***Nota bene*** (N.B.) for constraints or assumptions that are easy to skim past but must not be ignored.

## Specification source

1. **`TASKS spec.md`** — working copy; apply clarifications and task changes here only.
2. **`TASKS.md`** — original assignment handout; **do not modify**.
3. If `TASKS.md` and `TASKS spec.md` disagree, follow **`TASKS spec.md`**.

## Scope

This homework is fully isolated from other experiments in the repository.

Do NOT:

1. Modify files outside `homework-2` (especially do not edit `homework-2/TASKS.md`).
2. Introduce shared packages with `homework-1` or the repo root.
3. Refactor repository-wide configs.
4. Change root tooling unless explicitly requested.

## Goal

Build a small customer support ticket API with multi-format import and keyword-based auto-classification.

Requirements:

1. Minimal dependencies.
2. Fast iteration.
3. Simple architecture.
4. TypeScript only.
5. No enterprise patterns.
6. Apply **Context–Model–Prompt** when using AI: provide spec + `AI_CONTEXT.md` + relevant files as context; pick an appropriate model per task type; prompt with explicit task id and acceptance criteria.

## Tech Stack

1. Node.js.
2. TypeScript.
3. Hono.
4. Vitest.
5. tsx.

**N.B.** Do not substitute Express, Python, Java, or other stacks for this folder. `TASKS spec.md` locks the stack to Node + Hono + Vitest.

Use project skills when relevant: `.cursor/skills/hono-backend`, `.cursor/skills/vitest-testing`.

## Architecture Rules

1. Keep application code inside `src/`.
2. Prefer functional style.
3. No DI containers.
4. No ORM or database unless explicitly requested.
5. No classes unless necessary.
6. No global mutable state; inject store into `createApp(store)`.
7. Split import parsers and classification into dedicated modules (e.g. `src/import/`, `src/classify.ts`).

## API Philosophy

1. REST JSON for all ticket endpoints.
2. **In-memory** ticket store (`createStore()`) until a database is requested; inject into `createApp(store)`.
3. No auth initially.
4. Error bodies aligned with **Homework 1**: `{ error: string }` or `{ error: "Validation failed", details: [{ field, message }] }`.
5. Status codes: `200`, `201`, `204` (delete), `400`, `404`, `429` (if rate limiting added), `500` for unexpected errors.

## Endpoints (Task 1)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/tickets` | Create ticket |
| `POST` | `/tickets/import` | Bulk import CSV / JSON / XML |
| `GET` | `/tickets` | List with filtering |
| `GET` | `/tickets/:id` | Get one |
| `PUT` | `/tickets/:id` | Update |
| `DELETE` | `/tickets/:id` | Delete |

**Task 2 addition:**

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/tickets/:id/auto-classify` | Run classifier; return category, priority, confidence, reasoning, keywords |

## Ticket model (Task 1 — locked)

Allowed enum values (reject anything else on write/import unless overridden by Task 2 classification):

| Field | Values / rules |
|-------|----------------|
| `id` | UUID — **server-generated** on create/import; client `id` ignored |
| `customer_id` | non-empty string — **required** on create/import |
| `customer_email` | valid email format — **required** |
| `customer_name` | non-empty string — **required** |
| `subject` | string, 1–200 chars — **required** |
| `description` | optional; default `""`; if non-empty, 10–2000 chars |
| `category` | enum — **required** on create/import |
| `priority` | enum — **required** on create/import |
| `status` | enum — **required** on create/import |
| `created_at`, `updated_at` | ISO datetime — **server-generated**; `updated_at` bumped on every successful `PUT` |
| `resolved_at` | ISO datetime or `null` — optional |
| `assigned_to` | string or `null` — optional |
| `tags` | array of strings — optional; default `[]` |
| `metadata` | object — optional; all subfields optional when `metadata` is sent |
| `metadata.source` | `web_form`, `email`, `api`, `chat`, `phone` |
| `metadata.browser` | string |
| `metadata.device_type` | `desktop`, `mobile`, `tablet` |
| `classification_confidence` | `number \| null` — set by classifier; cleared on manual category/priority override |
| `classification_reasoning` | `string \| null` — free-text explanation from classifier |
| `classification_keywords` | `string[]` — matched phrases (`keywords_found` in classifier output) |

**N.B.** Do **not** default `category`, `priority`, or `status` on create — the client must supply them (see `TASKS spec.md` Task 1).

Example create request (minimum required fields):

```json
{
  "customer_id": "cust_42",
  "customer_email": "user@example.com",
  "customer_name": "Jane Doe",
  "subject": "Cannot log in after password reset",
  "category": "account_access",
  "priority": "high",
  "status": "new"
}
```

Optional fields may be added: `description`, `resolved_at`, `assigned_to`, `tags`, `metadata`.

## `POST /tickets` — optional auto-classify (Task 2)

Support optional auto-classification via query `?auto_classify=true` or body `"auto_classify": true`.

1. Create and validate ticket first (client still sends required `category` / `priority` / `status`).
2. If flag set, run classifier on `subject` + `description` + `tags`.
3. **Overwrite** `category` and `priority` with classifier output; persist `classification_confidence`, `classification_reasoning`, `classification_keywords`.
4. Log the decision (see Auto-classification).

**N.B.** Manual `PUT` with `category` and/or `priority` **replaces** classification metadata (confidence → `null`, reasoning/keywords cleared).

## `POST /tickets/import`

1. Accept uploaded file (multipart) or raw body with format hint (`Content-Type`, query `format=csv|json|xml`, or file extension).
2. Parse **CSV**, **JSON**, or **XML** in dedicated parsers.
3. Validate each record; collect per-row errors without failing the entire batch unless the file is unreadable.
4. Response shape:

```json
{
  "total": 50,
  "successful": 48,
  "failed": 2,
  "errors": [
    { "row": 3, "message": "customer_email: invalid format" },
    { "row": 17, "message": "description: must be 10-2000 chars" }
  ]
}
```

5. Malformed file (not parseable) → `400` with `{ error: "..." }` and a clear message.
6. Partial success → `201` with summary above.
7. Optional `?auto_classify=true` (or multipart `auto_classify`) — classify each successfully imported row before save (same overwrite rules as create).

## `GET /tickets` — filtering

Response: `200` with `{ "tickets": [ ... ] }` (not a bare array).

Query filters (all optional; **AND** semantics):

1. `customer_id`
2. `customer_email`
3. `customer_name`
4. `category`
5. `priority`
6. `status`
7. `tags` — comma-separated; ticket must contain **every** listed tag
8. `assigned_to` — exact match

No matches → `200` with `{ "tickets": [] }`.

## `PUT /tickets/:id` — partial update (Task 1)

1. Only keys present in the JSON body are validated and applied.
2. `id` and `created_at` are never taken from the client.
3. `updated_at` is set server-side on success.
4. `metadata` merges with existing object (patch per subfield).
5. `200` + updated ticket; `404` if not found; `400` with Homework 1-style `details` on validation failure.

## `DELETE /tickets/:id` (Task 1)

1. Success → `204` with empty body.
2. Missing id → `404` `{ "error": "Ticket not found" }`.

## Auto-classification (Task 2)

Keyword / phrase matching on `subject` + `description` + `tags`, case-insensitive. Implementation: `src/classify.ts`.

**Categories** — highest keyword-hit count wins; tie → first in table order:

| Category | Meaning | Keywords (see `CATEGORY_KEYWORDS` in code for full list) |
|----------|---------|----------------------------------------------------------|
| `account_access` | Login, credentials | login, password, 2fa, locked out, credentials |
| `bug_report` | Broke / stopped process | bug, broke, broken, crash, stopped, reproduce, regression |
| `technical_issue` | Minor / non-critical | issue, glitch, slow, intermittent, timeout, degraded |
| `billing_question` | Payments | payment, invoice, refund, billing, subscription |
| `feature_request` | Enhancements | feature, enhancement, suggestion, would like |
| `other` | No strong match | default |

**Priority** — **highest severity among matched phrases wins** (urgent > high > medium > low):

| Priority | Trigger phrases (substring match) |
|----------|-----------------------------------|
| `urgent` | can't access, critical, production down, security |
| `high` | important, blocking, asap |
| `low` | minor, cosmetic, suggestion |
| `medium` | default when no other rule matches |

**Confidence tiers** (`classification_confidence`):

| Value | Meaning |
|-------|---------|
| `0.95` | Very confident |
| `0.60` | Somewhat confident; could be wrong |
| `0.30` | Low confidence; likely needs human review |

**`POST /tickets/:id/auto-classify`:**

- `200` — **full updated ticket** (includes classification fields).
- `404` — ticket not found.

**Classification fields on ticket:**

```json
{
  "category": "account_access",
  "priority": "urgent",
  "classification_confidence": 0.95,
  "classification_reasoning": "Matched category \"account_access\" (login, password); priority \"urgent\" (can't access)",
  "classification_keywords": ["login", "password", "can't access"]
}
```

**Decision log** — append-only in-memory on store (`logClassification` / `getClassificationLog`): ticket id, timestamp, trigger (`create`, `auto-classify`, `import`), previous vs new category/priority, confidence, `keywords_found`, reasoning (free text).

## Testing

Use:

1. Vitest, `environment: "node"`.
2. Hono `app.request()` — no live server, no supertest.

**Layout** — `TASKS spec.md` names Python-style files under `tests/`; map them to TypeScript Vitest files under `test/`:

| Spec name | Vitest file (minimum) | Min tests (spec) |
|-----------|----------------------|------------------|
| `test_ticket_api` | `test/ticket-api.test.ts` | 11 |
| `test_ticket_model` | `test/ticket-model.test.ts` | 9 |
| `test_import_csv` | `test/import-csv.test.ts` | 6 |
| `test_import_json` | `test/import-json.test.ts` | 5 |
| `test_import_xml` | `test/import-xml.test.ts` | 5 |
| `test_categorization` | `test/categorization.test.ts` | 10 |
| `test_integration` | `test/integration.test.ts` | 5 |
| `test_performance` | `test/performance.test.ts` | 5 |

Fixtures: `test/fixtures/` (and/or repo-root sample files below).

**Coverage:** overall **>85%** (`npx vitest run --coverage`). Save screenshot to `docs/screenshots/test_coverage.png`.

**Task 5 (integration)** — include in `test/integration.test.ts`:

1. Full lifecycle: create → classify → update → resolve/close → delete (or subset per spec).
2. Bulk import + verify auto-classification on imported rows when enabled.
3. **20+ concurrent** `app.request()` calls (e.g. `Promise.all`) without incorrect counts or crashes.
4. Combined `category` + `priority` filters on `GET /tickets`.

Fresh `createStore()` per test when isolation matters.

## Sample data (deliverables)

Place under `homework-2/` (e.g. `fixtures/` or `demo/`):

| File | Records |
|------|---------|
| `sample_tickets.csv` | 50 |
| `sample_tickets.json` | 20 |
| `sample_tickets.xml` | 30 |
| invalid variants | for negative import / validation tests |

## Documentation (Task 4)

Generate inside `homework-2/`:

1. **`README.md`** — overview, features, Mermaid architecture, setup, run tests, structure.
2. **`API_REFERENCE.md`** — endpoints, schemas, errors, cURL per endpoint.
3. **`ARCHITECTURE.md`** — components, Mermaid sequence/flow, trade-offs, security/performance notes.
4. **`TESTING_GUIDE.md`** — test pyramid (Mermaid), run commands, fixtures, manual checklist, benchmark table.

Requirements:

1. At least **3 Mermaid diagrams** across these documents.
2. Use **different AI models** for different doc types when generating (note which model in each doc footer or README).

**N.B.** `homework-2/README.md` may be the student submission template; merge developer README content per course instructions or use separate filenames if the course distinguishes them.

## Expected project structure

```
homework-2/
  AI_CONTEXT.md          # this file
  TASKS.md               # read-only original
  TASKS spec.md          # working spec
  src/
    app.ts
    server.ts
    store.ts
    types.ts
    validation.ts
    ticket-logic.ts      # finalize, filter, partial update helpers
    classification-service.ts  # auto_classify flags, persist + log
    routes/tickets.ts
    import/              # csv.ts, json.ts, xml.ts, index.ts
    classify.ts          # Task 2
  test/
    *.test.ts
    fixtures/
  sample_tickets.csv
  sample_tickets.json
  sample_tickets.xml
  docs/screenshots/
  README.md
  API_REFERENCE.md
  ARCHITECTURE.md
  TESTING_GUIDE.md
```

## Non-Goals

Do NOT add unless explicitly requested:

1. Express, FastAPI, Spring Boot.
2. NestJS, heavy frameworks.
3. External LLM APIs for classification (use keyword rules from spec).
4. PostgreSQL / ORM / microservices / Kubernetes.
5. Docker orchestration.

## Dependency philosophy

Prefer:

1. Native Node APIs and small parsers only where needed (XML/CSV).
2. Lightweight deps (e.g. `hono`, `@hono/node-server`, `tsx`, `vitest`).
3. No Zod/OpenAPI unless you update `TASKS spec.md` to allow them.

## Important

Treat this homework as disposable experimentation code optimized for learning and speed, not production scale. When in doubt, prefer clear behavior and tests over abstraction.
