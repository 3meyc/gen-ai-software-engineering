# Data Lifecycle & Retention Policy (MVP)

> **MVP only:** Bank tokens, transactions, audit, erasure for `mono` / `otp` / `privat24`. Receipt images — [`data-lifecycle-phase2.md`](data-lifecycle-phase2.md) (`PH2-OCR`).

## Purpose

Define retention, rotation, deletion, and erasure requirements for financial data ingested from:

* Mono
* OTP
* Privat24

The policy applies to:

* Bank access credentials
* Access tokens
* Account metadata
* Transactions
* Receipt images (Phase 2 / `PH2-OCR` — not stored in MVP)
* Audit records
* User-generated annotations

### MVP scope

* **In scope:** Bank tokens, account metadata, booked/preview transaction lifecycle, audit retention, erasure orchestration for MVP sources (`mono`, `otp`, `privat24`).
* **Out of scope:** Receipt image storage and OCR purge paths until `PH2-OCR` (noted below where relevant).

**See also:** [`specification.md`](../../specification.md) §4 (NFR/retention), §5 (credentials), §11 (erasure verification).

### Related documents

* [`compliance-ukraine.md`](compliance-ukraine.md) — UA privacy and erasure SLA summary
* [`../domain/bank-provider-adapter.md`](../domain/bank-provider-adapter.md) — token revoke
* [`../domain/household-rbac.md`](../domain/household-rbac.md) — who may request erasure
* [`../registry/scope-and-traceability.md`](../registry/scope-and-traceability.md) — `MO-7`

---

# Data Classification

| Data Type        | Classification | Sensitivity |
| ---------------- | -------------- | ----------- |
| Access Tokens    | Secret         | Critical    |
| Refresh Tokens   | Secret         | Critical    |
| Account Numbers  | Confidential   | High        |
| IBANs            | Confidential   | High        |
| Transaction Data | Confidential   | High        |
| Receipt Images   | Confidential   | High        |
| User Notes       | Confidential   | Medium      |
| Audit Logs       | Restricted     | Medium      |
| Analytics Data   | Internal       | Low         |

---

# Data Lifecycle

```text
Acquire
  ↓
Validate
  ↓
Normalize
  ↓
Store
  ↓
Use
  ↓
Archive
  ↓
Delete
```

---

# Bank Credential Lifecycle

## Access Tokens

Access tokens must never be stored in plaintext.

Storage requirements:

* Encryption at rest
* Key-managed storage
* Access-controlled retrieval

---

## Refresh Tokens

Refresh tokens require:

* Encryption at rest
* Rotation support
* Revocation support

---

## Token Rotation

### Automatic Rotation

Rotate when:

* Token expires
* Provider requires renewal
* Security event detected

---

### Forced Rotation

Trigger rotation when:

* Password changed at bank
* Device revoked
* User reconnects account
* Credential compromise suspected

---

## Rotation Process

```text
Current Token
      ↓
Obtain New Token
      ↓
Validate Access
      ↓
Persist New Token
      ↓
Invalidate Previous Token
```

---

## Failed Rotation

If rotation fails:

```text
Connection requires re-authentication.
```

User action required.

---

# Credential Retention

| Data                | Retention                      |
| ------------------- | ------------------------------ |
| Access Token        | Until expiry or revocation     |
| Refresh Token       | Until disconnect or revocation |
| OAuth Session State | 30 days                        |
| Authorization Logs  | 12 months                      |

---

# Account Disconnect

## User Disconnects Bank

Examples:

* Remove Mono connection
* Remove OTP connection
* Remove Privat24 connection

---

### Immediate Actions

1. Revoke active access token if supported.
2. Delete refresh token.
3. Disable future synchronization.
4. Record disconnect audit event.

---

### Optional Data Retention

Depending on product settings:

#### Keep Imported Data

```text
Connection removed.
Historical transactions retained.
```

#### Delete Imported Data

```text
Connection removed.
Historical transactions deleted.
```

---

# Right to Erasure

## User Request

User requests deletion of personal data.

Examples:

* Delete account
* Delete imported financial history
* Exercise privacy rights

---

## Scope

Delete:

* User profile
* Bank connections
* Tokens
* Notes
* Preferences
* Imported account metadata
* Imported transactions

Unless legal retention requirements apply.

---

## Erasure Workflow

```text
Verify Identity
      ↓
Create Erasure Request
      ↓
Freeze Processing
      ↓
Delete Eligible Data
      ↓
Generate Deletion Report
      ↓
Complete Request
```

---

## Deletion SLA

Recommended:

| Action                  | Target   |
| ----------------------- | -------- |
| Request Acknowledgement | 24 hours |
| Deletion Execution      | 30 days  |
| Deletion Confirmation   | 30 days  |

---

# Data Deleted During Erasure

| Data Type        | Deleted |
| ---------------- | ------- |
| User Profile     | Yes     |
| Tokens           | Yes     |
| Bank Connections | Yes     |
| Notes            | Yes     |
| Transaction Data | Yes*    |
| Account Metadata | Yes*    |

* Subject to legal, regulatory, tax, accounting, fraud, or security retention obligations.

---

# Data Retained After Erasure

Only when legally required.

Examples:

| Data Type                    | Reason                  |
| ---------------------------- | ----------------------- |
| Audit Records                | Security and compliance |
| Security Logs                | Fraud prevention        |
| Legal Hold Data              | Ongoing investigation   |
| Financial Compliance Records | Regulatory requirement  |

---

# Audit Log Retention

## Purpose

Maintain an immutable record of security-sensitive actions.

Examples:

* Login
* Token issuance
* Token revocation
* Import execution
* Data deletion
* Reconciliation decisions

---

## Retention

| Data Type     | Retention |
| ------------- | --------- |
| Audit Logs    | 7 years   |
| Security Logs | 2 years   |
| Access Logs   | 12 months |

---

## Audit Log Deletion

Audit records are not modified or deleted except when legally permitted.

Personally identifying fields should be anonymized where possible.

---

# Backup Retention

## Production Backups

| Backup Type | Retention |
| ----------- | --------- |
| Daily       | 35 days   |
| Monthly     | 12 months |
| Annual      | 7 years   |

---

## Erasure and Backups

Deleted records:

* Must be removed from active systems immediately.
* May persist in encrypted backups until backup expiration.
* Must not be restored into active production systems except during disaster recovery.

---

# Data Minimization

The platform should only store data necessary to:

* Authenticate users
* Synchronize accounts
* Display transactions
* Perform reconciliation
* Meet legal obligations

Data that is no longer required should be deleted automatically according to retention schedules.

---

# User-Facing Outcomes

## Bank Connection Removed

```text
Bank connection removed.

Future synchronization disabled.
Access credentials revoked.
```

---

## Data Erasure Completed

```text
Your personal data has been deleted.

Active connections removed.
Stored credentials deleted.
Financial records removed where legally permitted.
```

---

# Canonical Lifecycle States

| State            | Description                       |
| ---------------- | --------------------------------- |
| ACTIVE           | Data available for normal use     |
| ARCHIVED         | Retained but not actively used    |
| PENDING_DELETION | Scheduled for deletion            |
| DELETED          | Removed from active systems       |
| LEGALLY_RETAINED | Preserved due to legal obligation |
| ANONYMIZED       | Personal identifiers removed      |

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §4 Non-functional and policy | Retention, token rotation, erasure |
| §5 Implementation notes | Credential handling |
| §11 Verification | Erasure and disconnect test steps |

**See also:** [`specification.md`](../../specification.md) — §4, §5, §11 (table above).

---

End of document.
