# Internal API Routes (Service-to-Service)

> **Not public.** Called only between NestJS services. Product rules — [`specification.md`](../../specification.md) §5.

**Base path:** `/internal/v1`  
**Auth (MVP assumed):** Signed **service token** in `Authorization: Bearer <service-jwt>` or `X-Service-Token` header. Each service has a shared secret rotated via ops (document only; no secrets in repo).

**Alternative (post-MVP):** mTLS between pods — same route shapes.

---

## Route catalog

| Caller | Callee | Method | Path | Purpose |
|--------|--------|--------|------|---------|
| `SVC-BANK` | `SVC-LED` | POST | `/internal/v1/imports/{previewId}/apply` | Apply confirmed preview (sole ledger write path) |
| `SVC-BUD` | `SVC-LED` | GET | `/internal/v1/transactions` | Booked txns for rollups (`status=booked`) |
| `SVC-EXP` | `SVC-LED` | GET | `/internal/v1/transactions` | Rows for CSV snapshot |
| `SVC-BFF` | `SVC-*` | * | `/internal/v1/...` | Optional direct internal health (implementation choice) |
| `SVC-ID` | `SVC-BANK` | POST | `/internal/v1/connections/{id}/revoke` | Erasure: revoke tokens (stub in MVP tasks) |
| `SVC-BANK`, `SVC-LED`, `SVC-BUD`, `SVC-EXP`, `SVC-ID` | `SVC-AUD` | POST | `/internal/v1/audit/events` | Append-only audit |
| `SVC-BFF` | `SVC-AUD` | GET | `/internal/v1/audit/events` | Ops query (may mirror public `/ops/audit/events`) |

Per-service expansions: [`services/`](../services/).

---

## Invariants

1. Only **`SVC-LED`** writes `ledger_mvp.transactions`.
2. **`SVC-BANK`** holds previews in `bank_mvp` until confirm; apply is idempotent per `previewId`.
3. **`SVC-BUD`** and **`SVC-EXP`** must pass `status=booked` (or equivalent filter) on ledger reads.
4. Audit payloads must not contain tokens, PAN, or full CSV bodies — see [`../compliance/compliance-ukraine.md`](../compliance/compliance-ukraine.md).

---

## Apply import (`POST .../imports/{previewId}/apply`)

| Field / behavior | Rule |
|------------------|------|
| Idempotency | Same `previewId` → same ledger outcome (no duplicate inserts) |
| Response body | `created`, `updated`, `duplicate_skipped` counts |
| Failure | Invalid preview → `400`; aborted preview → `409` |
| Headers | Forward `X-Request-Id`, `X-Actor-User-Id`, `X-Actor-Role` from confirm chain |

---

## Ledger read (`GET .../transactions`)

| Query param | Required for consumers |
|-------------|------------------------|
| `household_id` | Yes |
| `status` | `booked` for BUD/EXP |
| `user_scope` | Role-filtered slice when caller is BFF proxy |
| `cursor`, `limit` | Pagination; max 200 |

---

## Related documents

- [`public-routes.md`](public-routes.md)
- [`headers.md`](headers.md)
- [`errors-and-status-codes.md`](errors-and-status-codes.md)
- [`../services/ledger.md`](../services/ledger.md)
- [`../services/bank-connector.md`](../services/bank-connector.md)
