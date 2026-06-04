# Service: bank-connector (`SVC-BANK`)

> `BankProvider` adapters (Mono, OTP, Privat24), token storage, scheduled sync, import **preview** and **confirm** orchestration. Port **3002**. Database: **`bank_mvp`**.

---

## 1. Purpose and owned aggregates

| Aggregate | Collection | Description |
|-----------|------------|-------------|
| Bank connection | `connections` | Household link to provider |
| OAuth token | `tokens` | Encrypted secrets; see [`data-lifecycle-mvp.md`](../compliance/data-lifecycle-mvp.md) |
| Sync checkpoint | `sync_checkpoints` | Per account incremental watermark |
| Import preview | `import_previews` | Pending txns + summary before confirm |
| Raw payload archive | `raw_payloads` | Optional compressed provider JSON (TTL) |

**Does not own** canonical booked transactions — apply via `SVC-LED` after confirm.

**Primary MOs:** `MO-1`, `MO-2`, `MO-7` (connect/disconnect audit).

---

## 2. Beginning context

```text
services/bank-connector/
  src/main.ts
  src/providers/         # empty BankProvider interface only
```

* No connections, no cron jobs

---

## 3. Ending context

```text
services/bank-connector/
  src/providers/
    bank-provider.port.ts
    mono.adapter.ts
    otp.adapter.ts
    privat24.adapter.ts
  src/connections/
  src/sync/
    incremental-sync.job.ts    # every 15 min
  src/import/
    preview.service.ts
    confirm.service.ts         # calls SVC-LED apply
  src/tokens/                  # encrypt at rest
```

**Indexes:**

| Collection | Index |
|------------|-------|
| `connections` | `{ household_id: 1, source_system: 1 }` |
| `tokens` | `{ connection_id: 1 }` unique |
| `import_previews` | `{ preview_id: 1 }` unique |
| `import_previews` | `{ household_id: 1, status: 1, created_at: -1 }` |
| `sync_checkpoints` | `{ connection_id: 1, source_account_id: 1 }` unique |

---

## 4. MongoDB database

**`bank_mvp`** on shared cluster.

---

## 5. REST endpoints

### BFF-proxied (`/api/v1`)

| Method | Path | Roles | Action |
|--------|------|-------|--------|
| POST | `/households/{householdId}/bank-connections` | admin, superadmin | Start OAuth (`MO-1`) |
| GET | `/households/{householdId}/bank-connections` | admin, superadmin | List connections |
| GET | `/households/{householdId}/bank-connections/{connectionId}` | admin, superadmin | Connection detail |
| DELETE | `/households/{householdId}/bank-connections/{connectionId}` | admin, superadmin | Revoke + purge tokens |
| POST | `/households/{householdId}/bank-connections/{connectionId}/sync` | admin, superadmin | Trigger sync → new/updated preview |
| GET | `/households/{householdId}/import-previews/{previewId}` | admin, superadmin, user* | Preview summary + txns |
| POST | `/households/{householdId}/import-previews/{previewId}/confirm` | admin, superadmin | Confirm → `SVC-LED` apply (`MO-2`) |

\*User: filtered preview rows by `owner_user_id` on connection.

### Internal

| Method | Path | Caller | Action |
|--------|------|--------|--------|
| POST | `/internal/oauth/callback` | provider redirect | Complete auth |
| POST | `/internal/audit/events` | self → AUD | connect, sync, confirm |

### Downstream (callee)

| Method | Path | Target | Action |
|--------|------|--------|--------|
| POST | `/internal/imports/{previewId}/apply` | `SVC-LED` | Idempotent ledger upsert after confirm |

---

## 6. Callers and callees

| Callers | Callees |
|---------|---------|
| `SVC-BFF` | `SVC-LED`, `SVC-AUD`, `SVC-ID` (resolve connection owner) |
| Cron worker | `BankProvider` APIs, `SVC-AUD` |

---

## 7. Verification hooks

| Test | Proves |
|------|--------|
| OAuth complete stores encrypted token, never logs raw | MO-7 |
| Sync creates preview with `status=pending_confirmation` | MO-1 |
| Confirm without admin → not applicable (BFF); service rejects missing preview | MO-2 |
| Double confirm same `previewId` → idempotent apply | MO-3 |
| Revoke mid-preview marks preview `aborted` | Edge case |
| Mono adapter maps signed amount per canonical rule | Provider port |
| Ledger not written before confirm | Booked-only path |

