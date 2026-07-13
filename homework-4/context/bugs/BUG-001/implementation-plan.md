# Implementation Plan — BUG-001 (stub)

> **Note:** Stub plan for pipeline development. Task 5 will replace with a plan tied to real source files.

## Overview

Fix order total discount calculation, quantity validation, and token comparison security issue.

## Test command

```bash
npm test
```

Run from `homework-4/` workspace root.

## Changes

### Change 1 — Fix discount in order total

- **File:** `src/order-total.ts` (TBD — Task 5)
- **Location:** `calculateTotal` function
- **Before:**
  ```typescript
  // TBD
  return items.reduce((sum, item) => sum + item.price, 0);
  ```
- **After:**
  ```typescript
  // TBD: apply item.discountPercent when present
  return items.reduce((sum, item) => {
    const discounted = item.price * (1 - (item.discountPercent ?? 0) / 100);
    return sum + discounted;
  }, 0);
  ```

### Change 2 — Reject negative quantities

- **File:** `src/validators.ts` (TBD — Task 5)
- **Location:** `isValidQuantity`
- **Before:**
  ```typescript
  // TBD
  if (!body.quantity) return false;
  ```
- **After:**
  ```typescript
  // TBD
  if (typeof body.quantity !== "number" || body.quantity <= 0) return false;
  ```

### Change 3 — Secure token comparison

- **File:** `src/auth.ts` (TBD — Task 5)
- **Location:** token check
- **Before:**
  ```typescript
  // TBD
  if (token == expectedToken) { /* ... */ }
  ```
- **After:**
  ```typescript
  // TBD: use timing-safe comparison
  if (token === expectedToken) { /* ... */ }
  ```

## Verification steps

1. Run `npm test` — all tests pass.
2. Manually verify discount applies per line item.
3. Confirm negative quantity returns validation error.

## References

- `context/bugs/BUG-001/research/verified-research.md` (after Research Verifier runs)
