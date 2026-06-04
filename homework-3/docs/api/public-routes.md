# Public API Routes (BFF)

> **Authority:** Full route list and guards — this document. Product behavior — [`specification.md`](../../specification.md). Per-service detail — [`services/gateway-bff.md`](../services/gateway-bff.md).

**Base path:** `/api/v1`  
**Auth:** `Authorization: Bearer <jwt>` (except `/health`, `/auth/login`)  
**Issuer:** `SVC-ID` via `SVC-BFF` proxy

---

## Routes

| Method | Path | MO | Roles | Proxies to |
|--------|------|-----|-------|------------|
| GET | `/health` | — | public | local |
| POST | `/auth/login` | MO-4 | public | `SVC-ID` |
| POST | `/auth/refresh` | MO-4 | authenticated | `SVC-ID` |
| GET | `/households/{householdId}` | MO-4 | member | `SVC-ID` |
| GET | `/households/{householdId}/members` | MO-4 | member | `SVC-ID` |
| POST | `/households/{householdId}/invitations` | MO-4 | admin, superadmin | `SVC-ID` |
| PATCH | `/households/{householdId}/members/{userId}` | MO-4 | admin, superadmin | `SVC-ID` |
| POST | `/households/{householdId}/erasure-requests` | MO-7 | superadmin, user (self) | `SVC-ID` |
| POST | `/households/{householdId}/bank-connections` | MO-1 | admin, superadmin | `SVC-BANK` |
| GET | `/households/{householdId}/bank-connections` | MO-1 | admin, superadmin | `SVC-BANK` |
| DELETE | `/households/{householdId}/bank-connections/{connectionId}` | MO-1 | admin, superadmin | `SVC-BANK` |
| POST | `/households/{householdId}/bank-connections/{connectionId}/sync` | MO-1 | admin, superadmin | `SVC-BANK` |
| GET | `/households/{householdId}/import-previews/{previewId}` | MO-2 | admin, superadmin, user* | `SVC-BANK` |
| POST | `/households/{householdId}/import-previews/{previewId}/confirm` | MO-2 | admin, superadmin | `SVC-BANK` → `SVC-LED` |
| GET | `/households/{householdId}/transactions` | MO-3, MO-4 | member (filtered) | `SVC-LED` |
| GET | `/households/{householdId}/budget/periods` | MO-5 | member | `SVC-BUD` |
| GET | `/households/{householdId}/budget/periods/{periodId}` | MO-5 | member | `SVC-BUD` |
| PUT | `/households/{householdId}/budget/categories/{categoryId}` | MO-5 | admin, superadmin, user† | `SVC-BUD` |
| POST | `/households/{householdId}/exports` | MO-6 | admin, superadmin, user | `SVC-EXP` |
| GET | `/households/{householdId}/exports/{exportJobId}` | MO-6 | same as create | `SVC-EXP` |
| GET | `/households/{householdId}/exports/{exportJobId}/download` | MO-6 | same as create | `SVC-EXP` |
| GET | `/ops/audit/events` | MO-8 | superadmin, ops | `SVC-AUD` |

\*User: preview rows for own-linked accounts only.  
†User: own-scope categories per [`household-rbac.md`](../domain/household-rbac.md).

---

## BFF denials (never proxied)

| Caller | Action | HTTP |
|--------|--------|------|
| viewer | export create/download | `403` |
| viewer | bank connect / sync / confirm | `403` |
| user | confirm import | `403` |
| any | missing/invalid JWT | `401` |

See [`errors-and-status-codes.md`](errors-and-status-codes.md) for audit events and downstream codes.

---

## Query defaults

| Endpoint | Default |
|----------|---------|
| `GET .../transactions` | `status=booked` |
| List pagination | `limit=50`, max `200` (cursor) |

**SLOs:** [`specification.md` §4](../../specification.md#4-non-functional-and-policy).

---

## Related documents

- [`headers.md`](headers.md)
- [`internal-routes.md`](internal-routes.md)
- [`../architecture/architecture-overview.md`](../architecture/architecture-overview.md)
