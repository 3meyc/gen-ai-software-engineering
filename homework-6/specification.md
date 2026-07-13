# Transaction Processing Pipeline — Product Specification

> Ingest this specification, implement the Low-Level Tasks, and satisfy the High- and Mid-Level Objectives.

**Author:** Maxim Ogorodnikov  
**Stack:** Node.js 18+ · TypeScript · Hono · Vite + Svelte 5 · decimal.js · Vitest · MCP

---

## 1. High-Level Objective

Process raw banking transactions from `sample-transactions.json` through a file-based TypeScript pipeline (validation → fraud detection → compliance check) and expose results via `shared/results/`, a Hono API, and a Svelte dashboard.

---

## 2. Mid-Level Objectives

| ID | Objective | Verifiable via |
|----|-----------|----------------|
| **MO-1** | Reject invalid records at validation (bad currency, non-positive amount) with `status: rejected` and `reason` in `shared/results/` | TXN006 (`XYZ`), TXN007 (`-100.00`) |
| **MO-2** | Flag high-value transactions (≥ **$10,000 USD** equivalent) for fraud review with a numeric `risk_score` | TXN002 ($25,000), TXN005 ($75,000) |
| **MO-3** | Elevate fraud score for cross-border (`metadata.country` ≠ `US`) and unusual timing (**02:00–05:00 UTC**) | TXN004 (02:47 UTC, DE/EUR) |
| **MO-4** | Compliance stage enforces reporting thresholds: wire transfers ≥ $10,000 or fraud score ≥ 50 receive `compliance_status: flagged`; aggregate run summary in `pipeline-summary.json` | TXN002, TXN005 |
| **MO-5** | Every stage writes an audit log line: ISO 8601 timestamp, stage name, `transaction_id`, outcome — **no plaintext account numbers or names** | All stages, all 8 transactions |

---

## 3. Implementation Notes

### Tech stack

A **TypeScript** transaction processing pipeline on **Node.js**: file-based stages (validation, fraud detection, compliance) orchestrated by a Node runner, with precise monetary handling via **decimal.js**. A **Hono** API exposes pipeline triggers and reads results from `shared/results/`. A **Vite + Svelte 5** dashboard lets users run the pipeline and view pass/fail counts and rejection reasons. **Vitest** covers unit and integration tests with an 80%+ coverage gate. A custom **MCP server** (Node MCP SDK) plus **context7** integrate pipeline status into the AI workflow.

### Monetary values

- Use `decimal.js` (`Decimal` type) for all amount parsing, comparison, and threshold checks.
- Store and pass amounts as **strings** in JSON (e.g. `"1500.00"`).
- **Never** use JavaScript `number` or `float` for money math.

### Currency

- Accept only ISO 4217 codes: `USD`, `EUR`, `GBP`, `JPY` (extend whitelist as needed).
- Reject unknown codes (e.g. `XYZ` in TXN006) at validation with a clear `reason`.

### USD equivalent (fraud/compliance thresholds)

For non-USD currencies, convert to USD using fixed demo rates (document in code):

| Currency | Rate (1 unit → USD) |
|----------|---------------------|
| EUR | 1.08 |
| GBP | 1.27 |
| USD | 1.00 |

### Logging & PII

- Structured audit log per stage: `{ timestamp, stage, transaction_id, outcome }`.
- Timestamps in ISO 8601 (UTC).
- **Do not** log `source_account`, `destination_account`, or `description` in plaintext; mask accounts as `ACC-****` if referenced.

### Inter-stage protocol

Directories under `shared/`:

```
shared/
├── input/       ← orchestrator drops initial records
├── processing/  ← stage moves record here while working
├── output/      ← stage writes result for next stage
└── results/     ← final outcomes
```

Standard envelope between stages:

```json
{
  "message_id": "uuid4-string",
  "timestamp": "2026-03-16T10:00:00Z",
  "source_stage": "validator",
  "target_stage": "fraud_detector",
  "message_type": "transaction",
  "data": {
    "transaction_id": "TXN001",
    "amount": "1500.00",
    "currency": "USD",
    "status": "validated"
  }
}
```

Rejected transactions skip later stages; validator writes directly to `shared/results/{transaction_id}.json`.

### Project layout

```text
homework-6/
  src/
    orchestrator.ts          # loads sample data, runs stages in order
    pipeline/
      validator.ts
      fraud-detector.ts
      compliance.ts
    api/                     # Hono REST app (Task 2)
  frontend/                  # Vite + Svelte 5 dashboard (Task 2)
  shared/{input,processing,output,results}/
  tests/
  mcp/
```

---

## 4. Context

### Beginning context

- [`sample-transactions.json`](sample-transactions.json) — 8 raw transaction records
- Empty `shared/` directories (created by orchestrator on first run)
- No pipeline code, tests, or front-end

### Ending context (full capstone — Tasks 2–5)

- All 8 transactions appear in `shared/results/` with `final_status` (`approved`, `fraud_review`, or `rejected`)
- `shared/results/pipeline-summary.json` with pass/fail/review counts
- Hono API at `src/api/` — trigger runs, list results
- Svelte dashboard at `frontend/` — run pipeline, view status and rejection reasons
- Vitest coverage ≥ 90% (gate ≥ 80%)
- Custom MCP server + `research-notes.md` with 2+ context7 queries
- `README.md`, `HOWTORUN.md`, `docs/presentation.pdf`, screenshots

### Expected outcomes table

