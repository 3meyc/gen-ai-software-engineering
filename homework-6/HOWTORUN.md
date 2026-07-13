# How to Run — Homework 6

**Author:** Maxim Ogorodnikov

## Prerequisites

- Node.js 18 or newer
- npm

## 1. Install dependencies

```bash
cd homework-6
npm install
npm install --prefix frontend
```

## 2. Run the pipeline (CLI)

```bash
npm run pipeline
```

This loads `sample-transactions.json`, runs validation → fraud detection → compliance, and writes results to `shared/results/`. You should see 8 transaction result files plus `pipeline-summary.json`.

## 3. Dry-run validator only

```bash
npm run validate
```

Validates all sample transactions without writing pipeline files. Expect TXN006 (invalid currency) and TXN007 (invalid amount) to fail.

## 4. Start the API server

```bash
npm run dev:api
```

API listens on `http://localhost:3000`.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pipeline/run` | POST | Run full pipeline |
| `/api/results` | GET | List all transaction results |
| `/api/results/:transactionId` | GET | Single result |
| `/api/summary` | GET | Pipeline summary counts |

## 5. Start the dashboard

In a second terminal (with API running):

```bash
npm run dev
```

Open `http://localhost:5173`. Click **Run Pipeline** to trigger a run and view summary cards plus the results table.

## 6. Verify expected outcomes

| Transaction | Expected status |
|-------------|-----------------|
| TXN001 | approved |
| TXN002 | fraud_review (compliance flagged) |
| TXN003 | approved |
| TXN004 | approved |
| TXN005 | fraud_review (compliance flagged) |
| TXN006 | rejected (validation) |
| TXN007 | rejected (validation) |
| TXN008 | approved |

## 7. Cursor slash commands

From Cursor chat in the `homework-6` workspace:

| Command | Purpose |
|---------|---------|
| `/run-pipeline` | Run full pipeline, show summary and rejections |
| `/validate-transactions` | Dry-run validator on sample data |
| `/write-spec` | Regenerate `specification.md` from template |

## 8. Coverage gate

Check coverage manually:

```bash
npm run test:coverage
```

A project hook blocks `git push` when coverage is below **80%**. Configuration:

- [`homework-6/.cursor/hooks.json`](.cursor/hooks.json) — hook registration (TASKS also refers to this as settings/hooks config)
- [`.cursor/hooks/coverage-gate.mjs`](.cursor/hooks/coverage-gate.mjs) — runs `npm run test:coverage` before push

If the workspace root is the repo (`gen-ai-software-engineering/`), the same hook is also registered at [`.cursor/hooks.json`](../.cursor/hooks.json).

Until Task 5 tests are added, `test:coverage` will fail the 80% threshold — the hook will block push until coverage is sufficient.

## 9. MCP integration

See **[`docs/MCP.md`](docs/MCP.md)** for full setup, server reference, example chat prompts, and how to capture `mcp-interaction.png`.

Quick start:

1. Run `npm run pipeline` so `shared/results/` has data.
2. Enable servers from [`mcp.json`](mcp.json) in Cursor MCP settings (`context7` + `pipeline-status`).
3. In chat, try: “Use pipeline-status get_transaction_status for TXN006.”

## 10. Run tests

Tests use temporary directories and do not modify committed `shared/` data.

```bash
npm test              # run all tests once
npm run test:coverage # coverage report (80% gate; aim ≥ 90%)
```

The coverage gate hook (Section 8) blocks `git push` when coverage falls below **80%**.

