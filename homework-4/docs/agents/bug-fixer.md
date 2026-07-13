# Bug Fixer

**Executable:** [`agents/bug-fixer.agent.md`](../../agents/bug-fixer.agent.md)  
**Model:** `composer-2.5-fast`

## Role

Executes the implementation plan and documents all changes with test results.

## Inputs / outputs

| Direction | Path |
|-----------|------|
| Input | `context/bugs/{BUG_ID}/implementation-plan.md` |
| Input (optional) | `context/bugs/{BUG_ID}/research/verified-research.md` |
| Output | `context/bugs/{BUG_ID}/fix-summary.md` |
| Output | Modified files under `src/` per plan |

## Process

1. Read plan — files, before/after code, test command
2. Apply changes per file
3. Run `npm test` after changes; stop on failure
4. Write `fix-summary.md`

## Do / don't

| Do | Don't |
|----|-------|
| Match plan before/after blocks exactly | Scope-creep beyond the plan |
| Run tests from `homework-4/` | Continue after test failure without documenting |
| Document manual verification steps | Claim success if tests fail |

## Success criteria (from TASKS.md)

- Plan read fully
- Changes match plan
- Tests run
- Fix summary complete
- Manual verification steps clear

## `fix-summary.md` sections

- **Changes Made** — file, location, before/after, test result per change
- **Overall Status** — SUCCESS / PARTIAL / FAILED
- **Manual Verification** — numbered steps
- **References**
