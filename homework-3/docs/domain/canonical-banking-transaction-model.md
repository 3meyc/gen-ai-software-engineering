# Canonical Banking Transaction Model

## Overview

This document defines a bank-agnostic canonical transaction model for ingestion from:

* Mono
* OTP
* Privat24

The model normalizes account and transaction data into a consistent internal representation while preserving source-specific metadata.

### MVP scope

* **In scope:** `source_system` values `mono`, `otp`, `privat24` via `BankProvider` (`SVC-BANK`) → confirmed import → `SVC-LED`.
* **Out of scope (Phase 2):** `PH2-FILE`, `PH2-OCR`, `PH2-CASH` — see [`ingestion-sources-matrix.md`](ingestion-sources-matrix.md) and [`scope-and-traceability.md`](../registry/scope-and-traceability.md).
* **Budget and export** consume rows with `status = booked` only (`MO-5`, `MO-6`).

**See also:** [`specification.md`](../../specification.md) §8 (canonical summary), §5 (implementation notes), §6 (ingestion sources).

---

## Related documents

* [`ingestion-sources-matrix.md`](ingestion-sources-matrix.md) — trust and confirmation per source
* [`bank-provider-adapter.md`](bank-provider-adapter.md) — provider → canonical mapping
* [`deduplication-reconciliation-specification.md`](deduplication-reconciliation-specification.md) — identity keys (bank-only in MVP)
* [`mocks/sample-transactions.json`](../../mocks/sample-transactions.json) — fixture examples

---

# Design Principles

1. Bank-independent core schema.
2. Support full and incremental synchronization.
3. Idempotent imports.
4. Preserve source identifiers.
5. Store timestamps in UTC.
6. Support transaction lifecycle updates (pending → booked → reversed).
7. Preserve source-specific fields in extensible metadata.

---

# Transaction Entity

| Field                  | Type          | Required | Description                                      |
| ---------------------- | ------------- | -------- | ------------------------------------------------ |
| transaction_id         | string        | Yes      | Internal canonical transaction identifier        |
| source_system          | enum          | Yes      | mono, otp, privat24 (MVP); extended in Phase 2   |
| source_kind            | enum          | Yes      | `bank_api` (MVP); `file`, `ocr`, `manual` (Phase 2) |
| source_transaction_id  | string        | Yes      | Unique transaction identifier provided by source |
| account_id             | string        | Yes      | Canonical account identifier                     |
| source_account_id      | string        | Yes      | Source account/card identifier                   |
| booking_timestamp      | datetime      | Yes      | Official booking timestamp                       |
| transaction_timestamp  | datetime      | No       | Actual transaction timestamp                     |
| amount                 | decimal(18,2) | Yes      | Signed amount                                    |
| currency               | string(3)     | Yes      | ISO 4217 currency code                           |
| description            | string        | No       | Original transaction description                 |
| merchant_name          | string        | No       | Merchant or payee name                           |
| merchant_category_code | string        | No       | Merchant category code (MCC)                     |
| counterparty_name      | string        | No       | Counterparty name                                |
| counterparty_account   | string        | No       | Counterparty account identifier                  |
| transaction_type       | enum          | Yes      | See Transaction Types                            |
| direction              | enum          | Yes      | debit, credit                                    |
| status                 | enum          | Yes      | pending, booked, reversed, failed                |
| balance_after          | decimal(18,2) | No       | Account balance after transaction                |
| exchange_rate          | decimal(18,8) | No       | FX rate applied                                  |
| original_amount        | decimal(18,2) | No       | Original amount before conversion                |
| original_currency      | string(3)     | No       | Original currency                                |
| metadata               | object        | No       | Source-specific attributes                       |
| created_at             | datetime      | Yes      | Ingestion timestamp                              |
| updated_at             | datetime      | Yes      | Last modification timestamp                      |

---

# Transaction Types

| Value           |
| --------------- |
| transfer        |
| card_payment    |
| cash_withdrawal |
| cash_deposit    |
| fee             |
| interest        |
| refund          |
| adjustment      |
| loan_payment    |
| salary          |
| tax             |
| other           |

---

# Transaction Status

| Value    | Description          |
| -------- | -------------------- |
| pending  | Awaiting settlement  |
| booked   | Settled and posted   |
| reversed | Reversed or canceled |
| failed   | Processing failed    |

---

# Direction

| Value  | Meaning              |
| ------ | -------------------- |
| debit  | Money leaves account |
| credit | Money enters account |

---

# Account Entity

| Field             | Type      | Required | Description                                               |
| ----------------- | --------- | -------- | --------------------------------------------------------- |
| account_id        | string    | Yes      | Canonical account identifier                              |
| source_system     | enum      | Yes      | mono, otp, privat24                                       |
| source_account_id | string    | Yes      | Source account identifier                                 |
| account_name      | string    | No       | User-facing account name                                  |
| account_type      | enum      | Yes      | checking, savings, card, loan, deposit, investment, other |
| currency          | string(3) | Yes      | Account currency                                          |
| iban              | string    | No       | IBAN if available                                         |
| masked_pan        | string    | No       | Masked card number                                        |
| status            | enum      | Yes      | active, inactive, closed, blocked                         |

---

# Import Metadata

