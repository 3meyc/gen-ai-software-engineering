# API Reference — Customer Support Ticket API

Base URL: `http://localhost:3000` (override with `PORT` env var).

All JSON responses use `Content-Type: application/json` unless noted.

---

## Data Model: Ticket

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "cust_001",
  "customer_email": "user@example.com",
  "customer_name": "Jane Doe",
  "subject": "Cannot log in to my account",
  "description": "Password reset link expired after 24 hours.",
  "category": "account_access",
  "priority": "urgent",
  "status": "new",
  "created_at": "2026-06-17T10:00:00.000Z",
  "updated_at": "2026-06-17T10:00:00.000Z",
  "resolved_at": null,
  "assigned_to": null,
  "tags": ["login", "urgent"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome",
    "device_type": "desktop"
  },
  "classification_confidence": 0.95,
  "classification_reasoning": "Matched category \"account_access\" (login, password); priority \"urgent\" (can't access)",
  "classification_keywords": ["login", "password", "can't access"]
}
```

### Enums

| Field | Allowed values |
|-------|----------------|
| `category` | `account_access`, `technical_issue`, `billing_question`, `feature_request`, `bug_report`, `other` |
| `priority` | `urgent`, `high`, `medium`, `low` |
| `status` | `new`, `in_progress`, `waiting_customer`, `resolved`, `closed` |
| `metadata.source` | `web_form`, `email`, `api`, `chat`, `phone` |
| `metadata.device_type` | `desktop`, `mobile`, `tablet` |

### Field rules (create & import)

| Required | Optional |
|----------|----------|
| `customer_id`, `customer_email`, `customer_name`, `subject`, `category`, `priority`, `status` | `description` (10–2000 chars when provided; default `""`), `resolved_at`, `assigned_to`, `tags`, `metadata` |

Server-set on create: `id`, `created_at`, `updated_at`, `classification_*` (null/empty until classified).

---

## Error Responses

### Simple error

```json
{ "error": "Ticket not found" }
```

### Validation error

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "customer_email", "message": "Invalid email format" }
  ]
}
```

### HTTP status codes

| Code | When |
|------|------|
| `200` | Successful GET, PUT, auto-classify |
| `201` | Ticket created or import summary |
| `204` | Ticket deleted (no body) |
| `400` | Validation / malformed body / unreadable import |
| `404` | Ticket not found |
| `500` | Unhandled server error (`app.onError` in `app.ts`) |

---

## Endpoints

### `POST /tickets` — Create ticket

**Query:** `?auto_classify=true` (optional) — run classifier after validation; overwrites `category` and `priority`.

**Body:** Ticket fields (required columns above).

**Response `201`:** Full ticket JSON.

```bash
curl -s -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_001",
    "customer_email": "user@example.com",
    "customer_name": "Jane Doe",
    "subject": "Login password locked out",
    "description": "I cannot access my account after password reset.",
    "category": "other",
    "priority": "medium",
    "status": "new",
    "tags": ["login"]
  }'
```

With auto-classify:

```bash
curl -s -X POST "http://localhost:3000/tickets?auto_classify=true" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_001",
    "customer_email": "user@example.com",
    "customer_name": "Jane Doe",
    "subject": "Login password locked out",
    "description": "Critical production down for my team.",
    "category": "other",
    "priority": "medium",
    "status": "new"
  }'
```

---

### `GET /tickets` — List tickets

**Query filters** (AND semantics): `customer_id`, `customer_email`, `customer_name`, `category`, `priority`, `status`, `assigned_to`, `tags` (comma-separated; ticket must include **all** listed tags).

**Response `200`:**

```json
{ "tickets": [ /* ... */ ] }
```

```bash
curl -s "http://localhost:3000/tickets?category=bug_report&priority=urgent&tags=prod,outage"
```

---

### `GET /tickets/:id` — Get one ticket

**Response `200`:** Ticket object.  
**Response `404`:** `{ "error": "Ticket not found" }`

```bash
curl -s http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### `PUT /tickets/:id` — Partial update

Only fields present in the body are updated. `id` and `created_at` are never changed. `updated_at` is refreshed. `metadata` patches merge with existing values.

If `category` and/or `priority` are sent, classification metadata is cleared (`classification_confidence` → `null`, reasoning and keywords cleared).

**Response `200`:** Updated ticket.

```bash
curl -s -X PUT http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assigned_to": "agent-42",
    "metadata": { "source": "email" }
  }'
```

---

### `DELETE /tickets/:id` — Delete ticket

**Response `204`:** Empty body on success.  
**Response `404`:** Not found.

```bash
curl -s -o /dev/null -w "%{http_code}" -X DELETE \
  http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### `POST /tickets/import` — Bulk import

Accepts:

1. **Raw body** with `Content-Type` and/or `?format=csv|json|xml`
2. **Multipart** form with `file` field; optional `format`, `auto_classify=true`

**Format detection order:** query `format` → `Content-Type` → file extension.

| Format | Structure |
|--------|-----------|
| JSON | Array of tickets, or `{ "tickets": [ ... ] }` |
| CSV | Header row; `metadata.*` columns nest into `metadata`; `tags` as `;` or `\|` separated |
| XML | `<tickets><ticket>...</ticket></tickets>` with scalar child elements |

**Query:** `?auto_classify=true` or multipart field `auto_classify=true`.

**Response `201`** (always returned when file parses, even with row failures):

```json
{
  "total": 50,
  "successful": 48,
  "failed": 2,
  "errors": [
    { "row": 3, "message": "customer_email: Invalid email format" }
  ]
}
```

CSV import:

```bash
curl -s -X POST "http://localhost:3000/tickets/import?format=csv" \
  -H "Content-Type: text/csv" \
  --data-binary @sample_tickets.csv
```

JSON import with auto-classify:

```bash
curl -s -X POST "http://localhost:3000/tickets/import?format=json&auto_classify=true" \
  -H "Content-Type: application/json" \
  --data-binary @sample_tickets.json
```

Multipart upload:

```bash
curl -s -X POST http://localhost:3000/tickets/import \
  -F "file=@sample_tickets.xml" \
  -F "auto_classify=true"
```

---

### `POST /tickets/:id/auto-classify` — Classify existing ticket

Runs keyword classifier on `subject` + `description` + `tags`. Overwrites `category`, `priority`, and classification fields. Appends entry to in-memory decision log.

**Response `200`:** Full updated ticket.  
**Response `404`:** Not found.

```bash
curl -s -X POST http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000/auto-classify
```

### Classification output fields

| Field | Description |
|-------|-------------|
| `classification_confidence` | `0.95` (strong), `0.60` (moderate), `0.30` (weak) |
| `classification_reasoning` | Human-readable match summary |
| `classification_keywords` | Matched keyword phrases |

**Category tie-break:** highest keyword-hit count wins; tie → first category in spec order.  
**Priority:** highest severity phrase wins (`urgent` > `high` > `low` > default `medium`).

---

## Import format examples

### JSON (minimal)

```json
[
  {
    "customer_id": "cust_001",
    "customer_email": "user1@example.com",
    "customer_name": "Customer 1",
    "subject": "Support request #1",
    "description": "Detailed description with enough characters.",
    "category": "account_access",
    "priority": "urgent",
    "status": "new"
  }
]
```

### CSV header (excerpt)

```csv
customer_id,customer_email,customer_name,subject,description,category,priority,status,tags,metadata.source
cust_001,user@example.com,Jane,Subject text,Description text here,other,medium,new,tag1;tag2,web_form
```

---

*Documentation generated with: **Claude***
