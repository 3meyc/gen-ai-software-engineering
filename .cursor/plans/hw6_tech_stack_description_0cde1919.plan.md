---
name: HW6 Tech Stack Description
overview: A short, copy-ready tech stack description for Homework 6 using Node.js (Hono) + Vite + Svelte, formatted for README/specification use.
todos:
  - id: paste-readme-table
    content: Add tech stack table to homework-6/README.md when created
    status: pending
  - id: paste-spec-summary
    content: Include one-paragraph stack summary in specification.md Implementation Notes or Context
    status: pending
isProject: false
---

# Homework 6 Tech Stack Description

## One-paragraph summary (for `specification.md` or README overview)

A **TypeScript** transaction processing pipeline on **Node.js**: file-based stages (validation, fraud detection, reporting) orchestrated by a Node runner, with precise monetary handling via **decimal.js**. A **Hono** API exposes pipeline triggers and reads results from `shared/results/`. A **Vite + Svelte 5** dashboard lets users run the pipeline and view pass/fail counts and rejection reasons. **Vitest** covers unit and integration tests with an 80%+ coverage gate. A custom **MCP server** (Node MCP SDK) plus **context7** integrate pipeline status into the AI workflow.

---

## Tech stack table (for `README.md` — required by [homework-6/TASKS.md](homework-6/TASKS.md))

| Layer | Technology | Role |
|-------|------------|------|
| Runtime | Node.js 18+ | Pipeline orchestrator, stage modules, MCP server |
| Language | TypeScript (ESM) | End-to-end type safety across pipeline and API |
| Pipeline / API | [Hono](https://hono.dev/) + `@hono/node-server` | REST endpoints to trigger runs and serve results |
| Front-end | [Vite](https://vite.dev/) + [Svelte 5](https://svelte.dev/) | Web dashboard for pipeline runs and transaction status |
| Money handling | `decimal.js` (or equivalent) | Precise decimal arithmetic — no `float` for amounts |
| Storage / IPC | File system (`shared/input`, `processing`, `output`, `results`) | JSON records passed between pipeline stages |
| Testing | [Vitest](https://vitest.dev/) + coverage (`v8`/`istanbul`) | Unit tests per stage + integration test; 80% gate |
| Dev tooling | `tsx` | Run TypeScript in dev and scripts |
| MCP | `@modelcontextprotocol/sdk` + context7 | Custom `pipeline-status` server + framework docs lookup |

---

## Bullet list variant (matches HW 1–2 style)

- **Runtime**: Node.js 18+
- **Language**: TypeScript (ESM)
- **Pipeline & API**: Hono with `@hono/node-server`
- **Front-end**: Vite + Svelte 5
- **Monetary values**: `decimal.js` (ISO 4217 currency codes)
- **Pipeline protocol**: JSON files in `shared/` directories
- **Testing**: Vitest with `app.request()` and coverage reporting
- **MCP**: context7 + custom Node MCP server (`get_transaction_status`, `list_pipeline_results`, `pipeline://summary`)
- **Tooling**: `tsx` for dev/watch and pipeline scripts

---

## Where to use each format

- **`specification.md` → Implementation Notes / Context**: one-paragraph summary
- **`README.md` → Tech stack table**: table (required deliverable)
- **`HOWTORUN.md`**: reference stack only in setup prerequisites (e.g. Node 18+, `npm install`)

No code changes needed — this is copy-ready text for documentation deliverables.
