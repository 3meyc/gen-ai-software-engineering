# Data Ownership

> Extracted from [`architecture-overview.md`](architecture-overview.md). **Invariant:** only `SVC-LED` writes `ledger_mvp.transactions`.

---

## Collection writers and readers

| Collection (logical) | Writer | Readers |
|---------------------|--------|---------|
| `users`, `households`, `memberships` | `SVC-ID` | BFF |
| `connections`, `tokens`, `import_previews` | `SVC-BANK` | BFF |
| `transactions` | **`SVC-LED` only** | BUD, EXP, BFF |
| `categories`, `budget_periods` | `SVC-BUD` | BFF |
| `export_jobs` | `SVC-EXP` | BFF |
| `audit_events` | `SVC-AUD` | BFF (ops) |

---

## Forbidden

- `SVC-BUD` or `SVC-BANK` writing directly to `ledger_mvp.transactions`
- Any service writing another service's MongoDB database

---

## Database names (shared cluster)

`identity_mvp`, `bank_mvp`, `ledger_mvp`, `budget_mvp`, `export_mvp`, `audit_mvp` — see [`specification.md` §5](../../specification.md#5-implementation-notes).
