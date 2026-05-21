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
2. In-memory ticket store until a database is requested.
3. No auth initially.
4. Consistent error body: `{ error: string }` or `{ error, details: [{ field, message }] }`.
5. Status codes: `200`, `201`, `400`, `404`, `429` (if rate limiting added), `500` for unexpected errors.

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

## Ticket model

Allowed enum values (reject anything else on write/import unless overridden by classification):

| Field | Values / rules |
|-------|----------------|
| `id` | UUID — **server-generated** on create; ignore or overwrite client `id` |
| `customer_id` | non-empty string |
| `customer_email` | valid email format |
| `customer_name` | non-empty string |
| `subject` | string, 1–200 chars |
| `description` | string, 10–2000 chars |
| `category` | `account_access`, `technical_issue`, `billing_question`, `feature_request`, `bug_report`, `other` |
| `priority` | `urgent`, `high`, `medium`, `low` |
| `status` | `new`, `in_progress`, `waiting_customer`, `resolved`, `closed` |
| `created_at`, `updated_at` | ISO datetime — **server-generated** on create; bump `updated_at` on update |
| `resolved_at` | ISO datetime or `null` |
| `assigned_to` | string or `null` |
| `tags` | array of strings (default `[]`) |
| `metadata.source` | `web_form`, `email`, `api`, `chat`, `phone` |
| `metadata.browser` | string |
| `metadata.device_type` | `desktop`, `mobile`, `tablet` |

**N.B.** On `POST /tickets`, set sensible defaults: e.g. `status: "new"`, `priority: "medium"`, `category: "other"` if omitted, then validate. Document behavior in API docs.

Example create request (client may omit server fields):

```json
{
  "customer_id": "cust_42",
  "customer_email": "user@example.com",
  "customer_name": "Jane Doe",
  "subject": "Cannot log in after password reset",
  "description": "I reset my password but still get invalid credentials on the web app.",
  "metadata": {
    "source": "web_form",
    "browser": "Chrome",
    "device_type": "desktop"
  }
}
```

## `POST /tickets` — optional auto-classify

Support optional auto-classification on create, e.g. query `?auto_classify=true` or body flag `auto_classify: true`.

1. Create and validate ticket first.
2. If flag set, run classifier on `subject` + `description` (and optionally tags).
3. Apply `category` and `priority` from classifier; store confidence on the ticket.
4. Log the decision (see Classification).

**N.B.** Manual `PUT` may override `category` / `priority`; preserve or replace `classification_confidence` per your documented rules.

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
6. Partial success → `201` with summary above (unless `TASKS spec.md` is updated to specify another code).

## `GET /tickets` — filtering

Support query filters as applicable (implement at least):

1. `status`
2. `category`
3. `priority`
4. `customer_id` or `customer_email` (at least one identifier filter)

Combine filters with AND semantics. Empty list → `200` + `[]`.

## Auto-classification (Task 2)

**Categories** (keyword / phrase matching on `subject` + `description`, case-insensitive):

| Category | Typical signals |
|----------|-----------------|
| `account_access` | login, password, 2FA, access, credentials |
| `technical_issue` | error, crash, bug, broken, not working |
| `billing_question` | payment, invoice, refund, charge, billing |
| `feature_request` | feature, enhancement, suggestion, request |
| `bug_report` | reproduce, steps, defect, regression |
| `other` | no strong match |

**Priority** (first match wins or highest severity wins — document choice):

| Priority | Trigger phrases (substring match) |
|----------|-----------------------------------|
| `urgent` | can't access, critical, production down, security |
| `high` | important, blocking, asap |
| `low` | minor, cosmetic, suggestion |
| `medium` | default when no other rule matches |

**`POST /tickets/:id/auto-classify` response:**

```json
{
  "category": "account_access",
  "priority": "urgent",
  "confidence": 0.85,
  "reasoning": "Matched keywords: can't access, login",
  "keywords_found": ["can't access", "login"]
}
```

Persist on ticket (suggested fields): `classification_confidence` (0–1), optional `classification_reasoning`, `classification_keywords`.

**Decision log** — append-only in memory (array or ring buffer): ticket id, timestamp, previous vs new category/priority, confidence, trigger (`create`, `auto-classify`, `import`).

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
    routes/tickets.ts
    import/              # csv.ts, json.ts, xml.ts
    classify.ts
    validation.ts
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