| transaction_id | amount | currency | signals | expected final status |
|----------------|--------|----------|---------|----------------------|
| TXN001 | 1500.00 | USD | normal transfer | `approved` |
| TXN002 | 25000.00 | USD | wire, high-value | `fraud_review` → compliance `flagged` |
| TXN003 | 9999.99 | USD | just under $10k | `approved` |
| TXN004 | 500.00 | EUR | 02:47 UTC, DE | `approved` (score 45, below review threshold) |
| TXN005 | 75000.00 | USD | wire, very high | `fraud_review` → compliance `flagged` |
| TXN006 | 200.00 | XYZ | invalid currency | `rejected` (validation) |
| TXN007 | -100.00 | GBP | negative amount | `rejected` (validation) |
| TXN008 | 3200.00 | USD | normal mobile | `approved` |

---

## 5. Low-Level Tasks

### Task: Validation Stage

**Prompt:** "Implement the validation pipeline stage in TypeScript at `src/pipeline/validator.ts`. Read transaction envelopes from `shared/input/`, validate required fields (`transaction_id`, `timestamp`, `source_account`, `destination_account`, `amount`, `currency`, `transaction_type`, `description`), parse `amount` with `decimal.js` (must be > 0), validate `currency` against ISO 4217 whitelist (USD, EUR, GBP, JPY), and validate `timestamp` is ISO 8601. On success, write an envelope with `data.status = 'validated'` and `target_stage = 'fraud_detector'` to `shared/output/`. On failure, write `{ transaction_id, status: 'rejected', reason, stage: 'validator' }` to `shared/results/{transaction_id}.json`. Support `--dry-run` CLI flag that validates `sample-transactions.json` without writing pipeline files. Log audit lines (timestamp, stage, transaction_id, outcome) without PII. Use ESM and `.js` import extensions."

**File to CREATE:** `src/pipeline/validator.ts`

**Function to CREATE:** `processTransaction(record: RawTransaction, options?: { dryRun?: boolean }): ValidationResult`

**Details:**

- Required fields missing → reject with `reason: "Missing required field: {field}"`
- `amount` not parseable or ≤ 0 → reject with `reason: "Invalid amount"`
- Unknown `currency` → reject with `reason: "Invalid currency code"`
- Invalid `timestamp` → reject with `reason: "Invalid timestamp format"`
- Valid records pass envelope to fraud detector via `shared/output/`
- Export `runValidator()` for orchestrator and dry-run skill

---

### Task: Fraud Detection Stage

**Prompt:** "Implement the fraud detection stage in TypeScript at `src/pipeline/fraud-detector.ts`. Read validated envelopes from `shared/output/` (after validator moves them). Compute `risk_score` (0–100): +40 if USD-equivalent amount ≥ 10000 (use decimal.js and demo rates EUR=1.08, GBP=1.27), +25 if `metadata.country !== 'US'`, +20 if transaction hour (UTC) is 02:00–05:00, +15 if `transaction_type === 'wire_transfer'`. Set `data.status` to `fraud_review` if score ≥ 50, else `approved`. Attach `risk_score` and `fraud_signals` array to envelope `data`. Write result envelope to `shared/output/` with `source_stage: 'fraud_detector'` and `target_stage: 'compliance'`. Log audit lines without PII. Use decimal.js for all amount math."

**File to CREATE:** `src/pipeline/fraud-detector.ts`

**Function to CREATE:** `scoreTransaction(envelope: PipelineEnvelope): FraudResult`

**Details:**

- TXN002: score 55 (40 high-value + 15 wire) → `fraud_review`
- TXN003: score 0 → `approved`
- TXN004: score 45 (25 cross-border + 20 unusual timing) → `approved` (below 50)
- TXN005: score 55 (40 + 15 wire) → `fraud_review`
- Preserve original transaction fields in envelope `data`
- Export `runFraudDetector()` for orchestrator

---

### Task: Compliance Check Stage

**Prompt:** "Implement the compliance check stage in TypeScript at `src/pipeline/compliance.ts`. Read envelopes from fraud detector output. Set `compliance_status: 'flagged'` when (`transaction_type === 'wire_transfer'` AND USD-equivalent amount ≥ 10000) OR `risk_score >= 50`; otherwise `compliance_status: 'cleared'`. Set `final_status` to `fraud_review` if fraud score ≥ 50, `approved` if cleared and not fraud review, preserving `rejected` from earlier stages. Write final record to `shared/results/{transaction_id}.json` with `final_status`, `reason`, `compliance_status`, `risk_score`, and key transaction fields. After processing all records in the run, write `shared/results/pipeline-summary.json` with counts: `total`, `approved`, `fraud_review`, `rejected`, `compliance_flagged`. Log audit lines without PII. Use decimal.js for threshold checks."

**File to CREATE:** `src/pipeline/compliance.ts`

**Function to CREATE:** `checkCompliance(envelope: PipelineEnvelope): ComplianceResult`

**Details:**

- TXN002, TXN005: `compliance_status: flagged` (wire + ≥ $10k and fraud score ≥ 50)
- TXN004: score 45 → `approved` at fraud; `compliance_status: cleared`; `final_status: approved`
- Validator rejections (TXN006, TXN007) never reach compliance; orchestrator still counts them in summary
- Export `runCompliance()` and `writePipelineSummary(results: ComplianceResult[])`

---

## Appendix — Fraud score worked examples

| TXN | Signals | Score | Fraud status |
|-----|---------|-------|--------------|
| TXN001 | none | 0 | approved |
| TXN002 | high-value + wire | 55 | fraud_review |
| TXN003 | none (9999.99 < 10000) | 0 | approved |
| TXN004 | cross-border + unusual time | 45 | approved |
| TXN005 | high-value + wire | 55 | fraud_review |
| TXN008 | none | 0 | approved |
