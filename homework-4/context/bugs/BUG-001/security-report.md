# Security Report — BUG-001

## Executive Summary

Reviewed the four source files changed by the Bug Fixer for BUG-001 plus their
immediate consumers (`leave-service.ts`, `App.svelte`). The fixes are
**security-positive**: the seeded stored-XSS vector is correctly closed and the
manager-token comparison is now strict.

- Files reviewed: 4 changed + 2 consumers
- Findings by severity: CRITICAL 0 · HIGH 0 · MEDIUM 1 · LOW 1 · INFO 2
- Overall risk posture: **LOW**. No new vulnerabilities introduced by the fix.
  The single MEDIUM is a pre-existing, demo-inherent design property (client-side
  token), not a regression.

## Findings

| # | Severity | Location | Finding | Remediation |
|---|----------|----------|---------|-------------|
| 1 | MEDIUM | `src/lib/auth.ts:2` | Hardcoded manager token `MANAGER_TOKEN = "mgr-approve-2026"` is exported and bundled into the client. Any user can read it from the shipped JS and pass `isManagerTokenValid`, so the "approval" is not a real trust boundary. Pre-existing (not introduced by this fix). | For anything beyond the demo, move approval to a server endpoint; never ship the secret to the client. Document explicitly as demo-only otherwise. |
| 2 | LOW | `src/lib/auth.ts:9` | `token === MANAGER_TOKEN` is not constant-time; character-by-character short-circuit is theoretically timing-observable. Impact is negligible here (client-side, no server oracle). | If ever moved server-side, compare with a constant-time function (e.g. `crypto.timingSafeEqual`). |
| 3 | INFO | `src/lib/reason-html.ts:4` | `escapeHtml` correctly escapes `& < > " '` (ampersand first, no double-encode). This closes the `{@html submission.reasonHtml}` sink at `src/App.svelte:86`. Reported as INFO to record that the XSS remediation was verified as correct. | None. Keep escaping centralized; do not interpolate any other unescaped user input into the returned HTML string. |
| 4 | INFO | `src/lib/leave-days.ts:20` | `parseDateOnly` runs `isoDate.split("-").map(Number)` with no validation; malformed input yields `Invalid Date` / `NaN`, not a crash or injection. No security impact. | Optional: validate parsed components (guard `NaN`) for robustness. |

No injection (SQL/command/path/template), no additional hardcoded secrets, no
CSRF surface (client-only app), and no unsafe dependency patterns were found in
the changed files.

## Scope

Reviewed (runtime/production paths only; `node_modules/`, lockfiles, and tests excluded):

- `src/lib/leave-days.ts`
- `src/lib/validators.ts`
- `src/lib/auth.ts`
- `src/lib/reason-html.ts`
- `src/lib/leave-service.ts` (consumes all four; XSS/token sink orchestration)
- `src/App.svelte` (`{@html}` sink at line 86)

## References

- `context/bugs/BUG-001/fix-summary.md`
- `src/lib/leave-days.ts`, `src/lib/validators.ts`, `src/lib/auth.ts`, `src/lib/reason-html.ts`
- `src/lib/leave-service.ts`, `src/App.svelte`
