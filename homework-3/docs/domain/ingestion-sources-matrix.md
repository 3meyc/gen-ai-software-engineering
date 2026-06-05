# Ingestion Sources Matrix

> Maps every transaction source to trust, validation, idempotency, and confirmation policy. IDs align with [`scope-and-traceability.md`](../registry/scope-and-traceability.md).

## Overview

The household budget platform ingests financial events through a common pipeline: **authenticate → fetch/preview → user confirmation (where required) → normalize → deduplicate → ledger write (`SVC-LED`)**. MVP implements **bank API** sources only; Phase 2 rows are specified here for traceability but marked **deferred**.

---

## Matrix

| Source ID | Source | MVP | Trust | Validation | Idempotency key | Confirmation | Owner service |
|-----------|--------|-----|-------|------------|-----------------|--------------|---------------|
| `mono` | Mono Bank API | **Yes** | High | Schema + `BankProvider` mapping; OAuth token scope | `(source_system, source_transaction_id)` | Admin/superadmin confirm import batch (`MO-2`) | `SVC-BANK` |
| `otp` | OTP Bank API | **Yes** | High | Same | Same | Same | `SVC-BANK` |
| `privat24` | Privat24 API | **Yes** | High | Same | Same | Same | `SVC-BANK` |
| `PH2-FILE` | Bank export file (CSV/XLSX) | **Deferred** | Medium | File signature, column mapping, row hash | Row fingerprint + file `import_id` | Always confirm; show row count + sample | `SVC-BANK` (future) |
| `PH2-OCR` | Receipt image OCR | **Deferred** | Low | OCR confidence thresholds; manual field edit | OCR job id + content hash | **Always confirm** (policy locked) | `SVC-BANK` (future) |
| `PH2-CASH` | Manual cash entry | **Deferred** | Low | Required fields, max amount, household member attribution | `(household_id, user_id, entry_fingerprint)` | Creator confirms; admin may reject | `SVC-BANK` or `SVC-LED` (TBD Phase 2) |
| `PH2-XDEDUP` | Cross-source match (e.g. receipt vs bank) | **Deferred** | — | Fuzzy match per dedup doc extension | N/A (matching layer) | User merge/split decision | `SVC-LED` |

---

## Column definitions

| Column | Meaning |
|--------|---------|
| **Trust** | How much to auto-trust without human review (High = bank API; Low = user/OCR originated). |
| **Validation** | Checks before preview: auth, schema, currency UAH default, amount sign rule (see [canonical model](canonical-banking-transaction-model.md)). |
| **Idempotency key** | Primary key for dedup; see [deduplication spec](deduplication-reconciliation-specification.md). |
| **Confirmation** | Who must approve before `SVC-LED` accepts **booked** rows for budget/export. |

---

## MVP pipeline (bank sources only)

```text
SVC-BANK: BankProvider.fetchTransactions
        ↓
Normalize → canonical preview (status may be pending/booked)
        ↓
Household admin/superadmin confirms import (MO-2)
        ↓
SVC-LED: reconcile + upsert (MO-3)
        ↓
SVC-AUD: import.confirmed / ledger.upsert events (MO-7)
```

Pending transactions may exist in preview storage (`bank_mvp`) but **must not** drive `SVC-BUD` actuals until `status = booked` after confirmation and ledger write.

---

## Phase 2 deferred sources (summary)

| ID | When built | Extra constraints |
|----|------------|-------------------|
| `PH2-FILE` | Post-MVP | Reuse confirmation UX; never auto-book without review |
| `PH2-OCR` | Post-MVP | Always confirm; store receipt image per [data-lifecycle-phase2.md](../compliance/data-lifecycle-phase2.md) |
| `PH2-CASH` | Post-MVP | Separate `source_kind`; no automatic dedup with bank without `PH2-XDEDUP` |
| `PH2-XDEDUP` | Post-MVP | Receipt-vs-bank out of MVP; see dedup spec MVP scope note |

---

## Related documents

- [`bank-provider-adapter.md`](bank-provider-adapter.md) — MVP bank port and per-bank deltas
- [`canonical-banking-transaction-model.md`](canonical-banking-transaction-model.md) — `source_system`, `source_kind`
- [`household-rbac.md`](household-rbac.md) — who may confirm import
- [`scope-and-traceability.md`](../registry/scope-and-traceability.md) — `MO-1`, `MO-2`, `PH2-*`

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §6 Ingestion sources | Full matrix (MVP rows + deferred `PH2-*` subsection) |
| §5 Implementation notes | Confirmation before ledger; idempotency keys |
| §14 Phase 2 roadmap | Deferred rows only |

**See also:** [`specification.md`](../../specification.md) — §6, §5, §14 (table above).
