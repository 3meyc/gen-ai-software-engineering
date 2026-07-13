# Codebase Research — BUG-001

Research for leave request Svelte app defects. All paths relative to `homework-4/`.

## Bug hypothesis

Leave day calculation, date validation, and reason preview handling contain defects that affect correctness and security.

---

## Claim 1 — Off-by-one leave days

- **Location:** `src/lib/leave-days.ts:17`
- **Snippet:**
  ```typescript
  return Math.floor(diff / MS_PER_DAY);
  ```
- **Assertion:** Inclusive calendar-day count should add 1 when start and end are valid; current code under-counts multi-day leave.

---

## Claim 2 — End before start accepted

- **Location:** `src/lib/validators.ts:11`
- **Snippet:**
  ```typescript
  export function validateLeaveRequest(request: LeaveRequest): ValidationResult {
    const errors: string[] = [];
    // ... required field checks only
  ```
- **Assertion:** No branch compares `startDate` and `endDate`; invalid ranges pass validation.

---

## Claim 3 — Loose manager token check

- **Location:** `src/lib/auth.ts:9`
- **Snippet:**
  ```typescript
  return token == MANAGER_TOKEN;
  ```
- **Assertion:** Manager approval uses `==` instead of strict or timing-safe comparison.

---

## Claim 4 — Unsanitized HTML in reason preview

- **Location:** `src/lib/reason-html.ts:6`
- **Snippet:**
  ```typescript
  return `<p class="reason-preview">${reason}</p>`;
  ```
- **Location (render):** `src/App.svelte:85`
- **Snippet:**
  ```svelte
  {@html submission.reasonHtml}
  ```
- **Assertion:** User-controlled reason is injected into HTML and rendered without sanitization (XSS).

---

## Root cause summary

1. Day math treats range as exclusive.
2. Validator omits chronological date check.
3. Auth uses loose equality.
4. Reason formatting + `{@html}` enables XSS.

## References

- `context/bugs/BUG-001/bug-context.md`
- `src/lib/leave-service.ts` — orchestrates validation, auth, and day calculation
