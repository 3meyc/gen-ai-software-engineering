# Implementation Plan — BUG-001

> **For pipeline / Bug Fixer** — apply these changes in a future step. Do not apply manually before running agents unless testing the pipeline.

## Overview

Fix inclusive leave day calculation, add date range validation, harden manager token check, and sanitize reason HTML for safe display.

## Test command

```bash
npm test
```

Run from `homework-4/` workspace root.

---

## Change 1 — Inclusive leave day count

- **File:** `src/lib/leave-days.ts`
- **Location:** `calculateLeaveDays`, return statement (~line 17)
- **Before:**
  ```typescript
  return Math.floor(diff / MS_PER_DAY);
  ```
- **After:**
  ```typescript
  return Math.floor(diff / MS_PER_DAY) + 1;
  ```

---

## Change 2 — Reject end date before start date

- **File:** `src/lib/validators.ts`
- **Location:** `validateLeaveRequest`, after required field checks
- **Add:**
  ```typescript
  if (request.startDate && request.endDate && request.endDate < request.startDate) {
    errors.push("End date must be on or after start date.");
  }
  ```

---

## Change 3 — Strict manager token comparison

- **File:** `src/lib/auth.ts`
- **Location:** `isManagerTokenValid`
- **Before:**
  ```typescript
  return token == MANAGER_TOKEN;
  ```
- **After:**
  ```typescript
  return token === MANAGER_TOKEN;
  ```

---

## Change 4 — Escape HTML in reason preview

- **File:** `src/lib/reason-html.ts`
- **Location:** `formatReasonAsHtml`
- **Before:**
  ```typescript
  return `<p class="reason-preview">${reason}</p>`;
  ```
- **After:**
  ```typescript
  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  export function formatReasonAsHtml(reason: string): string {
    return `<p class="reason-preview">${escapeHtml(reason)}</p>`;
  }
  ```

---

## Test updates (after fixes)

Update `test/leave-days.test.ts` and `test/validators.test.ts` expectations to match corrected behavior.

## Verification steps

1. `npm test` — all tests pass with corrected expectations.
2. `npm run dev` — Jul 1–Jul 3 shows **3** days.
3. End before start shows validation error.
4. Reason with `<script>` renders as text, not executed.

## References

- `context/bugs/BUG-001/research/verified-research.md`
- `context/bugs/BUG-001/bug-context.md`
