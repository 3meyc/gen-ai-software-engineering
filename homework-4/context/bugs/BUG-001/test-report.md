# Test Report — BUG-001

## Summary

| Field | Value |
|-------|-------|
| Tests run | `npm test` |
| Result | PASS |
| Tests passed | 18 |
| Tests failed | 0 |
| Files created | — |
| Files updated | `test/auth.test.ts`, `test/reason-html.test.ts`, `test/validators.test.ts`, `test/leave-service.test.ts` |

## Changes

| File | Action | Covers |
|------|--------|--------|
| `test/auth.test.ts` | updated | Strict `===` token comparison (boxed String rejected); empty token rejected |
| `test/reason-html.test.ts` | updated | Script-tag XSS escape; plain-text reason preserved in preview wrapper |
| `test/validators.test.ts` | updated | Equal start/end dates accepted (boundary for date-range validation) |
| `test/leave-service.test.ts` | updated | Service rejects end-before-start; inclusive multi-day count and safe `reasonHtml` |
| `test/leave-days.test.ts` | unchanged | Already covers inclusive day count from fix-summary |

## FIRST Self-Assessment

| Principle | Satisfied | Evidence |
|-----------|-----------|----------|
| Fast | Yes | Pure unit tests; no network, no HTTP server, no timers; full suite ~33 ms |
| Independent | Yes | `leave-service` uses `resetSubmissionCounter()` in `beforeEach`; no shared mutable state across other suites |
| Repeatable | Yes | Fixed ISO date strings and static tokens; no `Date.now()` or randomness in assertions |
| Self-validating | Yes | All cases use `expect()` on return values, errors, and HTML output |
| Timely | Yes | Tests target only paths listed in `fix-summary.md` (leave-days, validators, auth, reason-html, leave-service integration) |

## Test run output

```
> homework-4@1.0.0 test
> vitest run

 RUN  v4.1.10 C:/Users/OhorodnikovMaksym/DEV/AAI/gen-ai-software-engineering/homework-4

 Test Files  5 passed (5)
      Tests  18 passed (18)
   Start at  18:54:53
   Duration  414ms (transform 273ms, setup 0ms, import 374ms, tests 33ms, environment 1ms)
```

## References

- Input: `context/bugs/BUG-001/fix-summary.md`
- Skill: `skills/unit-tests-FIRST.md`
