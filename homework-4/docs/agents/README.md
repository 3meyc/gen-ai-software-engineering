# Agent reference — Homework 4

Executable definitions live in [`agents/*.agent.md`](../../agents/). Human-readable reference below.

## Pipeline steps

| Step | Agent | Mode | Parallel |
|------|-------|------|----------|
| 1 | research-verifier | sequential | — |
| 2 | bug-fixer | sequential | — |
| 3a | security-verifier | parallel (post-fix) | with 3b |
| 3b | unit-test-generator | parallel (post-fix) | with 3a |

## I/O matrix (`BUG_ID` = e.g. `BUG-001`)

| Agent | Reads | Writes | Edits `src/`? |
|-------|-------|--------|---------------|
| Research Verifier | `context/bugs/{BUG_ID}/research/codebase-research.md` + cited sources | `context/bugs/{BUG_ID}/research/verified-research.md` | No |
| Bug Fixer | `context/bugs/{BUG_ID}/implementation-plan.md`, optional `verified-research.md` | `context/bugs/{BUG_ID}/fix-summary.md`, application source | Yes |
| Security Verifier | `context/bugs/{BUG_ID}/fix-summary.md` + changed files | `context/bugs/{BUG_ID}/security-report.md` | No |
| Unit Test Generator | `context/bugs/{BUG_ID}/fix-summary.md` + changed files | `context/bugs/{BUG_ID}/test-report.md`, `test/*.test.ts` | Tests only |

## Skills

| Agent | Skill |
|-------|-------|
| Research Verifier | [`skills/research-quality-measurement.md`](../../skills/research-quality-measurement.md) |
| Unit Test Generator | [`skills/unit-tests-FIRST.md`](../../skills/unit-tests-FIRST.md) |

## Per-agent pages

| Agent | Reference | Executable |
|-------|-----------|------------|
| Research Verifier | [research-verifier.md](research-verifier.md) | [research-verifier.agent.md](../../agents/research-verifier.agent.md) |
| Bug Fixer | [bug-fixer.md](bug-fixer.md) | [bug-fixer.agent.md](../../agents/bug-fixer.agent.md) |
| Security Verifier | [security-verifier.md](security-verifier.md) | [security-verifier.agent.md](../../agents/security-verifier.agent.md) |
| Unit Test Generator | [unit-test-generator.md](unit-test-generator.md) | [unit-test-generator.agent.md](../../agents/unit-test-generator.agent.md) |

## Upstream (not in pipeline script)

| Producer | Output |
|----------|--------|
| Bug Researcher | `research/codebase-research.md` |
| Bug Planner | `implementation-plan.md` |
