# HW6 Success Criteria (live checklist)

> Update status during execution: ⬜ pending · ✅ done · ❌ blocked  
> Last updated: Task 1 complete

---

## Task 1 — Specification (Agent 1)

- [x] `specification.md` — all 5 sections present
- [x] Low-level task per pipeline stage (validator, fraud detector, compliance)
- [x] `agents.md` with project-specific context
- [x] `/write-spec` slash command present in `.cursor/commands/`
- [x] `specification-TEMPLATE-hint.md` available for the skill

---

## Task 2 — Pipeline (Agent 2)

- [ ] Orchestrator/runner runs end-to-end with no errors (`npm run pipeline` or equivalent)
- [ ] Validation stage — required fields, valid amounts, ISO 4217 currency
- [ ] Fraud detection stage — risk scoring (high-value, timing, cross-border)
- [ ] Compliance check stage — reporting thresholds and final status
- [ ] All stages write valid JSON records to `shared/` directories
- [ ] All 8 transactions from `sample-transactions.json` appear in `shared/results/`
- [ ] Simple front-end runs and shows pipeline output or status
- [ ] `research-notes.md` — at least 2 context7 queries documented

---

## Task 3 — Skills & Hooks (Agent 3)

- [ ] `.cursor/commands/run-pipeline.md` — runs full pipeline via slash command
- [ ] `.cursor/commands/validate-transactions.md` — dry-run validator
- [ ] Coverage gate hook configured — blocks push if coverage < 80%
- [ ] Screenshot: `docs/screenshots/skill-run-pipeline.png`
- [ ] Screenshot: `docs/screenshots/hook-trigger.png`

---

## Task 4 — MCP Integration

- [ ] `mcp.json` — context7 and pipeline-status servers configured
- [ ] `mcp/server.ts` (or `.js`) — `get_transaction_status`, `list_pipeline_results`, `pipeline://summary`
- [ ] context7 used during code generation (2+ queries in `research-notes.md`)
- [ ] Screenshot: `docs/screenshots/mcp-interaction.png`

---

## Task 5 — Testing & Documentation (Agent 4)

- [ ] `tests/` — unit tests per stage + 1 integration test
- [ ] Test coverage ≥ 80% (gate); aim ≥ 90%
- [ ] `README.md` includes **student name** and ASCII pipeline diagram
- [ ] `HOWTORUN.md` — numbered steps from setup to demo
- [ ] `docs/presentation.pdf` committed
- [ ] Screenshot: `docs/screenshots/pipeline-run.png`
- [ ] Screenshot: `docs/screenshots/frontend.png`
- [ ] Screenshot: `docs/screenshots/test-coverage.png`
- [ ] **PR description** includes screenshots, presentation PDF, and links for every step

---

## Submission readiness (from TASKS.md Success Criteria table)

| Criterion | Status |
|-----------|--------|
| `specification.md` has all 5 sections and Low-Level Tasks per pipeline stage | ✅ |
| Skill that generates spec from template is present | ✅ |
| Pipeline runs to completion with no errors | ⬜ |
| All stages write valid JSON records to `shared/` directories | ⬜ |
| Simple front-end runs and shows pipeline output or status | ⬜ |
| `/run-pipeline` skill executes the pipeline via AI | ⬜ |
| Coverage gate hook blocks push if coverage < 80% | ⬜ |
| `mcp.json` has context7 and custom MCP; both respond | ⬜ |
| Test coverage meets gate (≥ 80%); aim for ≥ 90% | ⬜ |
| `README.md` includes **your name** and ASCII pipeline diagram | ⬜ |
| `HOWTORUN.md` has numbered steps from setup to demo | ⬜ |
| `docs/presentation.pdf` committed and linked in PR description | ⬜ |
| 6 screenshots in `docs/screenshots/` and **in PR description** | ⬜ |

---

## Tips for Success (process checks)

- [x] Spec completed before any pipeline code
- [x] Sample transactions analyzed; expected outcomes documented in spec
- [ ] One pipeline stage implemented and tested before starting the next
- [ ] context7 queries planned / documented for framework lookups (Hono, decimal.js, Svelte)
- [ ] `/run-pipeline` skill set up for one-command demo
- [ ] Screenshots captured during development (not only at the end)
- [ ] Presentation PDF generated before deadline and verified from PR link

---

## Notes / blockers

- **Task 1 done (2026-07-13):** Delivered `specification.md`, `agents.md`, `specification-TEMPLATE-hint.md`, `.cursor/commands/write-spec.md`. Third stage: Compliance Check. TXN004 expected `approved` (fraud score 45 < 50 threshold).
