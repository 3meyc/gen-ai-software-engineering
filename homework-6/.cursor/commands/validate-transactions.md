---
description: Validate sample transactions without running the full pipeline
---

Validate all transactions in `sample-transactions.json` without processing them through the full pipeline.

Steps:
1. From `homework-6/`, run `npm run validate` (validator dry-run: `tsx src/pipeline/validator.ts --dry-run`)
2. Report: total count, valid count, invalid count
3. Show a markdown table of results:

| transaction_id | valid | reason |
|----------------|-------|--------|

Use `yes` / `no` for the valid column. Use `—` when valid.

Expected invalid: TXN006 (invalid currency), TXN007 (invalid amount).
