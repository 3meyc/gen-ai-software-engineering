# Configuration (Documentation)

> Environment variable names per service for future `homework-3/platform/` implementation. **No secrets in repo.**

---

## Per service

| Service | Variables (assumed) |
|---------|---------------------|
| `SVC-BFF` | `PORT`, `JWT_PUBLIC_KEY` or `JWT_SECRET`, `ID_SERVICE_URL`, `BANK_SERVICE_URL`, `LED_SERVICE_URL`, `BUD_SERVICE_URL`, `EXP_SERVICE_URL`, `AUD_SERVICE_URL`, `SERVICE_TOKEN` |
| `SVC-ID` | `PORT`, `MONGO_URI`, `DB_NAME=identity_mvp`, `JWT_SECRET`, `JWT_EXPIRY` |
| `SVC-BANK` | `PORT`, `MONGO_URI`, `DB_NAME=bank_mvp`, `TOKEN_ENCRYPTION_KEY`, `MONO_CLIENT_ID`, `OTP_CLIENT_ID`, `PRIVAT24_CLIENT_ID`, `SERVICE_TOKEN`, `LED_SERVICE_URL` |
| `SVC-LED` | `PORT`, `MONGO_URI`, `DB_NAME=ledger_mvp`, `SERVICE_TOKEN`, `AUD_SERVICE_URL` |
| `SVC-BUD` | `PORT`, `MONGO_URI`, `DB_NAME=budget_mvp`, `LED_SERVICE_URL`, `SERVICE_TOKEN`, `AUD_SERVICE_URL` |
| `SVC-EXP` | `PORT`, `MONGO_URI`, `DB_NAME=export_mvp`, `LED_SERVICE_URL`, `EXPORT_MAX_ROWS=50000`, `SERVICE_TOKEN`, `AUD_SERVICE_URL` |
| `SVC-AUD` | `PORT`, `MONGO_URI`, `DB_NAME=audit_mvp`, `SERVICE_TOKEN` |
| Angular `web` | `API_BASE_URL` (BFF `/api/v1`) |

Use `.env.example` per app under `platform/` when implementing — never commit real OAuth secrets or encryption keys.

---

## Related documents

- [`architecture-overview.md`](architecture-overview.md)
- [`../api/internal-routes.md`](../api/internal-routes.md)
- [`../../agents.md`](../../agents.md) §3
