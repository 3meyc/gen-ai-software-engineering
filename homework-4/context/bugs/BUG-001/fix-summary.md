# Fix Summary — BUG-001

## Changes Made

### Change 1 — Inclusive leave day count

| Field | Content |
|-------|---------|
| File | `src/lib/leave-days.ts` |
| Location | `calculateLeaveDays`, return statement (line 17) |
| Before | `return Math.floor(diff / MS_PER_DAY);` |
| After | `return Math.floor(diff / MS_PER_DAY) + 1;` |
| Test result | PASS |

### Change 2 — Reject end date before start date

| Field | Content |
|-------|---------|
| File | `src/lib/validators.ts` |
| Location | `validateLeaveRequest`, after required field checks |
| Before | No date range comparison |
| After | Added check: `if (request.startDate && request.endDate && request.endDate < request.startDate) { errors.push("End date must be on or after start date."); }` |
| Test result | PASS |

### Change 3 — Strict manager token comparison

| Field | Content |
|-------|---------|
| File | `src/lib/auth.ts` |
| Location | `isManagerTokenValid` |
| Before | `return token == MANAGER_TOKEN;` |
| After | `return token === MANAGER_TOKEN;` |
| Test result | PASS |

### Change 4 — Escape HTML in reason preview

| Field | Content |
|-------|---------|
| File | `src/lib/reason-html.ts` |
| Location | `formatReasonAsHtml` |
| Before | Raw `reason` interpolated into HTML string |
| After | Added `escapeHtml()` helper; `formatReasonAsHtml` now wraps escaped text |
| Test result | PASS |

### Test updates

| File | Change |
|------|--------|
| `test/leave-days.test.ts` | Updated expectations: same-day = 1, Jul 1–3 = 3 |
| `test/validators.test.ts` | End-before-start expects `valid: false` and range error |
| `test/reason-html.test.ts` | Expects escaped HTML entities instead of raw markup |
| `test/auth.test.ts` | Added strict-equality test for boxed string token |
| `test/leave-service.test.ts` | Same-day submission expects `days: 1`; added multi-day and range-validation integration tests |

## Overall Status

**SUCCESS** — All four implementation-plan changes were applied as specified. Unit tests were updated to match corrected behavior. Final run: **18/18 tests passed** across 5 test files.

## Manual Verification

1. From `homework-4/`, run `npm test` — all 18 tests should pass.
2. Run `npm run dev`, open http://localhost:5173.
3. Submit leave Jul 1–Jul 3 with manager token `mgr-approve-2026` — confirmation should show **3** days.
4. Set end date before start date — form should show "End date must be on or after start date." and not submit.
5. Enter reason `<script>alert('xss')</script>` — preview should show escaped text, not execute script.

## References

- `context/bugs/BUG-001/implementation-plan.md`
- `context/bugs/BUG-001/research/verified-research.md`
- `src/lib/leave-days.ts`
- `src/lib/validators.ts`
- `src/lib/auth.ts`
- `src/lib/reason-html.ts`
- `test/leave-days.test.ts`
- `test/validators.test.ts`
- `test/reason-html.test.ts`
- `test/auth.test.ts`
- `test/leave-service.test.ts`
