# Verified Research — BUG-001

## Verification Summary

| Field | Value |
|-------|-------|
| Overall | PASS |
| Research Quality | L3 Adequate |
| Claims checked | 5 |
| Claims verified | 5 |
| Discrepancies | 1 |

## Verified Claims

| # | Location | Snippet match | Status | Notes |
|---|----------|---------------|--------|-------|
| 1 | `src/lib/leave-days.ts:17` | Yes | VERIFIED | Exact match: `return Math.floor(diff / MS_PER_DAY);`. Source even has an inline comment confirming the intentional bug. |
| 2 | `src/lib/validators.ts:11` | Yes | VERIFIED | Lines 11–12 match verbatim; third snippet line is research's own elision marker (`// ... required field checks only`), not a literal source line — acceptable truncation. Assertion (no start/end date comparison) confirmed true against lines 12–34. |
| 3 | `src/lib/auth.ts:9` | Yes | VERIFIED | Exact match: `return token == MANAGER_TOKEN;`. |
| 4 | `src/lib/reason-html.ts:6` | Yes | VERIFIED | Exact match: `return \`<p class="reason-preview">${reason}</p>\`;`. |
| 5 | `src/App.svelte:85` | Yes (wrong line) | VERIFIED | Snippet `{@html submission.reasonHtml}` exists verbatim but on line **86**, not 85. Line 85 is the comment `<!-- BUG-001d: unsanitized HTML from user input -->` immediately above it. |

## Discrepancies Found

| # | Location | Issue | Severity | Suggested correction |
|---|----------|-------|----------|---------------------|
| 1 | `src/App.svelte:85` | Cited line contains a comment, not the `{@html}` expression. The actual expression is one line below. | minor | Cite as `src/App.svelte:86` instead of `:85`. |

## Research Quality Assessment

**Level:** L3 Adequate

**Reasoning:**
- Reference accuracy: Pass — All 5 cited files exist and all line numbers are within file bounds; 4 of 5 point to the exact correct line, 1 is off by one line (comment vs. the actual expression on the next line).
- Snippet fidelity: Pass — Every quoted snippet appears verbatim in the source, either at the cited line or immediately adjacent to it.
- Coverage: Pass — Research addresses all four seeded defects documented in `bug-context.md` (BUG-001a leave-days, BUG-001b validators, BUG-001c auth, BUG-001d reason-html + App.svelte render site), and correctly identifies `leave-service.ts` as the orchestrator wiring validation → auth → day calculation → HTML formatting.
- Actionability: Pass — Each claim maps to a concrete, minimal fix (add `+ 1` for inclusive range, add a start/end date comparison branch, use strict/timing-safe token comparison, escape or sanitize the reason before HTML interpolation). Research does not state an explicit test command, but `npm test` (`vitest run`) is defined in `package.json` and discoverable without guessing — a minor, non-blocking gap.

## References

- Input: `context/bugs/BUG-001/research/codebase-research.md`
- Source files reviewed:
  - `context/bugs/BUG-001/bug-context.md`
  - `src/lib/leave-days.ts`
  - `src/lib/validators.ts`
  - `src/lib/auth.ts`
  - `src/lib/reason-html.ts`
  - `src/App.svelte`
  - `src/lib/leave-service.ts`
