# Homework 6: AI-Powered Transaction Processing Pipeline

> **Student Name:** Maxim Ogorodnikov  
> **Course:** Gen AI Software Engineering — Capstone

---

## Overview

This capstone project implements an AI-assisted **transaction processing pipeline** that ingests banking transactions, validates them, scores fraud risk, and performs compliance checks. Each stage reads and writes JSON envelopes under `shared/` directories, orchestrated by a Node.js runner. A **Hono** REST API exposes pipeline triggers and results; a **Svelte 5** dashboard lets users run the pipeline and inspect outcomes. **Cursor skills**, a **coverage gate hook**, and **MCP servers** (context7 + custom `pipeline-status`) integrate the workflow into AI-assisted development.

The system was built using a four-agent workflow documented in [`agents.md`](agents.md), with specifications driving implementation before code.

---

## Pipeline Stages

- **Validation** — Checks required fields, positive decimal amounts (`decimal.js`), ISO 4217 currency whitelist (USD, EUR, GBP, JPY), and ISO 8601 timestamps. Invalid records are rejected to `shared/results/`.
- **Fraud Detection** — Computes a risk score (0–100) from high-value transfers, cross-border activity, unusual UTC timing (02:00–05:00), and wire transfers. Scores ≥ 50 route to `fraud_review`.
- **Compliance Check** — Flags high-value wire transfers and fraud-review cases for regulatory reporting. Writes final status and `pipeline-summary.json`.

---

## Architecture

```
sample-transactions.json
        │
        ▼
   [Orchestrator]
        │
   shared/input ──► Validator ──► Fraud Detector ──► Compliance ──► shared/results/
        │              │ reject              │ fraud_review          │
        └──────────────┴─────────────────────┴───────────────────────┘
                              Hono API ◄──► Svelte Dashboard
                              MCP pipeline-status + context7
```

---

## Technology Stack

| Layer | Technology | Role |
|-------|------------|------|
| Runtime | Node.js 18+ | Pipeline orchestrator, stage modules, MCP server |
| Language | TypeScript (ESM) | End-to-end type safety across pipeline and API |
| Pipeline / API | [Hono](https://hono.dev/) + `@hono/node-server` | REST endpoints to trigger runs and serve results |
| Front-end | [Vite](https://vite.dev/) + [Svelte 5](https://svelte.dev/) | Web dashboard for pipeline runs and transaction status |
| Money handling | `decimal.js` | Precise decimal arithmetic — no `float` for amounts |
| Storage / IPC | File system (`shared/input`, `processing`, `output`, `results`) | JSON records passed between pipeline stages |
| Testing | [Vitest](https://vitest.dev/) + coverage (`v8`) | Unit tests per stage + integration test; 80% gate |
| Dev tooling | `tsx` | Run TypeScript in dev and scripts |
| MCP | `@modelcontextprotocol/sdk` + context7 | Custom `pipeline-status` server + framework docs lookup |

---

## Project Structure

```
homework-6/
├── src/
│   ├── pipeline/          # validator, fraud-detector, compliance, money, fs-utils
│   ├── api/               # Hono app and routes
│   └── orchestrator.ts    # CLI pipeline runner
├── frontend/              # Svelte 5 dashboard
├── mcp/                   # Custom MCP server (pipeline-status)
├── test/                  # Vitest unit + integration tests
├── shared/                # Pipeline JSON directories
├── docs/                  # MCP guide, presentation, screenshots
├── specification.md       # Agent 1 spec
├── agents.md              # Multi-agent workflow
├── HOWTORUN.md            # Setup and demo steps
└── research-notes.md      # context7 queries
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [`HOWTORUN.md`](HOWTORUN.md) | Install, run pipeline, API, dashboard, tests, MCP |
| [`specification.md`](specification.md) | Full system spec with expected outcomes |
| [`docs/MCP.md`](docs/MCP.md) | MCP server setup and example prompts |
| [`docs/presentation.pdf`](docs/presentation.pdf) | Capstone presentation (architecture, demo, lessons) |
| [`SUCCESS_CRITERIA.md`](SUCCESS_CRITERIA.md) | Live submission checklist |

---

## Quick Start

```bash
cd homework-6
npm install
npm install --prefix frontend
npm run pipeline          # CLI run
npm test                  # unit + integration tests
npm run test:coverage     # coverage report (80% gate)
```

See [`HOWTORUN.md`](HOWTORUN.md) for API, dashboard, skills, hooks, and MCP setup.
