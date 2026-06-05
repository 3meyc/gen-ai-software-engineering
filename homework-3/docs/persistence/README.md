# Persistence Index (MongoDB)

> Field-level Mongoose schemas live in each [`services/*.md`](../services/) **§9**. HTTP JSON shapes: [`api/openapi/`](../api/openapi/).

---

## Databases (shared cluster)

| Database | Service | Collections |
|----------|---------|-------------|
| `identity_mvp` | `SVC-ID` | `users`, `households`, `memberships`, `invitations`, `erasure_requests` |
| `bank_mvp` | `SVC-BANK` | `connections`, `tokens`, `sync_checkpoints`, `import_previews`, `raw_payloads` |
| `ledger_mvp` | `SVC-LED` | `transactions`, `import_batches`, `dedup_fingerprints` |
| `budget_mvp` | `SVC-BUD` | `categories`, `budget_periods`, `period_limits`, `user_envelopes` |
| `export_mvp` | `SVC-EXP` | `export_jobs`, `export_artifacts` |
| `audit_mvp` | `SVC-AUD` | `audit_events` |
| — | `SVC-BFF` | **No database** |

---

## Cross-cutting rules

1. **One DB per service** — no cross-service collection writes.
2. **Ledger sole writer** — only `SVC-LED` inserts/updates/deletes `ledger_mvp.transactions`.
3. **Confirm before ledger** — preview rows stay in `bank_mvp.import_previews` until apply.
4. **Booked-only consumers** — `SVC-BUD` and `SVC-EXP` read ledger with `status=booked`.
5. **Money** — store as Decimal128 or string; API uses string decimals per [`specification.md`](../../specification.md) §5.
6. **Tokens** — encrypt at rest in `bank_mvp.tokens`; never in audit `payload`.

---

## Related

- [`../architecture/architecture-overview.md`](../architecture/architecture-overview.md)
- [`../domain/canonical-banking-transaction-model.md`](../domain/canonical-banking-transaction-model.md)
- [`../../mocks/README.md`](../../mocks/README.md)