| Field         | Type     | Required | Description                        |
| ------------- | -------- | -------- | ---------------------------------- |
| import_id     | string   | Yes      | Unique import execution identifier |
| source_system | enum     | Yes      | mono, otp, privat24                |
| imported_at   | datetime | Yes      | Import timestamp                   |
| import_mode   | enum     | Yes      | full, incremental, replay          |
| user_id       | string   | Yes      | Internal user identifier           |
| checkpoint    | string   | No       | Synchronization watermark          |

---

# Idempotency

## Primary Deduplication Key

```text
(source_system, source_transaction_id)
```

This key must be unique across all imported transactions.

## Fallback Deduplication Key

Used only when source_transaction_id is unavailable.

```text
hash(
    source_system,
    source_account_id,
    booking_timestamp,
    amount,
    currency,
    description
)
```

---

# Normalization Rules

## Amount and direction (single rule — no ambiguity)

Canonical storage uses **one signed decimal** in `amount` and a **direction** enum. They MUST always agree:

| Sign of `amount` | `direction` | Meaning |
| ---------------- | ----------- | ------- |
| `> 0`            | `credit`    | Money enters the account |
| `< 0`            | `debit`     | Money leaves the account |
| `0`              | `adjustment`| Rare; document in metadata |

**Normalization steps:**

1. If the bank returns a **signed** amount, persist it as-is and set `direction` from the sign.
2. If the bank returns an **absolute** amount plus a debit/credit indicator (e.g. OTP `debitCredit`), compute `amount` as negative for debit and positive for credit, then set `direction` to match.
3. Reject or quarantine rows where sign and direction disagree after normalization (validation error in `SVC-BANK` preview).

Implementers must not store absolute amounts with direction inferred only at display time.

Examples:

| Amount  | Direction |
| ------- | --------- |
| 1000.00 | credit    |
| -250.50 | debit     |

---

## `source_kind` (Phase 2 extension)

| Value | `source_system` examples | MVP |
| ----- | ------------------------ | --- |
| `bank_api` | mono, otp, privat24 | Yes |
| `file` | `ph2_file` (placeholder) | Phase 2 (`PH2-FILE`) |
| `ocr` | `ph2_ocr` | Phase 2 (`PH2-OCR`) |
| `manual` | `ph2_cash` | Phase 2 (`PH2-CASH`) |

MVP imports set `source_kind = bank_api` for all ledger writes.

---

## Time Handling

All timestamps must be stored in UTC.

Example:

```text
2026-06-04T10:15:00Z
```

Source timezone information may be preserved in metadata.

---

## Currency Handling

Use ISO 4217 codes.

Examples:

```text
UAH
USD
EUR
GBP
PLN
```

---

## Transaction Lifecycle

A transaction may evolve through states:

```text
pending
  ↓
booked
  ↓
reversed
```

Updates should modify the existing canonical record rather than creating a new transaction.

---

# Source Metadata Extension

Bank-specific attributes must not alter the canonical schema.

Store them in metadata.

Example:

```json
{
  "metadata": {
    "mono": {
      "jar_id": "123"
    },
    "otp": {
      "channel": "mobile"
    },
    "privat24": {
      "terminal_id": "ABC123"
    }
  }
}
```

---

# Example Transaction

```json
{
  "transaction_id": "txn_8f9d1c",
  "source_system": "privat24",
  "source_kind": "bank_api",
  "source_transaction_id": "P24-987654321",
  "account_id": "acc_123",
  "source_account_id": "card_456",
  "booking_timestamp": "2026-06-04T10:15:00Z",
  "transaction_timestamp": "2026-06-04T10:14:42Z",
  "amount": -1250.50,
  "currency": "UAH",
  "description": "Grocery purchase",
  "merchant_name": "Silpo",
  "merchant_category_code": "5411",
  "transaction_type": "card_payment",
  "direction": "debit",
  "status": "booked",
  "balance_after": 18234.67,
  "metadata": {
    "privat24": {
      "terminal_id": "T12345"
    }
  }
}
```

---

# Canonical Ingestion Flow

```text
Authenticate Source
        ↓
Fetch Accounts
        ↓
Fetch Transactions
        ↓
Validate Schema
        ↓
Normalize Data
        ↓
Generate Idempotency Key
        ↓
Upsert Canonical Records
        ↓
Persist Raw Payload
        ↓
Update Checkpoint
        ↓
Complete Import
```

---

# Trust Classification

| Source                      | Trust Level |
| --------------------------- | ----------- |
| Direct Bank API             | High        |
| Bank Export File (CSV/XLSX) | Medium      |
| OCR / PDF Parsing           | Low         |
| Manual Entry                | Low         |

---

# User Confirmation Policy

Before import execution:

1. Authenticate source.
2. Retrieve available accounts.
3. Display:

   * source bank
   * selected accounts
   * date range
   * transaction count
4. Require explicit user confirmation.
5. Execute import.
6. Display import result summary.
7. Report skipped duplicates.

---

# Supported Sources

| Source   | Trust | Incremental Sync | Idempotent Import |
| -------- | ----- | ---------------- | ----------------- |
| Mono     | High  | Yes              | Yes               |
| OTP      | High  | Yes              | Yes               |
| Privat24 | High  | Yes              | Yes               |

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §8 Canonical model and dedup | Entity tables, amount/direction rule, `source_kind` |
| §5 Implementation notes | Signed decimal, UTC timestamps, booked-only reads |
| §6 Ingestion sources | MVP bank `source_system` enum |

**See also:** [`specification.md`](../../specification.md) — §8, §5, §6 (table above).

---

End of document.
