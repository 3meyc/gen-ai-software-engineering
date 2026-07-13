# Codebase Research — BUG-001 (stub)

> **Note:** Stub input for pipeline development. Task 5 will replace with real research against the mini-app.

## Bug hypothesis

The discount calculation in the order total module may apply percentage discounts incorrectly when multiple items are present.

## Claims to verify

### Claim 1

- **Location:** `src/order-total.ts:12` (TBD — file created in Task 5)
- **Snippet:**
  ```typescript
  // TBD: expected snippet from source once Task 5 lands
  return items.reduce((sum, item) => sum + item.price, 0);
  ```
- **Assertion:** Total ignores discount field on line items.

### Claim 2

- **Location:** `src/validators.ts:8` (TBD)
- **Snippet:**
  ```typescript
  // TBD: validation may be missing for negative quantities
  if (!body.quantity) return false;
  ```
- **Assertion:** Negative quantities are not rejected.

### Claim 3

- **Location:** `src/auth.ts:24` (TBD)
- **Snippet:**
  ```typescript
  // TBD: possible insecure comparison
  if (token == expectedToken) { /* ... */ }
  ```
- **Assertion:** Token comparison uses loose equality.

## Root cause summary (preliminary)

Multiple issues in order processing and auth validation. Exact line numbers and snippets must be verified against source before planning fixes.

## References

- `context/bugs/BUG-001/bug-context.md`
