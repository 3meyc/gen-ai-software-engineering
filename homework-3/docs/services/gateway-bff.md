# Service: gateway-bff (`SVC-BFF`)

> Angular-facing API gateway. **No business data ownership** — auth propagation, aggregation, role guards. Port **3000** (doc convention).

---

## 1. Purpose and owned aggregates

| Item | Detail |
|------|--------|
| **Purpose** | Single public HTTP surface for the Angular app; validate JWT; enforce RBAC; proxy to backend services |
| **Owned aggregates** | None (stateless). Session/JWT validation may cache household membership briefly in memory only |
| **Primary MOs** | All — cross-cutting enforcement for `MO-4`; exposes flows for `MO-1`–`MO-8` |

---

## 2. Beginning context

Hypothetical monorepo before implementation:

```text
apps/
  web/                    # Angular shell, empty routes
  gateway-bff/
    src/main.ts           # Nest bootstrap
    src/app.module.ts     # empty HttpModule
```

* No JWT issuer wired  
* No downstream service URLs in config  
* No route modules beyond health `GET /health`

---

## 3. Ending context

```text
apps/gateway-bff/
  src/auth/               # JWT guard, role decorator
  src/proxy/              # typed clients to ID, BANK, LED, BUD, EXP, AUD
  src/routes/
    households.controller.ts
    bank-connections.controller.ts
    import-previews.controller.ts
    transactions.controller.ts
    budget.controller.ts
    exports.controller.ts
    ops-audit.controller.ts
  src/filters/            # uniform 4xx/5xx + correlation id
```

* All public routes under `/api/v1`  
* Correlation id forwarded to downstream `X-Request-Id`  
* No direct MongoDB connection

---

## 4. MongoDB database

**None.** `SVC-BFF` is stateless on the shared cluster.

---

## 5. REST endpoints (public, BFF-exposed)

Base: `/api/v1`. Guards: `@Roles(...)` from JWT claims (`household_id`, `user_id`, `role`).

| Method | Path | Roles | Proxies to |
|--------|------|-------|------------|
| GET | `/health` | public | local |
| POST | `/auth/login` | public | `SVC-ID` |
| POST | `/auth/refresh` | authenticated | `SVC-ID` |
| GET | `/households/{householdId}` | member | `SVC-ID` |
| GET | `/households/{householdId}/members` | member | `SVC-ID` |
| POST | `/households/{householdId}/invitations` | admin, superadmin | `SVC-ID` |
| POST | `/households/{householdId}/bank-connections` | admin, superadmin | `SVC-BANK` |
| GET | `/households/{householdId}/bank-connections` | admin, superadmin | `SVC-BANK` |
| DELETE | `/households/{householdId}/bank-connections/{connectionId}` | admin, superadmin | `SVC-BANK` |
| POST | `/households/{householdId}/bank-connections/{connectionId}/sync` | admin, superadmin | `SVC-BANK` |
| GET | `/households/{householdId}/import-previews/{previewId}` | admin, superadmin, user* | `SVC-BANK` |
| POST | `/households/{householdId}/import-previews/{previewId}/confirm` | admin, superadmin | `SVC-BANK` → `SVC-LED` |
| GET | `/households/{householdId}/transactions` | member (filtered) | `SVC-LED` |
| GET | `/households/{householdId}/budget/periods` | member | `SVC-BUD` |
| GET | `/households/{householdId}/budget/periods/{periodId}` | member | `SVC-BUD` |
| PUT | `/households/{householdId}/budget/categories/{categoryId}` | admin, superadmin, user† | `SVC-BUD` |
| POST | `/households/{householdId}/exports` | admin, superadmin, user | `SVC-EXP` |
| GET | `/households/{householdId}/exports/{exportJobId}` | same as create | `SVC-EXP` |
| GET | `/households/{householdId}/exports/{exportJobId}/download` | same as create | `SVC-EXP` |
| GET | `/ops/audit/events` | superadmin, ops | `SVC-AUD` |

\*User: preview rows for own-linked accounts only.  
†User: own-scope categories per [`household-rbac.md`](../domain/household-rbac.md).

**Denied at BFF (never proxied):** viewer → export, user → confirm import, any → connect bank without admin role.

---

## 6. Callers and callees

| Direction | Service |
|-----------|---------|
| **Callers** | Angular app |
| **Callees** | `SVC-ID`, `SVC-BANK`, `SVC-LED`, `SVC-BUD`, `SVC-EXP`, `SVC-AUD` |

---

## 7. Verification hooks

| Test | Proves |
|------|--------|
| JWT missing → `401` on protected routes | Auth guard |
| Viewer `POST .../exports` → `403` | RBAC at edge |
| User `POST .../confirm` → `403` | MO-2 guard |
| Confirm proxies with `X-Actor-User-Id` | Audit attribution |
| Correlation id present in downstream mock calls | Observability |
| No Mongo client in module graph | Stateless BFF |

---

## 8. Phase 2 touchpoints

**None in MVP.** Future: proxy routes for `PH2-FILE` upload and `PH2-OCR` preview under same guard patterns.

---

## 9. Persistence schema (Mongoose)

**No persistence.** `SVC-BFF` must not connect to MongoDB or any service database. JWT validation uses `SVC-ID`; all household and transaction data is proxied over REST. See [`../persistence/README.md`](../persistence/README.md).

---

## Related documents

- [`../architecture/architecture-overview.md`](../architecture/architecture-overview.md)
- [`../household-rbac.md`](../household-rbac.md)

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §12 Context ending | BFF beginning/ending layout |
| §9 Household RBAC | Guard matrix |
| §13 Low-level tasks | `TASK-BFF-*` |

**See also:** [`specification.md`](../../specification.md) — §12, §9, §13 (table above).
