# Unit Tests — FIRST Principles

Skill for the **Unit Test Generator** agent. Use this skill when generating tests and writing `test-report.md`.

## Purpose

Ensure generated unit tests follow the **FIRST** principles and align with this project's Vitest conventions.

## FIRST defined

| Principle | Meaning | Checklist |
|-----------|---------|-----------|
| **F — Fast** | Tests complete in milliseconds; no I/O unless required | No `setTimeout`/sleep; no real network; no starting HTTP server — use `app.request()` for Hono |
| **I — Independent** | Each test sets up its own state | Fresh store/fixtures per `it()`; no shared mutable globals; tests runnable in any order |
| **R — Repeatable** | Same result every run | No reliance on wall clock without mocking; seed or mock `Math.random`; deterministic assertions |
| **S — Self-validating** | Pass or fail without manual inspection | Use `expect()` assertions; avoid `console.log` as the only check |
| **T — Timely** | Tests cover changed behavior only | Add tests for files listed in `fix-summary.md`; do not rewrite unrelated suites |

## Project test conventions

- **Runner:** Vitest (`npm test` from `homework-4/`)
- **Location:** `test/**/*.test.ts`
- **Environment:** `node`
- **Hono APIs:** `createApp(store)` + `app.request()` — no live port
- **Imports:** ESM with `.js` extension from `src/`

See repo-root `.cursor/skills/vitest-testing/SKILL.md` for patterns when testing Hono apps added in Task 5.

## Scope rule

Generate or update tests **only** for code changed by the Bug Fixer (paths in `fix-summary.md`). Do not add broad regression suites unless they directly cover a changed function.

## FIRST self-assessment template

Include in `test-report.md`:

```markdown
## FIRST Self-Assessment

| Principle | Satisfied | Evidence |
|-----------|-----------|----------|
| Fast | Yes/No | {e.g. no network, app.request only} |
| Independent | Yes/No | {e.g. fresh store per test} |
| Repeatable | Yes/No | {e.g. no Date.now without mock} |
| Self-validating | Yes/No | {e.g. expect() on status and body} |
| Timely | Yes/No | {e.g. only fix-summary paths covered} |
```

## Required output template — test-report.md

```markdown
# Test Report — {BUG_ID}

## Summary

| Field | Value |
|-------|-------|
| Tests run | `npm test` |
| Result | PASS / FAIL |
| Tests passed | {n} |
| Tests failed | {n} |
| Files created | {list} |
| Files updated | {list} |

## Changes

| File | Action | Covers |
|------|--------|--------|
| `test/example.test.ts` | created/updated | {function or route} |

## FIRST Self-Assessment

{table from template above}

## Test run output

```
{paste relevant vitest output}
```

## References

- Input: `context/bugs/{BUG_ID}/fix-summary.md`
- Skill: `skills/unit-tests-FIRST.md`
```

## Anti-patterns (do not generate)

- Tests that depend on execution order across `describe` blocks
- Snapshot tests for large JSON blobs without narrowing scope
- Tests that hit `localhost` or external URLs
- Copy-paste duplicate tests differing only by fixture value (use `it.each` when appropriate)

## Workflow

1. Read `fix-summary.md`; list changed source files.
2. Identify untested or under-tested behavior in those files only.
3. Write Vitest tests following FIRST checklists.
4. Run `npm test` from `homework-4/`.
5. Write `test-report.md` with FIRST self-assessment and run output.
