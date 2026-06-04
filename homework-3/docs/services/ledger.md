# Service: ledger (`SVC-LED`)

> **Sole writer** of canonical `transactions` in **`ledger_mvp`**. Dedup/reconcile on apply. Booked-only reads for budget and export. Port **3003**.

---

## 1. Purpose and owned aggregates

| Aggregate | Collection | Description |
|-----------|------------|-------------|
| Transaction | `transactions` | Canonical model per [`canonical-banking-transaction-model.md`](../canonical-banking-transaction-model.md) |
| Import batch | `import_batches` | Applied preview metadata, counts, actor |
| Dedup fingerprint | `dedup_fingerprints` | Fallback keys when `source_transaction_id` missing |

**Primary MOs:** `MO-3`, `MO-4` (read filters), supports `MO-5`, `MO-6`.

**Invariant:** No other service inserts/updates/deletes `ledger_mvp.transactions`.

---

## 2. Beginning context

```text
services/ledger/
  src/main.ts
  src/transactions/      # empty module
```

* Empty `ledger_mvp`  
* Dedup rules documented but not coded

---

## 3. Ending context

```text
services/ledger/
  src/transactions/
    transaction.schema.ts
    transaction.repository.ts
  src/imports/
    apply-import.handler.ts    # POST internal apply
  src/dedup/
    reconciliation.engine.ts   # per dedup spec
  src/queries/
    list-booked.handler.ts
```

**Indexes:**

| Collection | Index |
|------------|-------|
| `transactions` | `{ source_system: 1, source_transaction_id: 1 }` unique |
| `transactions` | `{ household_id: 1, booking_timestamp: -1 }` |
| `transactions` | `{ household_id: 1, attributed_user_id: 1, status: 1 }` |
| `transactions` | `{ household_id: 1, status: 1, booking_timestamp: -1 }` |
| `dedup_fingerprints` | `{ fingerprint: 1 }` unique |

**Fixture alignment:** [`../../mocks/sample-transactions.json`](../../mocks/sample-transactions.json).

---

## 4. MongoDB database

**`ledger_mvp`** on shared cluster.

---

## 5. REST endpoints

### BFF-proxied (`/api/v1`)

| Method | Path | Roles | Action |
|--------|------|-------|--------|
| GET | `/households/{householdId}/transactions` | member | List **booked** (default); cursor pagination; RBAC filter |

Query params: `status=booked` (default), `from`, `to`, `user_id` (admin optional), `cursor`, `limit` (max 200).

### Internal (service token only)

| Method | Path | Caller | Action |
|--------|------|--------|--------|
| POST | `/internal/imports/{previewId}/apply` | `SVC-BANK` | Reconcile + upsert; return summary counts |
| GET | `/internal/transactions` | `SVC-BUD`, `SVC-EXP` | Bulk fetch for rollups / CSV |
| GET | `/internal/transactions/{transactionId}` | BFF (optional) | Single txn |
| POST | `/internal/audit/events` | self → AUD | create, update, duplicate.skipped |

**Apply response (MO-3):**

```json
{
  "created": 148,
  "updated": 12,
  "duplicate_skipped": 94,
  "review_required": 0
}
```

---

## 6. Callers and callees

| Callers | Callees |
|---------|---------|
| `SVC-BFF`, `SVC-BANK`, `SVC-BUD`, `SVC-EXP` | `SVC-AUD` |

---

## 7. Verification hooks

| Test | Proves |
|------|--------|
| Duplicate `(source_system, source_transaction_id)` → update not insert | Level 1 dedup |
| Pending preview rows never in `transactions` until apply | MO-2 / MO-3 |
| `GET` with `status=pending` returns empty for BFF public route | Booked-only consumer contract |
| Budget service query returns only `status=booked` | MO-5 |
| Apply idempotent on same `previewId` | Idempotent import |
| User role filter excludes other members' txns | MO-4 |
| Reversal updates existing row status | Lifecycle |

---

## 8. Phase 2 touchpoints

| ID | Touchpoint |
|----|------------|
| `PH2-XDEDUP` | Cross-source merge engine extension |
| `PH2-OCR`, `PH2-CASH`, `PH2-FILE` | New `source_kind` writes through same apply handler |

MVP: bank-only dedup per [`deduplication-reconciliation-specification.md`](../deduplication-reconciliation-specification.md) — **no receipt-vs-bank merge**.

---

## Related documents

- [`../canonical-banking-transaction-model.md`](../canonical-banking-transaction-model.md)
- [`../deduplication-reconciliation-specification.md`](../deduplication-reconciliation-specification.md)

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §8 Canonical model and dedup | Ledger ownership |
| §5 Implementation notes | Sole writer rule |
| §13 Low-level tasks | `TASK-LED-*` |

*Final synthesis in Phase 4 — see `specification.md` when published.*
