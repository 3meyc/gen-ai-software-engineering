---
title: HW6 Capstone — Transaction Processing Pipeline
author: Maxim Ogorodnikov
---

# Homework 6 Capstone

**Maxim Ogorodnikov** — Gen AI Software Engineering

---

# Problem & Goals

- Build an AI-assisted transaction processing pipeline
- Validate → detect fraud → compliance check
- Demonstrate multi-agent workflow, skills, hooks, and MCP

---

# Architecture

```
sample-transactions.json → Orchestrator
  → Validator → Fraud Detector → Compliance → shared/results/
  Hono API ↔ Svelte Dashboard
  MCP: context7 + pipeline-status
```

File-based JSON envelopes in `shared/` directories connect stages.

---

# Pipeline Stages

**Validation**
- Required fields, positive amounts (decimal.js)
- ISO 4217 currencies: USD, EUR, GBP, JPY
- Rejects invalid records early

**Fraud Detection**
- Risk score: high-value (+40), cross-border (+25), unusual timing (+20), wire (+15)
- Threshold 50 → `fraud_review`

**Compliance**
- Flags high-value wires and fraud-review cases
- Writes `pipeline-summary.json`

---

# Demo Flow

1. `npm run pipeline` — CLI processes 8 sample transactions
2. `npm run dev:api` + `npm run dev` — Svelte dashboard
3. MCP: `get_transaction_status` for TXN006 → rejected

Expected: 4 approved, 2 fraud_review, 2 rejected, 2 compliance_flagged

---

# AI Workflow

| Agent | Deliverable |
|-------|-------------|
| Agent 1 | specification.md, /write-spec skill |
| Agent 2 | Pipeline, Hono API, Svelte UI |
| Agent 3 | /run-pipeline, coverage gate hook |
| Agent 4 | Vitest suite, README, presentation |

**context7** — Hono, decimal.js, Svelte lookups in research-notes.md

---

# Testing & Quality

- **Vitest** — unit tests per stage + integration test
- Isolated tmp dirs (no real `shared/` pollution)
- **Coverage gate** — hook blocks push if &lt; 80%
- Current coverage: ~87% statements, ~81% branches

---

# Lessons Learned

- Spec-first development reduced rework (TXN004 score edge case)
- `decimal.js` avoids float bugs on monetary values
- File-based IPC is simple to debug and test with tmp directories
- MCP bridges AI chat with live pipeline state
- Skills + hooks encode team conventions into the IDE

---

# Thank You

Repository: `homework-6/`  
Docs: README.md, HOWTORUN.md, docs/MCP.md
