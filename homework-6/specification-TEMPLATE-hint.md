# HW6 Specification Template (hint)

> Use this condensed template when generating [`specification.md`](specification.md). Full reference: [homework-3 specification template](../homework-3/docs/_archive/specification-TEMPLATE-example.md).

---

## Required structure

```markdown
# [Project Name] Specification

> Ingest this specification, implement the Low-Level Tasks, and satisfy the High- and Mid-Level Objectives.

## 1. High-Level Objective

[One sentence: what the pipeline does end-to-end]

## 2. Mid-Level Objectives

| ID | Objective | Verifiable via |
|----|-----------|----------------|
| MO-1 | … | sample transaction IDs |
| MO-2 | … | … |
| MO-3 | … | … |
| MO-4 | … | … |
| MO-5 | … | … |

## 3. Implementation Notes

### Tech stack
[One paragraph: Node.js, TypeScript, Hono, Svelte, decimal.js, Vitest, MCP]

### Monetary values
- Use `decimal.js` — never `number` or `float` for amounts

### Currency
- ISO 4217 codes only (USD, EUR, GBP, JPY, …)

### Logging & PII
- Audit trail: ISO 8601 timestamp, stage name, transaction_id, outcome
- No plaintext account numbers or names in logs

### Inter-stage protocol
- Directories: `shared/input`, `shared/processing`, `shared/output`, `shared/results`
- Standard envelope between stages (see TASKS.md)

### Project layout
[Directory tree]

## 4. Context

### Beginning context
- `sample-transactions.json` with N records
- Empty `shared/` directories
- No pipeline code

### Ending context
- All transactions in `shared/results/`
- `pipeline-summary.json`
- Hono API, Svelte dashboard, tests ≥ 90% coverage, MCP server, docs

### Expected outcomes table
| transaction_id | amount | currency | signals | expected final status |
|----------------|--------|----------|---------|----------------------|
| TXN001 | … | … | … | approved |
| … | … | … | … | … |

## 5. Low-Level Tasks

### Task: [Pipeline Stage Name]

Prompt: "[Exact prompt for code generation agent]"

File to CREATE: e.g. `src/pipeline/validator.ts`

Function to CREATE: e.g. `processTransaction(record: RawTransaction): PipelineEnvelope`

Details:
- [What the stage checks, transforms, or decides]
- [Input/output format]
- [Error and rejection cases]
```

---

## HW6-specific constraints

1. **Minimum 3 pipeline stages:** Validation → Fraud Detection → Compliance Check
2. **Low-level task format** must use exactly: `Task`, `Prompt`, `File to CREATE`, `Function to CREATE`, `Details`
3. **One low-level task per pipeline stage** (validator, fraud detector, compliance)
4. **Ground objectives in** [`sample-transactions.json`](sample-transactions.json) — all 8 transactions must have expected outcomes
5. **Rejected transactions** go to `shared/results/` with a `reason` field
6. **Third stage** for this project: Compliance Check (wire ≥ $10k, fraud score ≥ 50 → `compliance_status: flagged`)

---

## Standard inter-stage envelope

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

---

## Fraud scoring reference (for spec consistency)

| Signal | Points |
|--------|--------|
| Amount ≥ $10,000 USD equivalent | +40 |
| `metadata.country` ≠ `US` | +25 |
| Hour (UTC) 02:00–05:00 | +20 |
| `transaction_type === "wire_transfer"` | +15 |
| `fraud_review` threshold | score ≥ 50 |
