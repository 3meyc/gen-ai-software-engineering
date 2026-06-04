# Mocks — Test Fixtures

> Demo household and sample data for verification per [specification.md §11](../specification.md#11-verification). See [`docs/testing/fixtures-guide.md`](../docs/testing/fixtures-guide.md).

---

## Files

| File | Purpose |
|------|---------|
| `household-family.json` | Mars Family (`hh_mars_001`) — 7 members, roles, bank connections |
| `sample-transactions.json` | Canonical booked rows for reconcile tests (`MO-3`) |
| `sample-budget-period.json` | Period `bp_2026_06` expected actuals (`MO-5`) |
| `sample-export-manifest.json` | CSV columns and redaction rules (`MO-6`) |
| `bank-payloads/` | Optional raw Mono/OTP/Privat24 API samples for adapter unit tests |

---

## Household `hh_mars_001`

| Member | `user_id` | Role |
|--------|-----------|------|
| Elena (mother) | `usr_mars_mother` | superadmin |
| Oleksandr (father) | `usr_mars_father` | admin |
| Maksym (son) | `usr_mars_son` | user |
| Sofia (daughter) | `usr_mars_daughter` | user |
| Barsik (cat) | `usr_mars_cat` | viewer (non-human profile) |
| Ihor (uncle) | `usr_mars_uncle` | viewer |
| Oksana (niece) | `usr_mars_niece` | viewer |

**Do not change** role names or `household_id` without updating [specification.md §9](../specification.md#9-household-rbac) and `TASK-ID-003` DoD.

---

## Usage rules

1. Seed scripts load `household-family.json` verbatim for integration tests.
2. Ledger tests use `sample-transactions.json` for expected create/update/skip counts.
3. Budget tests assert actuals against **booked** rows only; pending preview data is not in these fixtures.
4. Export tests validate column manifest and redaction — viewer must not call export API regardless of fixture.
