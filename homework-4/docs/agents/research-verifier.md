# Research Verifier

**Executable:** [`agents/research-verifier.agent.md`](../../agents/research-verifier.agent.md)  
**Skill:** [`skills/research-quality-measurement.md`](../../skills/research-quality-measurement.md)  
**Model:** `claude-sonnet-5-thinking-high`

## Role

Fact-checker for Bug Researcher output. Verifies every `file:line` reference and that snippets match source.

## Inputs / outputs

| Direction | Path |
|-----------|------|
| Input | `context/bugs/{BUG_ID}/research/codebase-research.md` |
| Input | Cited source files under `homework-4/` |
| Output | `context/bugs/{BUG_ID}/research/verified-research.md` |

## Do / don't

| Do | Don't |
|----|-------|
| Open each cited file and compare snippets | Edit `src/` or application code |
| Apply research-quality skill for L1–L4 level | Invent source when files are missing |
| Document blocking vs minor discrepancies | Skip claims |

## Success criteria (from TASKS.md)

- Skill created and used
- Result file includes quality per skill
- All references verified
- Discrepancies documented
- Bug Planner can use output

## Output sections (`verified-research.md`)

1. Verification Summary (pass/fail, quality level)
2. Verified Claims
3. Discrepancies Found
4. Research Quality Assessment (level + reasoning)
5. References

## Example discrepancy

| Location | Issue | Severity |
|----------|-------|----------|
| `src/order-total.ts:12` | File does not exist yet | blocking |

Suggested correction: re-run research after Task 5 adds `src/order-total.ts`.
