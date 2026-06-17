# 🎧 Homework 2: Intelligent Customer Support System

## 📋 Overview

Build a customer support ticket management system that imports tickets from multiple file formats, automatically categorizes issues, and assigns priorities.

---

## 🛠️ Requirements

**Tech Stack:** 
- Node.js
- Hono
- Vitest

---

## 📝 Tasks

### Task 1: Multi-Format Ticket Import API ✅

Create a REST API for support tickets with these endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tickets` | Create a new support ticket |
| `POST` | `/tickets/import` | Bulk import from CSV/JSON/XML |
| `GET` | `/tickets` | List tickets (with filtering) |
| `GET` | `/tickets/:id` | Get specific ticket |
| `PUT` | `/tickets/:id` | Partial update ticket |
| `DELETE` | `/tickets/:id` | Delete ticket |

**Storage:** in-memory store (`createStore()`), injected into `createApp(store)`.

**Ticket Model:**
```json
{
  "id": "UUID (server-generated)",
  "customer_id": "string",
  "customer_email": "email",
  "customer_name": "string",
  "subject": "string (1-200 chars)",
  "description": "string (10-2000 chars when provided; default \"\")",
  "category": "account_access | technical_issue | billing_question | feature_request | bug_report | other",
  "priority": "urgent | high | medium | low",
  "status": "new | in_progress | waiting_customer | resolved | closed",
  "created_at": "ISO datetime (server-generated)",
  "updated_at": "ISO datetime (server-generated; bumped on update)",
  "resolved_at": "ISO datetime or null (optional)",
  "assigned_to": "string or null (optional)",
  "tags": ["array of strings (optional; default [])"],
  "metadata": {
    "source": "web_form | email | api | chat | phone (optional)",
    "browser": "string (optional)",
    "device_type": "desktop | mobile | tablet (optional)"
  }
}
```

**Field rules (create & import rows):**

| Required | Optional |
|----------|----------|
| `customer_id`, `customer_email`, `customer_name`, `subject`, `category`, `priority`, `status` | `description`, `resolved_at`, `assigned_to`, `tags`, `metadata` (all subfields optional) |
| Server sets: `id`, `created_at`, `updated_at` | Client `id` / timestamps on create are ignored |

**`POST /tickets`**

- `201` — created ticket JSON body.
- Validation errors → `400` with `{ "error": "Validation failed", "details": [{ "field", "message" }] }` (same style as Homework 1).

**`GET /tickets`**

- `200` — `{ "tickets": [ ... ] }` (empty array when no matches).
- Query filters (AND semantics): `customer_id`, `customer_email`, `customer_name`, `category`, `priority`, `status`, `tags` (comma-separated; ticket must include **all** listed tags), `assigned_to`.
- Invalid filter values → `400` with validation `details`.

**`GET /tickets/:id`**

- `200` — ticket object.
- `404` — `{ "error": "Ticket not found" }`.

**`PUT /tickets/:id`**

- **Partial update** — only fields present in the body are changed; `updated_at` is refreshed; `id` and `created_at` are never changed from the client.
- `metadata` patches merge with existing metadata (per-field).
- `200` — updated ticket; `404` if missing; `400` on validation errors.

**`DELETE /tickets/:id`**

- `204` — no body on success.
- `404` — `{ "error": "Ticket not found" }`.

**`POST /tickets/import`**

- Accept multipart (`file` field) or raw body; detect format via query `?format=csv|json|xml`, `Content-Type`, or file extension.
- **JSON:** array of ticket objects, or `{ "tickets": [ ... ] }`.
- **CSV:** header row; column names match field names; `metadata.*` columns nest into `metadata`; `tags` as `;` or `|` separated.
- **XML:** `<tickets><ticket>...</ticket></tickets>` with scalar child elements per field.
- Per-row validation (same required fields as create); unreadable file → `400` `{ "error": "..." }`.
- `201` — summary (even when some rows fail):

```json
{
  "total": 50,
  "successful": 48,
  "failed": 2,
  "errors": [{ "row": 3, "message": "customer_email: Invalid email format" }]
}
```

**Requirements:**

- Parse CSV, JSON, and XML in dedicated modules under `src/import/`.
- Validate email format, string lengths, enums.
- Errors aligned with Homework 1 (`error` + optional `details`).
- Status codes: `200`, `201`, `204`, `400`, `404`, `500`.

**Tests (Task 1 minimum):** `test/ticket-api.test.ts` (11 tests) — implemented.

---

### Task 2: Auto-Classification

Keyword-based categorization and priority assignment on `subject` + `description` (+ `tags`). Case-insensitive substring matching. No external LLM.

**Endpoint:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tickets/:id/auto-classify` | Classify existing ticket; `200` + **full updated ticket**; `404` if missing |

**Optional auto-classify triggers:**

1. `POST /tickets?auto_classify=true` or body `"auto_classify": true`
2. `POST /tickets/import?auto_classify=true` or multipart field `auto_classify=true`

When enabled, validate the ticket first, then **overwrite** `category` and `priority` with classifier output.

**Categories & keyword vocabulary** (highest keyword-hit count wins; tie → first in order below):

