---
description: Run the transaction processing pipeline end-to-end
---

Run the transaction processing pipeline end-to-end for homework-6.

Steps:
1. Check that `homework-6/sample-transactions.json` exists
2. From `homework-6/`, run `npm run pipeline` (orchestrator clears `shared/` dirs and runs all stages)
3. Read `homework-6/shared/results/pipeline-summary.json`
4. List all `homework-6/shared/results/TXN*.json` files
5. Report any transactions with `final_status: rejected` or `status: rejected`, including the `reason` field

Output a summary table:

| transaction_id | final_status | reason |
|----------------|--------------|--------|

Also print pipeline summary counts: total, approved, fraud_review, rejected, compliance_flagged.
