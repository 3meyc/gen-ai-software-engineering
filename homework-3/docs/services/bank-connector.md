# Service: bank-connector (`SVC-BANK`)

> `BankProvider` adapters (Mono, OTP, Privat24), token storage, scheduled sync, import **preview** and **confirm** orchestration. Port **3002**. Database: **`bank_mvp`**.

---

## 1. Purpose and owned aggregates

| Aggregate | Collection | Description |
|-----------|------------|-------------|
| Bank connection | `connections` | Household link to provider |
| OAuth token | `tokens` | Encrypted secrets; see [`data-lifecycle.md`](../data-lifecycle.md) |
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

MVP: **bank API only** per [`bank-provider-adapter.md`](../bank-provider-adapter.md).

---

## Related documents

- [`../bank-provider-adapter.md`](../bank-provider-adapter.md)
- [`../ingestion-sources-matrix.md`](../ingestion-sources-matrix.md)
- [`../canonical-banking-transaction-model.md`](../canonical-banking-transaction-model.md)
- [`../data-lifecycle.md`](../data-lifecycle.md)

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §7 BankProvider | Adapter placement |
| §6 Ingestion sources | Confirm pipeline |
| §13 Low-level tasks | `TASK-BANK-*` |

*Final synthesis in Phase 4 — see `specification.md` when published.*
