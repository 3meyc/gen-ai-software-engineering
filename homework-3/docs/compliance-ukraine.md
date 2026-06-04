# Compliance — Ukraine (UA)

> Privacy, retention, and audit expectations for the household budget MVP. Jurisdiction: **Ukraine**; currency default **UAH (ISO 4217)**. IDs: `MO-7`, `MO-8`.

---

## Regulatory framing (assumptions)

This specification treats the product as processing **personal data** under Ukrainian law, including:

- **Law of Ukraine "On Personal Data Protection"** (and amendments) — lawful basis, purpose limitation, data subject rights.
- **National Bank of Ukraine** practices where applicable for payment data obtained via licensed bank APIs (abstracted; no real API integration in homework).

**Assumption:** Bank APIs (Mono, OTP, Privat24) are invoked under user consent with scopes displayed at connect time. The platform is a **data processor** for household budgeting, not a bank.

---

## Data minimization

| Principle | MVP implementation |
|-----------|-------------------|
| Collect only what is needed | Accounts, transactions, budget categories — no geolocation, no contacts |
| Mask secrets | Store `masked_pan`, never full PAN; tokens encrypted per [data-lifecycle.md](data-lifecycle.md) |
| Logs | No access tokens, refresh tokens, full account numbers, or CSV full rows in application logs |
| Export | CSV includes only columns in [`mocks/sample-export-manifest.json`](../mocks/sample-export-manifest.json); viewer role denied |

---

## Lawful purposes (MVP)

| Purpose | Data categories |
|---------|-----------------|
| Household budgeting | Booked transactions, categories, limits |
| Bank aggregation | Connection tokens, account metadata, sync checkpoints |
| Security & fraud awareness | Audit events, login/session ids (no passwords in audit) |
| Compliance response | Ops read-only audit/export history (`MO-8`) |

---

## Data subject rights

| Right | MVP behavior | Reference |
|-------|--------------|-----------|
| Access | CSV export for authorized roles; superadmin household export | `MO-6`, RBAC doc |
| Rectification | Budget category edits; bank corrections via re-sync update | Canonical lifecycle |
| Erasure | Household erasure request → orchestrated delete | [data-lifecycle.md](data-lifecycle.md) § Erasure |
| Restriction | Disconnect bank stops sync; tokens revoked | `MO-1` |
| Objection | Out of MVP automation; manual support process | Phase 2 note |

### Erasure SLA (assumed target)

| Step | Target |
|------|--------|
| Acknowledge request | Within **24 hours** (business) |
| Revoke bank tokens | Immediate on erasure start |
| Delete PII in service DBs | Within **30 days** unless legal hold |
| Audit trail of erasure | Retained **7 years** anonymized actor id where required |

Full field-level deletion matrix: [data-lifecycle.md](data-lifecycle.md).

---

## Retention (summary)

| Data type | Active retention | Archive | Notes |
|-----------|------------------|---------|-------|
| Bank tokens | Until disconnect + 0 days | — | Encrypted, rotate per lifecycle doc |
| Booked transactions | Life of household + user policy | Optional cold archive Phase 2 | Budget uses booked only |
| Import preview (unconfirmed) | **90 days** max | — | Purge if never confirmed |
| Audit events | **7 years** | Immutable append-only | `SVC-AUD` |
| Receipt images (`PH2-OCR`) | N/A MVP | Per lifecycle when built | |

---

## Audit requirements (`MO-7`)

Immutable append-only events from `SVC-BANK`, `SVC-LED`, `SVC-BUD`, `SVC-EXP`, `SVC-ID`:

| Event family | Examples |
|--------------|----------|
| Auth | `bank.connected`, `bank.disconnected`, `token.revoked` |
| Import | `import.previewed`, `import.confirmed`, `import.rejected` |
| Ledger | `transaction.created`, `transaction.updated`, `duplicate.skipped` |
| Budget | `budget.limit.changed` |
| Export | `export.requested`, `export.completed`, `export.denied` |
| Privacy | `erasure.requested`, `erasure.completed` |

Audit records must not contain secrets or full PAN.

---

## Cross-border transfer

MVP assumes primary data residency in **UA/EU-aligned hosting** (documented assumption). No transfer to non-adequate countries without DPA — out of MVP implementation.

---

## Abstract bank API assumptions

| Assumption | Risk if false |
|------------|---------------|
| OAuth tokens are refreshable | User re-authenticates |
| Transaction ids stable per account | Fallback fingerprint dedup |
| Amounts in account currency | FX fields optional in canonical model |
| Bank provides booked vs pending | Budget ignores pending |

---

## Related documents

- [`data-lifecycle.md`](data-lifecycle.md) — retention, erasure, token rotation
- [`household-rbac.md`](household-rbac.md) — who may export / erase
- [`deduplication-reconciliation-specification.md`](deduplication-reconciliation-specification.md) — audit on reconcile
- [`scope-and-traceability.md`](scope-and-traceability.md) — `MO-7`, `MO-8`

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §4 Non-functional and policy | UA privacy, retention, erasure SLA |
| §5 Implementation notes | No secrets in logs; minimization |
| §11 Verification | Compliance review checklist |
| §3 Stakeholders | Ops/compliance |

*Final synthesis in Phase 4 — see `specification.md` when published.*
