# Homework 4 — Cursor local config

Project-local agent skills and references for work in `homework-4/`.

## Startup read

1. [`agents.md`](../agents.md) — pipeline hub
2. [`TASKS.md`](../TASKS.md) — assignment spec
3. [`docs/agents/README.md`](../docs/agents/README.md) — I/O matrix

## Homework skills (`skills/`)

| Skill | Agent | Path |
|-------|-------|------|
| Research quality | Research Verifier | [`skills/research-quality-measurement.md`](../skills/research-quality-measurement.md) |
| FIRST tests | Unit Test Generator | [`skills/unit-tests-FIRST.md`](../skills/unit-tests-FIRST.md) |

Pipeline inlines these automatically via `npm run pipeline`.

## Repo-root skills (reused)

| Skill | When |
|-------|------|
| [`vitest-testing`](../../.cursor/skills/vitest-testing/SKILL.md) | Hono API tests (Task 5) |
| [`hono-backend`](../../.cursor/skills/hono-backend/SKILL.md) | Mini-app structure (Task 5) |
| [`commit-messages`](../../.cursor/skills/commit-messages/SKILL.md) | Git commits |
| [`pr-messages`](../../.cursor/skills/pr-messages/SKILL.md) | PR description |

## Executable agents

| File | Purpose |
|------|---------|
| [`agents/research-verifier.agent.md`](../agents/research-verifier.agent.md) | Step 1 |
| [`agents/bug-fixer.agent.md`](../agents/bug-fixer.agent.md) | Step 2 |
| [`agents/security-verifier.agent.md`](../agents/security-verifier.agent.md) | Step 3a |
| [`agents/unit-test-generator.agent.md`](../agents/unit-test-generator.agent.md) | Step 3b |

## Pipeline

```bash
npm run pipeline
```

See [`HOWTORUN.md`](../HOWTORUN.md).
