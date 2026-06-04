# Deduplication & Reconciliation Specification

## Purpose

Prevent duplicate transactions from being created during imports while allowing legitimate transaction updates and corrections from source banks.

This specification applies to:

* Mono
* OTP
* Privat24

### MVP scope

* **In scope:** Within-bank deduplication and reconciliation for `source_kind = bank_api` (`MO-3`).
* **Out of scope for MVP:** Cross-source matching (e.g. receipt OCR vs bank transaction) — deferred to **`PH2-XDEDUP`**. Do not implement receipt-vs-bank merge rules in MVP tasks.
* See [`ingestion-sources-matrix.md`](ingestion-sources-matrix.md) and [`scope-and-traceability.md`](scope-and-traceability.md).

### Related documents

* [`canonical-banking-transaction-model.md`](canonical-banking-transaction-model.md) — primary and fallback keys
* [`bank-provider-adapter.md`](bank-provider-adapter.md) — re-fetch and checkpoint behavior
* [`compliance-ukraine.md`](compliance-ukraine.md) — audit on reconcile actions

---

# Definitions

## Deduplication

Identification of multiple imported records that represent the same bank transaction.

Outcome:

```text
1 canonical transaction
N source observations
```

---

## Reconciliation

Process of comparing imported transactions against existing canonical records and determining whether to:

* create
* update
* ignore
* flag for review

---

# Transaction Identity Hierarchy

## Level 1 — Source Transaction Identifier

Highest confidence match.

### Match Rule

```text
source_system == source_system
AND
source_transaction_id == source_transaction_id
```

### Action

```text
Update existing transaction
```

### User Outcome

No user action required.

---

## Level 2 — Deterministic Fingerprint

Used when source transaction identifier is missing.

### Fingerprint

```text
hash(
    source_system,
    source_account_id,
    booking_timestamp,
    amount,
    currency
)
```

### Action

```text
Treat as duplicate
```

### User Outcome

No user action required.

---

## Level 3 — Fuzzy Match

Used for imported files, historical migrations, or inconsistent source identifiers.

### Matching Criteria

Same account

AND

Amount difference:

```text
0
```

AND

Currency equal

AND

Transaction date within:

```text
± 1 day
```

AND

Description similarity:

```text
>= 90%
```

### Confidence

Medium

### Action

```text
Flag for reconciliation
```

### User Outcome

Requires review.

---

# Reconciliation Decision Matrix

| Match Type                | Confidence | Action                 | User Review |
| ------------------------- | ---------- | ---------------------- | ----------- |
| Source Transaction ID     | High       | Update existing        | No          |
| Deterministic Fingerprint | High       | Ignore duplicate       | No          |
| Fuzzy Match               | Medium     | Queue review           | Yes         |
| No Match                  | High       | Create new transaction | No          |

---

# Upsert Rules

## Existing Transaction Found

### Pending → Booked

Before:

```text
pending
```

After:

```text
booked
```

Action:

```text
Update status
```

---

### Booked → Reversed

Before:

```text
booked
```

After:

```text
reversed
```

Action:

```text
Update existing record
```

Do not create new transaction.

---

### Metadata Changes Only

Examples:

* merchant enrichment
* MCC added
* counterparty details updated

Action:

```text
Update fields
```

Audit event recorded.

---

# Duplicate Import Handling

## Scenario

User imports same date range twice.

Example:

```text
2026-06-01 → 2026-06-30
```

Imported again:

```text
2026-06-01 → 2026-06-30
```

### Result

All matching transactions skipped.

### User Message

```text
Import completed.

Imported: 0
Updated: 0
Duplicates skipped: 124
```

---

# Partial Overlap Imports

## Scenario

Existing data:

```text
June 1 → June 30
```

New import:

```text
June 15 → July 15
```

### Result

```text
June 15 → June 30 = duplicates
July 1 → July 15 = new
```

### User Message

```text
Import completed.

New transactions: 57
Duplicates skipped: 82
```

---

# Reconciliation Queue

## Trigger Conditions

Create review item when:

* fuzzy match confidence < threshold
* amount mismatch detected
* currency mismatch detected
* conflicting status updates received
* transaction moved between accounts
* source correction changes transaction materially

---

## Review Item Structure

| Field                 | Description                |
| --------------------- | -------------------------- |
| candidate_transaction | Existing transaction       |
| incoming_transaction  | Newly imported transaction |
| confidence_score      | Matching confidence        |
| discrepancy_reason    | Why review is required     |
| created_at            | Review creation timestamp  |

---

# User Review Actions

## Keep Existing

Outcome:

```text
Ignore imported candidate
```

---

## Replace Existing

Outcome:

```text
Incoming transaction becomes canonical
```

---

## Merge

Outcome:

```text
Single transaction retained
Additional metadata preserved
```

---

## Keep Both

Outcome:

```text
Create separate transactions
```

Used when transactions appear similar but are actually distinct.

---

# User-Facing Import Summary

## Successful Import

```text
Import completed successfully.

Accounts imported: 3
New transactions: 148
Updated transactions: 12
Duplicates skipped: 94

No action required.
```

---

## Import With Reconciliation Required

```text
Import completed.

New transactions: 143
Updated transactions: 10
Duplicates skipped: 88

5 transactions require review.
```

---

# User-Facing Transaction Statuses

| Status       | Meaning                        |
| ------------ | ------------------------------ |
| Imported     | New transaction created        |
| Updated      | Existing transaction updated   |
| Duplicate    | Transaction already exists     |
| Reconciled   | User resolved conflict         |
| Needs Review | Manual reconciliation required |
| Reversed     | Transaction reversed by bank   |

---

# Audit Trail

Every reconciliation action must generate an immutable audit record.

## Audit Event

| Field          | Description                |
| -------------- | -------------------------- |
| event_id       | Unique identifier          |
| transaction_id | Canonical transaction      |
| action         | create/update/merge/reject |
| actor          | system/user                |
| reason         | Reconciliation reason      |
| timestamp      | Event timestamp            |

---

# Recommended Thresholds

| Rule                         | Value  |
| ---------------------------- | ------ |
| Fuzzy description similarity | 90%    |
| Booking date tolerance       | ±1 day |
| Amount tolerance             | 0      |
| Currency tolerance           | 0      |
| Auto-match confidence        | ≥99%   |
| Manual review confidence     | 70–99% |
| Reject confidence            | <70%   |

---

# Canonical Reconciliation Outcomes

| Outcome           | Description                   |
| ----------------- | ----------------------------- |
| CREATED           | New transaction added         |
| UPDATED           | Existing transaction modified |
| DUPLICATE_SKIPPED | Exact duplicate ignored       |
| MERGED            | Multiple records consolidated |
| REVERSED          | Existing transaction reversed |
| REVIEW_REQUIRED   | User decision required        |
| REJECTED          | Invalid or conflicting import |

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §8 Canonical model and dedup | Identity hierarchy, outcomes, thresholds |
| §10 Edge cases | Duplicate overlap, fuzzy review |
| §11 Verification | Reconciliation test cases, import summary |

*Final synthesis in Phase 4 — see `specification.md` when published.*
