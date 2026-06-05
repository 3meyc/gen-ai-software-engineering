# Service: audit (`SVC-AUD`)

> Append-only, immutable audit log for security and compliance (`MO-7`, `MO-8`). Port **3006**. Database: **`audit_mvp`**.

---

## 1. Purpose and owned aggregates

| Aggregate | Collection | Description |
|-----------|------------|-------------|
| Audit event | `audit_events` | Immutable records; no updates/deletes in application layer |

**Writers:** `SVC-BANK`, `SVC-LED`, `SVC-BUD`, `SVC-EXP`, `SVC-ID` (via internal POST). **Readers:** `SVC-BFF` (ops), superadmin.

**Primary MOs:** `MO-7`, `MO-8`.

---

## 2. Beginning context

```text
services/audit/
  src/main.ts
```

* Empty `audit_mvp`

---

## 3. Ending context

```text
services/audit/
  src/events/
    audit-event.schema.ts
    append.handler.ts          # insert-only
  src/query/
    ops-query.handler.ts       # MO-8 filters
```

**Indexes:**

| Collection | Index |
|------------|-------|
| `audit_events` | `{ event_id: 1 }` unique |
| `audit_events` | `{ household_id: 1, timestamp: -1 }` |
| `audit_events` | `{ event_type: 1, timestamp: -1 }` |
| `audit_events` | `{ actor_user_id: 1, timestamp: -1 }` |

**Retention:** 7 years per [`compliance-ukraine.md`](../compliance/compliance-ukraine.md); archive tier Phase 2.

---

## 4. MongoDB database

**`audit_mvp`** on shared cluster.

---

## 5. REST endpoints

### BFF-proxied (ops)

| Method | Path | Roles | Action |
|--------|------|-------|--------|
| GET | `/ops/audit/events` | superadmin, ops | Query with filters: `household_id`, `event_type`, `from`, `to`, cursor |

Read-only; no mutation endpoints on public API.

### Internal (append-only)

| Method | Path | Caller | Action |
|--------|------|--------|--------|
| POST | `/internal/audit/events` | all `SVC-*` writers | Append one event |

**Event schema (minimum):**

| Field | Type | Notes |
|-------|------|-------|
| `event_id` | string | UUID |
| `event_type` | string | e.g. `import.confirmed`, `export.denied` |
| `household_id` | string | Optional for platform ops |
| `actor_user_id` | string | Nullable for system |
| `actor_role` | string | From JWT |
| `resource_type` | string | `preview`, `transaction`, `export_job`, … |
| `resource_id` | string | |
| `payload` | object | **No secrets**, no PAN, no tokens |
| `timestamp` | datetime | UTC |

**Standard event types (MVP):**

| event_type | Source service |
|------------|----------------|
| `bank.connected` | BANK |
| `bank.disconnected` | BANK |
| `import.previewed` | BANK |
| `import.confirmed` | BANK |
| `transaction.created` | LED |
| `transaction.updated` | LED |
| `duplicate.skipped` | LED |
| `budget.limit.changed` | BUD |
| `export.requested` | EXP |
| `export.completed` | EXP |
| `export.denied` | EXP / BFF |
| `pet.profile.viewed` | BFF / WEB — demo only; Barsik (`usr_mars_cat`) dashboard telemetry; **not in MVP test DoD** |
| `erasure.requested` | ID |
| `erasure.completed` | ID |

---

## 6. Callers and callees

| Callers | Callees |
|---------|---------|
| All services (internal POST) | None |
| `SVC-BFF` | Read ops API |

---

## 7. Verification hooks

| Test | Proves |
|------|--------|
| POST append twice with same `event_id` → second rejected | Idempotency optional |
| No PATCH/DELETE routes exist | Immutability |
| Payload with token string fails validation | MO-7 |
| Ops query returns import.confirm for household | MO-8 |
| Confirm import generates `import.confirmed` + ledger events | End-to-end trace |
| `export.denied` recorded for viewer attempt | Edge case |

---

## 8. Phase 2 touchpoints

Audit event types for `PH2-OCR.confirm`, `PH2-FILE.import` — append same handler; **no MVP implementation**. Fictional `PH2-PET` (pet allowance / interspecies banking) — see [`../phase2/roadmap.md`](../phase2/roadmap.md); joke row only.

---

## 9. Persistence schema (Mongoose)

Database: **`audit_mvp`**. **Append-only** — no application-layer UPDATE/DELETE on `audit_events`. Retention 7 years (assumed). Indexes in §3.

### `audit_events`

| Field | BSON type | Required | Constraints | Notes |
|-------|-----------|----------|-------------|-------|
| `event_id` | string | yes | unique, UUID | Optional idempotent reject on duplicate |
| `event_type` | string | yes | indexed | See §5 standard types |
| `household_id` | string | no | indexed | Nullable for platform ops |
| `actor_user_id` | string | no | indexed | Nullable for system |
| `actor_role` | string | no | enum | `superadmin` on mother confirm |
| `resource_type` | string | no | — | preview, transaction, export_job, … |
| `resource_id` | string | no | — | |
| `payload` | object | no | **no secrets** | No tokens, PAN, full CSV |
| `timestamp` | Date | yes | indexed desc | UTC |
| `request_id` | string | no | — | From `X-Request-Id` |

**Payload prohibitions:** OAuth tokens, refresh tokens, full PAN, unmasked account numbers, raw JWT strings, full CSV row dumps.

**Standard `event_type` values (MVP):** `bank.connected`, `bank.disconnected`, `import.previewed`, `import.confirmed`, `transaction.created`, `transaction.updated`, `duplicate.skipped`, `budget.limit.changed`, `export.requested`, `export.completed`, `export.denied`, `erasure.requested`, `erasure.completed`, `token.revoked`, `import.aborted`.

**Demo-only (optional telemetry, not in §13 DoD):** `pet.profile.viewed` — e.g. when `usr_mars_cat` (Barsik) loads a read-only dashboard tile.

OpenAPI append body: [`../api/openapi/components/schemas.yaml`](../api/openapi/components/schemas.yaml) (`AuditEventAppend`).

---

## Related documents

- [`../compliance-ukraine.md`](../compliance-ukraine.md)
- [`../domain/deduplication-reconciliation-specification.md`](../domain/deduplication-reconciliation-specification.md) — reconcile audit fields

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §4 Non-functional | Audit retention |
| §11 Verification | Ops audit query checks |
| §13 Low-level tasks | `TASK-AUD-*` |

**See also:** [`specification.md`](../../specification.md) — §4, §11, §13 (table above).
