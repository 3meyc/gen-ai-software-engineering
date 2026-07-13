# PR Title

homework-6: AI transaction pipeline capstone — pipeline, MCP, tests, and docs

---

## Summary

- **Agent 1:** `specification.md`, `agents.md`, `/write-spec` skill with Compliance Check as third stage
- **Agent 2:** TypeScript pipeline (validation → fraud → compliance), Hono API, Svelte 5 dashboard, `research-notes.md`
- **Agent 3:** `/run-pipeline` and `/validate-transactions` skills; coverage gate hook (blocks push &lt; 80%)
- **Agent 4:** Vitest suite (31 tests, ~87% coverage), `README.md`, `HOWTORUN.md`, presentation PDF

## Presentation

[docs/presentation.pdf](homework-6/docs/presentation.pdf)

## Screenshots

| Step | Screenshot |
|------|------------|
| Pipeline CLI run | ![pipeline-run](homework-6/docs/screenshots/pipeline-run.png) |
| Svelte dashboard | ![frontend](homework-6/docs/screenshots/frontend.png) |
| Test coverage ≥ 80% | ![test-coverage](homework-6/docs/screenshots/test-coverage.png) |
| `/run-pipeline` skill | ![skill-run-pipeline](homework-6/docs/screenshots/skill-run-pipeline.png) |
| Coverage gate hook | ![hook-trigger](homework-6/docs/screenshots/hook-trigger.png) |
| MCP (context7 + pipeline-status) | ![mcp-interaction](homework-6/docs/screenshots/mcp-interaction.png) |

## Documentation

- [README.md](homework-6/README.md) — **Maxim Ogorodnikov**, architecture diagram, tech stack
- [HOWTORUN.md](homework-6/HOWTORUN.md) — setup through tests and MCP
- [specification.md](homework-6/specification.md) — full spec with expected outcomes
- [docs/MCP.md](homework-6/docs/MCP.md) — MCP setup and example prompts

## How to verify

```bash
cd homework-6
npm install
npm install --prefix frontend
npm run pipeline
npm test
npm run test:coverage
```

Expected pipeline summary: **4 approved**, **2 fraud_review**, **2 rejected**, **2 compliance_flagged**.

`TXN004` (`Invoice #4471`, **02:47 UTC**, EUR, score **45**) is intentionally **approved** — one point under the fraud threshold, squarely inside the “unusual timing” window, and somehow the only transaction that looks guilty but gets acquitted.

Coverage gate: all metrics ≥ **80%** (current: ~87% statements, ~81% branches).

```bash
npm run dev:api    # terminal 1
npm run dev        # terminal 2 → http://localhost:5173
```

MCP: enable `context7` + `pipeline-status` from `homework-6/mcp.json`, then ask: “Use pipeline-status get_transaction_status for TXN006.”

## Test plan

- [x] `npm run pipeline` completes with 8 result files
- [x] `npm test` — 31 tests pass
- [x] `npm run test:coverage` — meets 80% gate
- [x] Dashboard shows summary cards and results table
- [x] MCP tools return transaction status from `shared/results/`
- [x] Coverage hook blocks push when coverage is insufficient
- [x] TXN007 negative amount rejected faster than most code review turnarounds
