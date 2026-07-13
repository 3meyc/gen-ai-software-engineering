# How to Run — Homework 6 (Task 2)

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
