# Unit Test Generator

**Executable:** [`agents/unit-test-generator.agent.md`](../../agents/unit-test-generator.agent.md)  
**Skill:** [`skills/unit-tests-FIRST.md`](../../skills/unit-tests-FIRST.md)  
**Model:** `composer-2.5-fast`

## Role

Generate and run unit tests for **changed code only**; document results with FIRST self-assessment.

## Inputs / outputs

| Direction | Path |
|-----------|------|
| Input | `context/bugs/{BUG_ID}/fix-summary.md` |
| Input | Changed source files |
| Output | `context/bugs/{BUG_ID}/test-report.md` |
| Output | New/updated `test/**/*.test.ts` |

## FIRST checklist

| Principle | Requirement |
|-----------|-------------|
| **F**ast | No network/sleep; `app.request()` for Hono |
| **I**ndependent | Fresh state per test |
| **R**epeatable | Deterministic; mock time/random |
| **S**elf-validating | `expect()` assertions |
| **T**imely | Only fix-summary paths covered |

See also repo [`.cursor/skills/vitest-testing/SKILL.md`](../../../.cursor/skills/vitest-testing/SKILL.md).

## Do / don't

| Do | Don't |
|----|-------|
| Cover new/changed behavior from fix-summary | Rewrite unrelated test suites |
| Run `npm test` and record counts | Skip FIRST self-assessment in report |
| Use Vitest + Node environment | Start live HTTP server for API tests |

## Success criteria (from TASKS.md)

- FIRST skill created and used
- Tests only for changed code
- FIRST satisfied
- Tests run and recorded
- Test report and test files submitted

## `test-report.md` sections

- Summary (pass/fail, counts, files touched)
- Changes table
- FIRST self-assessment
- Test run output
- References
