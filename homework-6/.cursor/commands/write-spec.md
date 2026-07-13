---
description: Generate or refresh homework-6/specification.md from the project template
---

Generate a complete transaction pipeline specification for homework-6.

Steps:
1. Read `homework-6/TASKS.md` (Task 1 requirements)
2. Read `homework-6/specification-TEMPLATE-hint.md`
3. Read `homework-6/sample-transactions.json` and `homework-6/agents.md`
4. Apply tech stack from `agents.md` (Node.js, TypeScript, Hono, Svelte 5, decimal.js, Vitest, MCP)
5. Write `homework-6/specification.md` with all 5 sections:
   - **High-Level Objective** — one sentence
   - **Mid-Level Objectives** — 4–5 testable items with sample transaction IDs
   - **Implementation Notes** — money (decimal.js), currency (ISO 4217), logging, PII, stack, inter-stage protocol, project layout
   - **Context** — beginning state, ending state, expected outcomes table for all 8 transactions
   - **Low-Level Tasks** — one per pipeline stage: Validation, Fraud Detection, Compliance Check
6. Use the HW6 low-level task format exactly:
   - `Task:` stage name
   - `Prompt:` copy-paste-ready string for the code generation agent
   - `File to CREATE:` path
   - `Function to CREATE:` signature
   - `Details:` rules, inputs, outputs, error cases
7. Ground fraud scoring in the rules from `agents.md` (threshold score ≥ 50 for `fraud_review`)
8. Do **not** write implementation code — specification only
9. Include author name: Maxim Ogorodnikov
