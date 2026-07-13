# MCP Integration — Homework 6

**Author:** Maxim Ogorodnikov

This document explains how Model Context Protocol (MCP) is used in the transaction processing capstone, how to enable the servers in Cursor, and how to capture the required interaction screenshot.

---

## What is MCP in this project?

MCP lets Cursor’s AI agent call external tools and read structured data. Homework 6 uses **two** MCP servers:

| Server | Role |
|--------|------|
| **context7** | Look up library documentation during development (Hono, decimal.js, Svelte, etc.) |
| **pipeline-status** | Query live pipeline results from `shared/results/` on disk |

Configuration lives in [`mcp.json`](../mcp.json) at the homework-6 root.

> **Note:** TASKS.md shows a Python `mcp/server.py` example. This project uses **TypeScript** (`mcp/server.ts`) per the Node.js stack — functionally equivalent custom server.

---

## Prerequisites

1. Node.js 18+
2. Dependencies installed: `npm install` in `homework-6/`
3. Pipeline has been run at least once:

```bash
cd homework-6
npm run pipeline
```

This creates `shared/results/TXN*.json` and `pipeline-summary.json`, which the custom MCP server reads.

---

## Enable MCP servers in Cursor

### Option A — Workspace is `homework-6/`

1. Open **Cursor Settings** → **MCP** (or Features → MCP).
2. Add servers from [`mcp.json`](../mcp.json), or paste:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "pipeline-status": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"]
    }
  }
}
```

3. Ensure **pipeline-status** working directory is `homework-6/` (where `mcp.json` lives).
4. Reload MCP or restart Cursor if tools do not appear.

### Option B — Workspace is the repo root

Use paths relative to the repo root in MCP config:

```json
"pipeline-status": {
  "command": "npx",
  "args": ["tsx", "homework-6/mcp/server.ts"],
  "cwd": "homework-6"
}
```

(context7 config is unchanged.)

### Verify connection

In MCP settings, both servers should show as connected. In chat, you should see **pipeline-status** tools: `get_transaction_status`, `list_pipeline_results`, and resource `pipeline://summary`.

### Local debug (optional)

```bash
cd homework-6
npm run mcp:server
```

Runs the server on stdio (for MCP Inspector or client testing).

---

## Server reference

### context7 (external)

Used during code generation to search framework docs. Documented queries are in [`research-notes.md`](../research-notes.md).

**Example chat prompt:**

> Use context7 to look up decimal.js comparison methods for monetary thresholds.

---

### pipeline-status (custom)

Implementation: [`mcp/server.ts`](../mcp/server.ts), helpers in [`mcp/results-reader.ts`](../mcp/results-reader.ts).

| Type | Name | Description |
|------|------|-------------|
| Tool | `get_transaction_status` | Input: `transaction_id` (e.g. `TXN002`). Returns JSON from `shared/results/{id}.json`. |
| Tool | `list_pipeline_results` | Returns counts and a line per transaction (status, compliance, risk, reason). |
| Resource | `pipeline://summary` | Plain-text JSON of `pipeline-summary.json`. |

**Example chat prompts:**

> Use pipeline-status get_transaction_status for TXN006.

> Call list_pipeline_results and show all transaction outcomes.

> Read the pipeline://summary resource.

### Expected results (after `npm run pipeline`)

| Transaction | Expected |
|-------------|----------|
| TXN002 | `fraud_review`, compliance `flagged` |
| TXN006 | `rejected`, reason: Invalid currency code |
| TXN007 | `rejected`, reason: Invalid amount |
| Summary | total 8, approved 4, fraud_review 2, rejected 2 |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “No result for TXN…” | Run `npm run pipeline` first |
| pipeline-status not listed | Check MCP config cwd is `homework-6/` |
| tsx not found | Run `npm install` in `homework-6/` |
| Empty list_pipeline_results | Clear results and re-run pipeline |
| context7 fails | Network required; retry or check npx cache |

---

## Capturing the MCP interaction screenshot

**Deliverable:** [`docs/screenshots/mcp-interaction.png`](screenshots/mcp-interaction.png)

The screenshot must show **both**:

1. A **context7** query and its result in Cursor chat  
2. A **custom MCP tool** call (`get_transaction_status` or `list_pipeline_results`) and its result  

### Steps

1. Run `npm run pipeline` in `homework-6/`.
2. Confirm both MCP servers are enabled and connected in Cursor MCP settings.
3. **Context7 (first half):** In Cursor chat, send:
   > Use context7 to find Hono CORS middleware documentation.
   Wait for the tool output (library ID, doc snippet, or summary).
4. **Custom tool (second half):** In the same or next message, send:
   > Use pipeline-status get_transaction_status for TXN006.
   Wait for JSON showing `rejected` and `Invalid currency code`.
5. Take a screenshot that includes:
   - Your prompts (or enough context)
   - MCP tool invocation indicators
   - Tool responses for **both** context7 and pipeline-status
6. Save as `homework-6/docs/screenshots/mcp-interaction.png`.

### Tips

- One tall screenshot is fine; stitch two panels if the chat is long.
- Make transaction IDs and `final_status` / `reason` readable.
- Alternative custom tool prompt: `list_pipeline_results` showing all 8 transactions.

---

## Related files

| File | Purpose |
|------|---------|
| [`mcp.json`](../mcp.json) | MCP server registry |
| [`mcp/server.ts`](../mcp/server.ts) | Custom MCP server entry |
| [`research-notes.md`](../research-notes.md) | context7 queries used during build |
| [`HOWTORUN.md`](../HOWTORUN.md) | Pipeline, API, dashboard, MCP quick link |
