# Fixtures Guide

> When to use each file under [`mocks/`](../../mocks/). Do not invent conflicting IDs or roles.

---

## Fixture catalog

| File | Use for | Key IDs |
|------|---------|---------|
| [`household-family.json`](../../mocks/household-family.json) | RBAC seeds, MO-1 connections, MO-4 matrix | `hh_mars_001`, `usr_mars_*` |
| [`sample-transactions.json`](../../mocks/sample-transactions.json) | MO-3 reconcile, ledger apply counts | `source_system`, `source_transaction_id` |
| [`sample-budget-period.json`](../../mocks/sample-budget-period.json) | MO-5 actuals vs booked sum | `bp_2026_06` |
| [`sample-export-manifest.json`](../../mocks/sample-export-manifest.json) | MO-6 columns, PII redaction | Column flags per role |

---

## Mars Family scenarios

| Actor | `user_id` | Role | Test scenario |
|-------|-----------|------|---------------|
| Elena | `usr_mars_mother` | superadmin | Erasure, ops audit (`MO-8`) |
| Oleksandr | `usr_mars_father` | admin | **Confirm import** (`MO-2`), household budget |
| Maksym | `usr_mars_son` | user | Confirm → `403`; per-user scope |
| Sofia | `usr_mars_daughter` | user | Per-user scope |
| Barsik | `usr_mars_cat` | viewer | Export → `403`, `export.denied` |
| Ihor / Oksana | `usr_mars_uncle`, `usr_mars_niece` | viewer | Scoped read; no cross-member txns |

**Bank connections in fixture:** father's Mono (`mono_conn_mars_01`), mother's OTP (`otp_conn_mars_01`).

---

## Locked field values

| Field | Allowed MVP values |
|-------|-------------------|
| `role` | `superadmin`, `admin`, `user`, `viewer` |
| `source_system` | `mono`, `otp`, `privat24` |
| `source_kind` (ledger) | `bank_api` |
| `status` (budget/export queries) | `booked` |
| `currency` | `UAH` (default) |

---

## Optional bank payloads (enhancement)

Raw provider JSON samples (when present): [`mocks/bank-payloads/`](../../mocks/bank-payloads/) — unit tests for Mono/OTP/Privat24 adapters (`MO-1`).

---

## Related documents

- [`testing-strategy.md`](testing-strategy.md)
- [`../../mocks/README.md`](../../mocks/README.md)
- [`../domain/household-rbac.md`](../domain/household-rbac.md)