| Category | Meaning | Example keywords |
|----------|---------|------------------|
| `account_access` | Login / credentials | login, password, 2fa, locked out, credentials |
| `bug_report` | Process-breaking — broke / stopped | bug, broke, broken, crash, stopped, reproduce, regression |
| `technical_issue` | Non-critical / minor | issue, glitch, slow, intermittent, timeout, degraded |
| `billing_question` | Payments | payment, invoice, refund, billing, subscription |
| `feature_request` | Enhancements | feature, enhancement, suggestion, would like |
| `other` | No strong match | (default) |

**Priority rules** — substring match; **highest severity wins** (not first-in-text):

| Priority | Phrases |
|----------|---------|
| `urgent` | can't access, critical, production down, security |
| `high` | important, blocking, asap |
| `low` | minor, cosmetic, suggestion |
| `medium` | default when no phrase matches |

**Confidence** (stored as `classification_confidence`, 0–1):

| Score | Meaning |
|-------|---------|
| `0.95` | Very confident |
| `0.60` | Somewhat confident; could be wrong |
| `0.30` | Low confidence; likely needs human review |

Computed from keyword-hit strength (see `src/classify.ts` → `computeConfidence`).

**Ticket fields added by classification:**

| Field | Type |
|-------|------|
| `classification_confidence` | `number \| null` |
| `classification_reasoning` | `string \| null` (free text) |
| `classification_keywords` | `string[]` (matched phrases; API name `keywords_found` in classifier output maps here) |

**`POST /tickets/:id/auto-classify` response:** `200` — full updated ticket JSON including classification fields above.

**Manual override:** `PUT /tickets/:id` with `category` and/or `priority` **replaces** classification metadata (`classification_confidence` → `null`, reasoning cleared, keywords cleared).

**Decision log:** append-only in-memory log on the store (`logClassification` / `getClassificationLog`); each entry records ticket id, timestamp, trigger (`create`, `auto-classify`, `import`), previous vs new category/priority, confidence, `keywords_found`, reasoning.

**Requirements:**

- Auto-run on create/import when `auto_classify` flag set
- Store classification fields on the ticket
- Allow manual override via `PUT`
- Log all classification decisions

**Tests (Task 2 minimum):** `test/categorization.test.ts` (10+ tests) — implemented.

---

### Task 3: AI-Generated Test Suite

Generate comprehensive tests achieving **>85% code coverage**.

**Clarifications (agreed):**

1. **Integration / performance** — `test/integration.test.ts` and `test/performance.test.ts` are **stubbed** (`it.todo`) until Task 5; one light performance smoke test may run in Task 3.
2. **Performance criteria** — assert correctness under load; log timings optionally; no hard SLA thresholds in Task 3.
3. **`test/ticket-model.test.ts`** — unit tests for `validation.ts` (and related helpers), separate from API-level validation in `test/ticket-api.test.ts`.
4. **`test/import-*.test.ts`** — exercise parser modules (`src/import/csv.ts`, `json.ts`, `xml.ts`) directly, not only HTTP import endpoints.
5. **Invalid fixtures** — small set under `test/fixtures/` (malformed + invalid-row files).
6. **Coverage** — Vitest `@vitest/coverage-v8`; `npm run test:coverage`; exclude `src/server.ts`; screenshot → `docs/screenshots/test_coverage.png`.

**Required Test Files:**

```
test/
├── ticket-api.test.ts       # API endpoints (11 tests) — Task 1
├── ticket-model.test.ts     # Data validation (9 tests)
├── import-csv.test.ts       # CSV parsing (6 tests)
├── import-json.test.ts      # JSON parsing (5 tests)
├── import-xml.test.ts       # XML parsing (5 tests)
├── categorization.test.ts   # Classification (10 tests) — Task 2
├── integration.test.ts      # End-to-end workflows (5 tests; stub → Task 5)
├── performance.test.ts        # Benchmarks (5 tests; stub → Task 5)
└── fixtures/                # Sample + invalid data for tests
```

**Sample data (homework-2 root):**

- `sample_tickets.csv` (50 tickets)
- `sample_tickets.json` (20 tickets)
- `sample_tickets.xml` (30 tickets)
- Invalid data files for negative tests → `test/fixtures/`

**Test Coverage Requirements:**

- Overall: **>85%** (`npm run test:coverage`)

---

### Task 4: Multi-Level Documentation

Generate 5 documentation files for different audiences:

**1. README.md** (Developers)
- Project overview and features
- Architecture diagram (Mermaid)
- Installation and setup instructions
- How to run tests
- Project structure

**2. API_REFERENCE.md** (API Consumers)
- All endpoints with request/response examples
- Data models and schemas
- Error response formats
- cURL examples for each endpoint

**3. ARCHITECTURE.md** (Technical Leads)
- High-level architecture diagram (Mermaid)
- Component descriptions
- Data flow diagrams (Mermaid sequence diagrams)
- Design decisions and trade-offs
- Security and performance considerations

**4. TESTING_GUIDE.md** (QA Engineers)
- Test pyramid diagram (Mermaid)
- How to run tests
- Sample test data locations
- Manual testing checklist
- Performance benchmarks table

**Requirements:**
- Use different AI models for different doc types
- Include at least 3 Mermaid diagrams across documents

---

### Task 5: Integration & Performance Tests

Implement end-to-end tests.

**Integration Tests:**
- Complete ticket lifecycle workflow
- Bulk import with auto-classification verification
- Concurrent operations (20+ simultaneous requests)
- Combined filtering by category and priority

