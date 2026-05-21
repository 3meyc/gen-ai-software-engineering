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

Implement automatic ticket categorization and priority assignment.

**Categories:**
- `account_access` - login, password, 2FA issues
- `technical_issue` - bugs, errors, crashes
- `billing_question` - payments, invoices, refunds
- `feature_request` - enhancements, suggestions
- `bug_report` - defects with reproduction steps
- `other` - uncategorizable

**Priority Rules:**
- **Urgent**: "can't access", "critical", "production down", "security"
- **High**: "important", "blocking", "asap"
- **Medium**: default
- **Low**: "minor", "cosmetic", "suggestion"

**Endpoint:**
```
POST /tickets/:id/auto-classify
```

**Response includes:** category, priority, confidence score (0-1), reasoning, keywords found

**Requirements:**
- Auto-run on ticket creation (optional flag)
- Store classification confidence
- Allow manual override
- Log all decisions

---

### Task 3: AI-Generated Test Suite

Generate comprehensive tests achieving **>85% code coverage**.

**Required Test Files:**

```
tests/
├── test_ticket_api          # API endpoints (11 tests)
├── test_ticket_model        # Data validation (9 tests)
├── test_import_csv          # CSV parsing (6 tests)
├── test_import_json         # JSON parsing (5 tests)
├── test_import_xml          # XML parsing (5 tests)
├── test_categorization      # Classification (10 tests)
├── test_integration         # End-to-end workflows (5 tests)
├── test_performance         # Benchmarks (5 tests)
└── fixtures/                # Sample data files
```

**Sample data**
Generate sample data files
- `sample_tickets.csv` (50 tickets)
- `sample_tickets.json` (20 tickets)
- `sample_tickets.xml` (30 tickets)
- Invalid data files for negative tests

**Test Coverage Requirements:**
- Overall: >85%

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

