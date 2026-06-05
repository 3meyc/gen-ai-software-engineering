# Data Lifecycle — Phase 2 (`PH2-OCR`)

> **Not MVP.** Receipt image storage and retention apply only when `PH2-OCR` is implemented. MVP bank ingest does not store receipt images.

**See also:** [`data-lifecycle-mvp.md`](data-lifecycle-mvp.md), [`../phase2/roadmap.md`](../phase2/roadmap.md), [`specification.md` §14](../../specification.md#14-phase-2-roadmap).

---

# Receipt Image Retention

## Supported Assets

Examples:

* Payment receipts
* POS receipts
* Transfer confirmations
* Invoice attachments
* Check images
* User-uploaded transaction evidence

---

## Storage Requirements

Receipt images must:

* Be encrypted at rest
* Be encrypted in transit
* Be stored separately from authentication secrets
* Be associated with transaction identifiers

---

## Default Retention

| Data Type        | Retention |
| ---------------- | --------- |
| Receipt Images   | 24 months |
| Receipt Metadata | 7 years   |

Receipt metadata includes:

* filename
* upload timestamp
* content hash
* transaction reference

---

## Expiration Handling

At retention expiry:

1. Delete image binary.
2. Preserve transaction record.
3. Preserve audit trail.
4. Preserve content hash if required for integrity verification.

---

## User-Initiated Deletion

Users may delete receipt images at any time.

### Result

```text
Receipt image deleted.

Transaction record retained.
Audit record retained.
```

---

## User-Facing Outcome

```text
Receipt image deleted successfully.
Transaction history remains available.
```

---

## Erasure (Phase 2 extension)

When erasure runs post-`PH2-OCR`, delete receipt images and metadata per [`data-lifecycle-mvp.md`](data-lifecycle-mvp.md) erasure workflow, in addition to MVP bank data.
