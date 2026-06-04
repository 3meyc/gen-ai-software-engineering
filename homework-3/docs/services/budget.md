# Service: budget (`SVC-BUD`)

> Categories, budget periods, limits, and **rollups from booked ledger data** with role-based visibility. Port **3004**. Database: **`budget_mvp`**.

---

## 1. Purpose and owned aggregates

| Aggregate | Collection | Description |
|-----------|------------|-------------|
| Category | `categories` | Household budget categories (groceries, utilities, …) |
| Budget period | `budget_periods` | Monthly (or custom) envelope |
| Period limit | `period_limits` | `category_id` + `limit_amount` per period |
| User envelope | `user_envelopes` | Optional per-user limits (`usr_mars_son`) |

**Does not store transactions** — computes `actual_booked` via `SVC-LED` REST.

**Primary MOs:** `MO-5`, `MO-4` (visibility).

---

## 2. Beginning context

```text
services/budget/
  src/main.ts
```

* No categories; no ledger client

---

## 3. Ending context

```text
services/budget/
  src/categories/
  src/periods/
  src/rollups/
    actuals.service.ts       # calls SVC-LED internal API
    visibility.filter.ts     # admin household vs user slice
```

**Indexes:**

| Collection | Index |
|------------|-------|
| `categories` | `{ household_id: 1, slug: 1 }` unique |
| `budget_periods` | `{ household_id: 1, start_date: 1 }` unique |
| `period_limits` | `{ period_id: 1, category_id: 1 }` unique |
| `user_envelopes` | `{ period_id: 1, user_id: 1, category_id: 1 }` |

**Fixture reference:** [`../../mocks/sample-budget-period.json`](../../mocks/sample-budget-period.json) (`bp_2026_06`).

---

## 4. MongoDB database

**`budget_mvp`** on shared cluster.

---

## 5. REST endpoints

### BFF-proxied (`/api/v1`)

| Method | Path | Roles | Action |
|--------|------|-------|--------|
| GET | `/households/{householdId}/budget/periods` | member | List periods |
| GET | `/households/{householdId}/budget/periods/{periodId}` | member | Period + limits + **actuals** (filtered) |
| POST | `/households/{householdId}/budget/periods` | admin, superadmin | Create period |
| PUT | `/households/{householdId}/budget/categories/{categoryId}` | admin, superadmin, user† | Update category / limit |
| POST | `/households/{householdId}/budget/categories` | admin, superadmin | Create category |

†User: only categories with `user_scope` for their `user_id`.

### Internal

| Method | Path | Caller | Action |
|--------|------|--------|--------|
| GET | `/internal/rollups` | optional cache warm | Precompute (optional MVP) |
| POST | `/internal/audit/events` | self → AUD | limit.changed |

### Downstream read

| Caller | Target | Query |
|--------|--------|-------|
| `SVC-BUD` | `SVC-LED` | `GET /internal/transactions?household_id=&status=booked&from=&to=` |

Rollup rules:

| Role | Actuals scope |
|------|---------------|
| admin, superadmin | Sum all household booked debits/credits per category rules |
| user | Sum txns where `attributed_user_id = caller` |
| viewer | Read-only same as user slice |

**Pending transactions never included** in `actual_booked`.

---

## 6. Callers and callees

| Callers | Callees |
|---------|---------|
| `SVC-BFF` | `SVC-LED`, `SVC-AUD`, `SVC-ID` (membership check optional cache) |

---

## 7. Verification hooks

| Test | Proves |
|------|--------|
| Period actuals match sum of booked ledger fixtures | MO-5 reconciliation |
| Admin sees `cat_utilities` + son envelope; son sees only personal | MO-4 |
| Pending ledger row not in actuals | Booked-only |
| Viewer cannot PUT category | RBAC |
| Overspend flag when actual > limit | Business rule |

---

## 8. Phase 2 touchpoints

**None in MVP.** `PH2-CASH` manual txns would require category rules for non-bank `source_kind`.

---

## Related documents

- [`../../mocks/sample-budget-period.json`](../../mocks/sample-budget-period.json)
- [`../domain/household-rbac.md`](../domain/household-rbac.md)
- [`ledger.md`](ledger.md)

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §5 Implementation notes | Booked-only actuals |
| §12 Context ending | Budget collections |
| §13 Low-level tasks | `TASK-BUD-*` |

**See also:** [`specification.md`](../../specification.md) — §5, §12, §13 (table above).
