# HTTP Headers (MVP)

> Correlation and actor propagation per [`specification.md`](../../specification.md) §5 and §4 (reliability).

---

## Public (client → BFF)

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes (except login/health) | `Bearer <jwt>` — claims: `user_id`, `household_id`, `role` |
| `Content-Type` | On JSON bodies | `application/json` |
| `X-Request-Id` | Recommended | Client-generated UUID; BFF generates if absent and forwards downstream |

---

## BFF → downstream services

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Service token (internal) or propagated user JWT per route design |
| `X-Request-Id` | Yes | Same id end-to-end for log correlation |
| `X-Actor-User-Id` | On mutating household actions | JWT `user_id` performing the action |
| `X-Actor-Role` | On confirm, export, erasure | `admin`, `superadmin`, `user`, `viewer` — audit uses `actor_role=superadmin` when applicable |
| `X-Household-Id` | When path ambiguous | Must match JWT `household_id` or `403` |

---

## Forbidden in logs

Never log header values for:

- Raw `Authorization` (JWT or service token)
- Bank OAuth tokens

---

## Related documents

- [`public-routes.md`](public-routes.md)
- [`internal-routes.md`](internal-routes.md)
- [`../agents.md`](../../agents.md) §5
