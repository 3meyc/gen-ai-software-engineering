# Household RBAC

> Roles and permissions for the Mars Family demo household and all tenants. Enforced at `SVC-BFF` (guards) and originating services. IDs: `MO-4`, `SVC-ID`, `SVC-BFF`.

---

## Roles

| Role | Scope | Description |
|------|-------|-------------|
| **superadmin** | Household + platform override | Full household control; can confirm import, manage all members, invoke erasure; may access ops-style audit views when granted platform flag |
| **admin** | Household-wide | Connect/disconnect banks, **confirm import**, household-wide budget and transactions, export CSV, invite users |
| **user** | Per-user | View own linked accounts/transactions; edit own budget categories where allowed; cannot confirm household import unless promoted |
| **viewer** | Per-user read-only | Read scoped transactions/budget; **no** bank connect, **no** import confirm, **no** export |

### Mock household role assignment (Mars Family)

Documented in [`mocks/household-family.json`](../../mocks/household-family.json):

| Member | Role | Rationale |
|--------|------|-----------|
| Mother | superadmin | Primary account owner |
| Father | admin | Can confirm bank import; household-wide budget |
| Son, Daughter | user | Teen/adult members with own card visibility |
| Cat | viewer | Demo non-human profile; permission boundary tests |
| Uncle, Niece | viewer | Related viewers; no bank connect |

**Minors policy:** Son and Daughter are **user** (not viewer) so per-user transaction scope and budget participation can be tested. Viewers cannot export even if they see summary tiles.

---

## Permission matrix

| Action | superadmin | admin | user | viewer |
|--------|:----------:|:-----:|:----:|:------:|
| Invite / remove household member | ✓ | ✓ | — | — |
| Change member role | ✓ | ✓ (not above admin) | — | — |
| Connect bank (`MO-1`) | ✓ | ✓ | — | — |
| Disconnect bank | ✓ | ✓ | — | — |
| Trigger sync | ✓ | ✓ | — | — |
| View import preview | ✓ | ✓ | own-linked only | scoped read |
| **Confirm import** (`MO-2`) | ✓ | ✓ | — | — |
| View transactions | household | household | own user_id | scoped read |
| Edit budget categories/limits | ✓ | ✓ | own envelopes | — |
| View budget actuals | household (`MO-5`) | household | per-user scope | scoped read |
| Request CSV export (`MO-6`) | ✓ | ✓ | ✓ (own scope rows) | — |
| Download CSV | ✓ | ✓ | ✓ (redacted) | — |
| Request data erasure | ✓ | — | self only | — |
| Ops audit read (`MO-8`) | ✓ (platform) | — | — | — |

**Superadmin override:** Superadmin may confirm import on behalf of household even if local policy flags father absent; action audited as `actor_role=superadmin`. Admins cannot elevate to superadmin.

---

## Visibility rules (`MO-4`, `MO-5`)

| Data | admin / superadmin | user | viewer |
|------|-------------------|------|--------|
| Ledger transactions | All household booked txns | `user_id` on connection or attribution | Same as user but read-only |
| Budget rollups | Household totals | User slice only | Read-only slice |
| Export rows | Full household CSV (role redaction still applies to PII columns) | Rows for `user_id` + shared categories | Denied |

Budget and export services call `SVC-LED` / `SVC-ID` with `household_id` + `caller_role` + `caller_user_id`; filtering happens in service layer, not client.

---

## Special cases (edge / test)

| Case | Expected behavior |
|------|-------------------|
| Cat (viewer) hits export API | `403` + audit `export.denied` |
| User attempts confirm import | `403` |
| Admin confirms while sync running | Allowed; preview version pinned at confirm time |
| Uncle views daughter's transactions | Denied unless shared account tag (none in MVP mock) |

---

## REST guard convention (documentation)

```text
@Roles('admin', 'superadmin')  → confirm import, connect bank
@Roles('admin', 'superadmin', 'user') → export (viewer excluded)
@Roles('superadmin') → platform audit endpoints
```

---

## Related documents

- [`mocks/household-family.json`](../../mocks/household-family.json)
- [`compliance-ukraine.md`](../compliance/compliance-ukraine.md) — erasure and minimization
- [`scope-and-traceability.md`](../registry/scope-and-traceability.md) — `MO-4`
- [`architecture-overview.md`](../architecture/architecture-overview.md) — BFF propagation

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §9 Household RBAC | Role table + permission matrix |
| §10 Edge cases | Viewer export denied, cat profile |
| §11 Verification | RBAC integration tests per role |
| §3 Stakeholders | End-user roles called out |

**See also:** [`specification.md`](../../specification.md) — §9, §10, §11, §3 (table above).
