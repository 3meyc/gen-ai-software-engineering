# Service: identity-household (`SVC-ID`)

> Users, households, memberships, invitations, role bindings. Port **3001**. Database: **`identity_mvp`**.

---

## 1. Purpose and owned aggregates

| Aggregate | Collection | Description |
|-----------|------------|-------------|
| User | `users` | Profile, email hash, auth subject |
| Household | `households` | Tenant boundary (`hh_mars_001` in mocks) |
| Membership | `memberships` | `user_id` + `household_id` + `role` |
| Invitation | `invitations` | Pending invites with expiry |
| Erasure request | `erasure_requests` | Orchestration state for MO-7 |

**Primary MOs:** `MO-4`, `MO-7` (erasure initiation), supports all flows via JWT claims.

---

## 2. Beginning context

```text
services/identity-household/
  src/main.ts
  package.json          # @nestjs/core, mongoose
```

* Empty `identity_mvp` database  
* No seed data

---

## 3. Ending context

```text
services/identity-household/
  src/users/
  src/households/
  src/memberships/
  src/invitations/
  src/erasure/
  src/auth/              # login, refresh, JWT issue
  seeds/mars-family.ts   # loads mocks/household-family.json
```

**Indexes:**

| Collection | Index |
|------------|-------|
| `users` | `{ email: 1 }` unique |
| `memberships` | `{ household_id: 1, user_id: 1 }` unique |
| `memberships` | `{ household_id: 1, role: 1 }` |
| `invitations` | `{ token: 1 }` unique, TTL on `expires_at` |

**Seed reference:** [`../../mocks/household-family.json`](../../mocks/household-family.json) — Mars Family roles for integration tests.

---

## 4. MongoDB database

**`identity_mvp`** on shared cluster.

---

## 5. REST endpoints

### Public / BFF-proxied (`/api/v1`)

| Method | Path | Roles | Action |
|--------|------|-------|--------|
| POST | `/auth/login` | public | Issue JWT |
| POST | `/auth/refresh` | authenticated | Rotate JWT |
| GET | `/households/{householdId}` | member | Household metadata |
| GET | `/households/{householdId}/members` | member | List memberships |
| POST | `/households/{householdId}/invitations` | admin, superadmin | Create invite |
| PATCH | `/households/{householdId}/members/{userId}` | admin, superadmin | Change role (cap: cannot grant superadmin unless caller is superadmin) |
| DELETE | `/households/{householdId}/members/{userId}` | admin, superadmin | Remove member |
| POST | `/households/{householdId}/erasure-requests` | superadmin, user (self) | Start erasure (`MO-7`) |

### Internal (`/internal/v1`, service token)

| Method | Path | Caller | Action |
|--------|------|--------|--------|
| GET | `/internal/memberships/resolve` | BFF, BANK, LED, BUD, EXP | `?household_id=&user_id=` → role + scope |
| POST | `/internal/audit/events` | — | ID writes to `SVC-AUD` via AUD client on erasure |

---

## 6. Callers and callees

| Callers | Callees |
|---------|---------|
| `SVC-BFF` | `SVC-AUD` (erasure events) |

Does not call ledger or bank directly.

---

## 7. Verification hooks

| Test | Proves |
|------|--------|
| Seed loads 7 Mars members with correct roles | Fixture alignment |
| Admin cannot PATCH role to `superadmin` | RBAC cap |
| JWT contains `household_id`, `role`, `user_id` | BFF dependency |
| Erasure request creates audit event | MO-7 |
| Membership unique constraint | Data integrity |

---

## 8. Phase 2 touchpoints

**None in MVP.** Erasure orchestration may later call file/OCR purge endpoints when `PH2-*` sources exist.

---

## 9. Persistence schema (Mongoose)

Database: **`identity_mvp`**. OpenAPI shapes: [`../api/openapi/`](../api/openapi/). Indexes in §3 above.

### `users`

| Field | BSON type | Required | Constraints | Notes |
|-------|-----------|----------|-------------|-------|
| `_id` | ObjectId | auto | — | Internal |
| `user_id` | string | yes | unique | e.g. `usr_mars_father` |
| `email` | string | yes | unique, indexed | Login identifier |
| `email_hash` | string | no | — | Optional search hash |
| `display_name` | string | yes | — | |
| `password_hash` | string | yes | — | Never log or expose |
| `is_human` | bool | yes | default true | `false` for demo pet viewer |
| `profile_label` | string | no | — | e.g. `demo_pet_viewer` |
| `created_at` | Date | yes | — | UTC |
| `updated_at` | Date | yes | — | UTC |

### `households`

| Field | BSON type | Required | Constraints | Notes |
|-------|-----------|----------|-------------|-------|
| `household_id` | string | yes | unique | e.g. `hh_mars_001` |
| `display_name` | string | yes | — | |
| `currency_default` | string | yes | ISO 4217 | Default `UAH` |
| `jurisdiction` | string | yes | — | `UA` for MVP |
| `created_at` | Date | yes | — | |

### `memberships`

| Field | BSON type | Required | Constraints | Notes |
|-------|-----------|----------|-------------|-------|
| `household_id` | string | yes | compound unique with `user_id` | |
| `user_id` | string | yes | compound unique with `household_id` | |
| `role` | string | yes | enum: superadmin, admin, user, viewer | Exact strings for guards |
| `relationship` | string | no | — | Optional relative label |
| `joined_at` | Date | yes | — | |

### `invitations`

| Field | BSON type | Required | Constraints | Notes |
|-------|-----------|----------|-------------|-------|
| `invitation_id` | string | yes | unique | |
| `household_id` | string | yes | — | |
| `email` | string | yes | — | |
| `role` | string | yes | enum | Cannot exceed inviter cap |
| `token` | string | yes | unique, indexed | TTL index on `expires_at` |
| `expires_at` | Date | yes | TTL | |
| `status` | string | yes | pending, accepted, expired | |

### `erasure_requests`

| Field | BSON type | Required | Constraints | Notes |
|-------|-----------|----------|-------------|-------|
| `erasure_request_id` | string | yes | unique | |
| `household_id` | string | yes | — | |
| `subject_user_id` | string | yes | — | Self or household per scope |
| `requested_by` | string | yes | — | Actor |
| `status` | string | yes | requested, in_progress, completed | |
| `acknowledged_at` | Date | no | — | ≤ 24h SLA (doc) |
| `completed_at` | Date | no | — | PII purge ≤ 30 days |

---

## Related documents

- [`../domain/household-rbac.md`](../domain/household-rbac.md)
- [`../../mocks/household-family.json`](../../mocks/household-family.json)
- [`../compliance/compliance-ukraine.md`](../compliance/compliance-ukraine.md)
- [`../compliance/data-lifecycle-mvp.md`](../compliance/data-lifecycle-mvp.md)

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §12 Context ending | Identity service artifacts |
| §9 Household RBAC | Membership model |
| §13 Low-level tasks | `TASK-ID-*` |

**See also:** [`specification.md`](../../specification.md) — §12, §9, §13 (table above).
