# Bank Provider Adapter

> Abstract port for Mono, OTP, and Privat24. Implemented in `SVC-BANK` (`bank_mvp`). See [`ingestion-sources-matrix.md`](ingestion-sources-matrix.md) for trust/confirmation policy.

---

## `BankProvider` port

All three MVP banks implement this interface. Adapters are **stateless**; connection state lives in `bank_mvp` collections (`connections`, `tokens`, `sync_checkpoints`).

```typescript
interface BankProvider {
  /** Provider enum value for canonical source_system */
  readonly sourceSystem: 'mono' | 'otp' | 'privat24';

  /** Start OAuth / API key flow; returns authorization URL or session handle */
  authenticate(params: AuthenticateParams): Promise<AuthChallenge>;

  /** Exchange auth code or complete device flow; persist tokens via connector service */
  completeAuthentication(params: CompleteAuthParams): Promise<ConnectionRef>;

  /** List accounts/cards available after connection */
  listAccounts(connectionId: string): Promise<SourceAccount[]>;

  /** Fetch transactions for one account; supports incremental watermark */
  fetchTransactions(
    connectionId: string,
    accountId: string,
    options: FetchOptions,
  ): Promise<FetchTransactionsResult>;

  /** Return provider-specific checkpoint string for next incremental sync */
  getCheckpoint(connectionId: string, accountId: string): Promise<string | null>;

  /** Revoke tokens at bank where supported; always clear local secrets */
  revoke(connectionId: string): Promise<void>;
}
```

### Supporting types (documentation contract)

| Type | Fields (summary) |
|------|------------------|
| `FetchOptions` | `from?: ISO8601`, `to?: ISO8601`, `checkpoint?: string`, `pageSize?: number` (default 100) |
| `FetchTransactionsResult` | `transactions: SourceTransaction[]`, `nextCheckpoint?: string`, `hasMore: boolean` |
| `SourceTransaction` | Raw bank payload + minimal normalized preview fields before full canonical mapping |

Mapping from `SourceTransaction` → canonical entity is defined in [`canonical-banking-transaction-model.md`](canonical-banking-transaction-model.md).

---

## Operations and idempotency

| Operation | Idempotent | Notes |
|-----------|------------|-------|
| `authenticate` | Yes (new challenge per call) | Does not mutate ledger |
| `completeAuthentication` | Per `state` nonce | Duplicate callback ignored |
| `listAccounts` | Yes | Cacheable short TTL in BFF only |
| `fetchTransactions` | Yes per checkpoint | Re-fetch same range returns same `source_transaction_id` set |
| `revoke` | Yes | Second revoke is no-op locally |

Scheduled sync jobs (`SVC-BANK`) call `fetchTransactions` with stored checkpoint; results land in **import preview**, not ledger, until confirm (`MO-2`).

---

## Per-bank deltas

| Aspect | Mono | OTP | Privat24 |
|--------|------|-----|----------|
| **Auth style** | OAuth 2.0 (authorization code) | OAuth 2.0 + bank-specific consent screen | OAuth 2.0 / partner token (abstracted) |
| **Connection identifier** | `mono_conn_*` | `otp_conn_*` | `p24_conn_*` |
| **Primary transaction ID field** | `id` → `source_transaction_id` | `transactionId` | `ref` / `paymentRef` |
| **Account ID field** | `account` / jar `jarId` in metadata | `accountNumber` (masked) | `cardId` |
| **Amount representation** | Signed decimal string | Absolute value + `debitCredit` flag → normalize to signed | Signed `amount` |
| **Booking time field** | `time` (Unix s) → UTC | `bookingDate` + `bookingTime` | `dateOper` |
| **Pagination** | Cursor `page` + `size` | `offset` + `limit` | `startDate` window + `continue` token |
| **Incremental sync** | `from` timestamp + last `id` checkpoint | `changedSince` watermark | `continue` reference |
| **Webhooks (optional)** | Supported (push notify → pull) | Optional polling only in MVP | Optional |
| **Typical error codes** | `401` token expired, `429` rate limit | `403` consent revoked | `400` invalid date range |
| **Revoke** | Token revoke endpoint | Consent withdrawal API | Disconnect API |

### Error handling (all providers)

| Code class | BFF/user message | Retry |
|------------|------------------|-------|
| Auth expired | Re-connect bank | No auto-retry until refresh |
| Rate limited | Sync delayed | Exponential backoff job |
| Partial page failure | Preview incomplete flag | Retry job slice |
| Revoked mid-import | Abort preview batch; audit | Manual re-sync |

---

## Canonical mapping highlights

| Bank field | Canonical field |
|------------|-----------------|
| Provider txn id | `source_transaction_id` |
| Provider account/card id | `source_account_id` |
| Settled time | `booking_timestamp` (UTC) |
| Auth/hold time | `transaction_timestamp` (optional) |
| Normalized signed amount | `amount` + `direction` (must agree — see canonical doc) |
| Raw enum/type | `transaction_type` + `metadata.{bank}` |

---

## Architecture placement

```text
Angular → SVC-BFF → SVC-BANK (BankProvider adapter)
                         ↓ REST (post-confirm)
                    SVC-LED (canonical upsert)
```

No adapter writes to `ledger_mvp` directly.

---

## Related documents

- [`canonical-banking-transaction-model.md`](canonical-banking-transaction-model.md)
- [`deduplication-reconciliation-specification.md`](deduplication-reconciliation-specification.md)
- [`data-lifecycle.md`](data-lifecycle.md) — token storage and rotation
- [`architecture-overview.md`](architecture-overview.md) — REST boundaries

---

## Spec incorporation

| `specification.md` section | Content from this doc |
|----------------------------|------------------------|
| §7 BankProvider | Port method list + Mono/OTP/Privat24 delta table |
| §6 Ingestion sources | Pointer to matrix for trust/confirm |
| §10 Edge cases | Token revoke mid-import, rate limit |
| §5 Implementation notes | Checkpoint incremental sync |

**See also:** [`specification.md`](../specification.md) — §7, §6, §10, §5 (table above).
