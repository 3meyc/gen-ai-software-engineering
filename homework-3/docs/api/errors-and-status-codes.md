# Errors and HTTP Status Codes

> Maps [`specification.md` §10](../../specification.md#10-edge-cases-and-failure-modes) edge cases to HTTP behavior. **Authority** for implementers; BFF should fail closed on auth.

---

## Standard codes

| Code | When |
|------|------|
| `401` | Missing or invalid JWT |
| `403` | Valid JWT but role/scope denied |
| `404` | Resource not found (household, preview, export job) |
| `409` | Conflict / aborted state (confirm on aborted preview, download incomplete export) |
| `400` | Validation failure (unknown audit event type, malformed body) |
| `429` | Rate limit (bank provider; BFF may surface as retry-after) |
| `500` | Unhandled server error (no secret details in body) |

---

## §10 edge case catalog

| Scenario | HTTP (typical) | User-visible | Audit `event_type` |
|----------|----------------|--------------|-------------------|
| Token revoked **mid-import** | Confirm: `409`; preview status `aborted` | Re-connect bank | `token.revoked`, `import.aborted` |
| Duplicate overlap on re-sync | Apply: `200` with `duplicate_skipped` > 0 | Summary shows skipped dupes | `duplicate.skipped` |
| User attempts confirm import | `403` (BFF) | Permission denied | — |
| **Cat (viewer)** calls export API | `403` (BFF) | Export not available | `export.denied` |
| Admin confirms while sync still running | `200` confirm | Apply uses pinned preview version | `import.confirmed` |
| Empty budget month (no booked txns) | `200` with zero actuals | Empty state UI | — |
| Export during active sync | `202`/`200` job created | Snapshot at job `created_at` | `export.requested` |
| Bank `429` rate limit | Sync: retry; preview `delayed` flag | Delayed import notice | — |
| Sign/direction mismatch in mapping | Preview row `quarantined`; confirm blocked | Fix row message | — |
| Uncle views daughter's transactions | `403` or empty filtered set | No access | — |
| Double confirm same `previewId` | `200` idempotent apply | Same summary | `import.confirmed` |
| Superadmin confirms when father absent | `200` | Success | `import.confirmed` (`actor_role=superadmin`) |
| Pending txn in preview | N/A at API | Excluded from budget/export queries | — |
| Erasure in progress | New sync: `409` or blocked | Erasure in progress | `erasure.requested` |

---

## BFF guard matrix (quick reference)

| Action | superadmin | admin | user | viewer |
|--------|:----------:|:-----:|:----:|:------:|
| Confirm import | ✓ | ✓ | `403` | `403` |
| CSV export | ✓ | ✓ | ✓ (scoped) | `403` + audit |
| Connect bank | ✓ | ✓ | `403` | `403` |

Full matrix: [`../domain/household-rbac.md`](../domain/household-rbac.md).

---

## Downstream propagation

- BFF maps downstream `4xx` without exposing internal stack traces.
- Internal apply failures from `SVC-LED` return `4xx` to `SVC-BANK`; BFF surfaces appropriate code to client.
- Never return token or PAN fragments in error JSON.

---

## Related documents

- [`public-routes.md`](public-routes.md)
- [`../../agents.md`](../../agents.md) §7 (edge cases)
- [`../testing/testing-strategy.md`](../testing/testing-strategy.md)
