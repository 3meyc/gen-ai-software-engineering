# Service: export (`SVC-EXP`)

> Async **CSV** export jobs, column manifest, role-based redaction, download URLs. Port **3005**. Database: **`export_mvp`**.

---

## 1. Purpose and owned aggregates

| Aggregate | Collection | Description |
|-----------|------------|-------------|
| Export job | `export_jobs` | Status, requester, filters, row count |
| Export artifact | `export_artifacts` | Stored CSV blob or object storage key (doc assumption) |

**Primary MOs:** `MO-6`, `MO-7` (audit), `MO-4` (viewer denied).

---

## 2. Beginning context

```text
services/export/
  src/main.ts
```

* No job queue, no ledger client

---

## 3. Ending context

```text
services/export/
  src/jobs/
    create-export.handler.ts
    csv-generator.worker.ts
  src/redaction/
    column-manifest.ts       # from sample-export-manifest.json
  src/download/
```

**Indexes:**

| Collection | Index |
|------------|-------|
| `export_jobs` | `{ export_job_id: 1 }` unique |
| `export_jobs` | `{ household_id: 1, created_at: -1 }` |
| `export_jobs` | `{ status: 1, created_at: 1 }` (worker poll) |

**Fixture reference:** [`../../mocks/sample-export-manifest.json`](../../mocks/sample-export-manifest.json).

---

## 4. MongoDB database

**`export_mvp`** on shared cluster.

---

## 5. REST endpoints

### BFF-proxied (`/api/v1`)

| Method | Path | Roles | Action |
|--------|------|-------|--------|
| POST | `/households/{householdId}/exports` | admin, superadmin, user | Create job (`format=csv` only) |
| GET | `/households/{householdId}/exports/{exportJobId}` | same as create | Status: `queued`, `processing`, `completed`, `failed` |
| GET | `/households/{householdId}/exports/{exportJobId}/download` | same as create | Stream CSV when completed |

**Viewer → `403` at BFF** (not routed).

Request body (example):

```json
{
  "format": "csv",
  "date_from": "2026-06-01",
  "date_to": "2026-06-30",
  "status": "booked"
}
```

### Internal

| Method | Path | Caller | Action |
|--------|------|--------|--------|
| POST | `/internal/audit/events` | self → AUD | export.requested, completed, denied |

### Downstream read

| Caller | Target | Action |
|--------|--------|--------|
| Worker | `SVC-LED` | Paginated `GET /internal/transactions` (max 50k rows) |

Redaction per role in manifest: admin full household; user omits PII columns and scopes rows to `attributed_user_id`.

---

## 6. Callers and callees

| Callers | Callees |
|---------|---------|
| `SVC-BFF` | `SVC-LED`, `SVC-AUD`, `SVC-ID` |

---

## 7. Verification hooks

| Test | Proves |
|------|--------|
| Viewer denied at BFF | MO-4 / MO-6 |
| User export excludes father's txns | Row scope |
| User CSV omits `attributed_user_id` column | Redaction manifest |
| Job > 50k rows → `400` or split policy | SLO |
| Completed job emits audit `export.completed` | MO-7 |
| Only `format=csv` accepted | MVP scope |
| Export during active sync still consistent (snapshot time) | Edge case |

---

## 8. Phase 2 touchpoints

**None in MVP** (CSV only). Future: additional formats not in `export_jobs.format` enum.

---

## Related documents

- [`../../mocks/sample-export-manifest.json`](../../mocks/sample-export-manifest.json)
- [`../domain/household-rbac.md`](../domain/household-rbac.md)
- [`ledger.md`](ledger.md)

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §6 / export policy | CSV-only |
| §10 Edge cases | Export during sync |
| §13 Low-level tasks | `TASK-EXP-*` |

**See also:** [`specification.md`](../../specification.md) — §6, §10, §13 (table above).