---

## 8. Phase 2 touchpoints

| ID | Touchpoint |
|----|------------|
| `PH2-FILE` | New adapter + preview parser |
| `PH2-OCR` | Receipt upload + always-confirm preview |
| `PH2-CASH` | Manual entry preview (TBD collection) |

MVP: **bank API only** per [`bank-provider-adapter.md`](../domain/bank-provider-adapter.md).

---

## 9. Persistence schema (Mongoose)

Database: **`bank_mvp`**. Preview transactions are **not** ledger rows until confirm → apply. Indexes in §3.

### `connections`

| Field | BSON type | Required | Constraints | Notes |
|-------|-----------|----------|-------------|-------|
| `connection_id` | string | yes | unique | e.g. `mono_conn_mars_01` |
| `household_id` | string | yes | indexed with `source_system` | |
| `source_system` | string | yes | mono, otp, privat24 | |
| `owner_user_id` | string | yes | — | Links to `users.user_id` |
| `status` | string | yes | pending, active, revoked, error | |
| `created_at` | Date | yes | — | |
| `updated_at` | Date | yes | — | |

### `tokens`

| Field | BSON type | Required | Constraints | Notes |
|-------|-----------|----------|-------------|-------|
| `connection_id` | string | yes | unique | FK to connection |
| `access_token_enc` | Binary | yes | encrypted at rest | Never log |
| `refresh_token_enc` | Binary | no | encrypted | |
| `expires_at` | Date | no | — | |
| `rotated_at` | Date | no | — | |

### `sync_checkpoints`

| Field | BSON type | Required | Constraints | Notes |
|-------|-----------|----------|-------------|-------|
| `connection_id` | string | yes | compound unique with `source_account_id` | |
| `source_account_id` | string | yes | compound unique | Provider account id |
| `watermark` | string | no | — | Incremental cursor |
| `last_sync_at` | Date | no | — | |

### `import_previews`

| Field | BSON type | Required | Constraints | Notes |
|-------|-----------|----------|-------------|-------|
| `preview_id` | string | yes | unique | |
| `household_id` | string | yes | indexed with `status` | |
| `connection_id` | string | yes | — | |
| `status` | string | yes | pending_confirmation, confirmed, aborted | Aborted on token revoke |
| `pinned_version` | string | no | — | Set at confirm |
| `summary` | object | no | — | ready/quarantined/duplicate counts |
| `transactions` | array | yes | embedded | See **Preview row** below |
| `created_at` | Date | yes | — | Retention 90 days |
| `confirmed_at` | Date | no | — | |

**Preview row** (embedded in `transactions[]`):

| Field | BSON type | Required | Notes |
|-------|-----------|----------|-------|
| `source_system` | string | yes | |
| `source_transaction_id` | string | yes | |
| `amount` | string | yes | Decimal string; sign must match `direction` |
| `currency` | string | yes | |
| `direction` | string | yes | debit, credit |
| `status` | string | yes | pending, booked, … |
| `row_status` | string | yes | ready, quarantined, duplicate_skipped | |
| `description` | string | no | |

### `raw_payloads` (optional)

| Field | BSON type | Required | Constraints | Notes |
|-------|-----------|----------|-------------|-------|
| `payload_id` | string | yes | unique | |
| `connection_id` | string | yes | — | |
| `provider_response` | Binary | yes | compressed | TTL index recommended |
| `captured_at` | Date | yes | TTL | Not used for budget/export |

---

## Related documents

- [`../bank-provider-adapter.md`](../bank-provider-adapter.md)
- [`../domain/ingestion-sources-matrix.md`](../domain/ingestion-sources-matrix.md)
- [`../domain/canonical-banking-transaction-model.md`](../domain/canonical-banking-transaction-model.md)
- [`../compliance/data-lifecycle-mvp.md`](../compliance/data-lifecycle-mvp.md)

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §7 BankProvider | Adapter placement |
| §6 Ingestion sources | Confirm pipeline |
| §13 Low-level tasks | `TASK-BANK-*` |

**See also:** [`specification.md`](../../specification.md) — §7, §6, §13 (table above).
