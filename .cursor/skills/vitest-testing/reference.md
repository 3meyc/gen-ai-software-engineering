# Vitest Reference

## package.json scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## Running

```bash
npm test
npx vitest run test/api.test.ts
npx vitest --watch
```

## Matchers (common)

```typescript
expect(value).toBe(3);
expect(obj).toEqual({ a: 1 });
expect(arr).toHaveLength(2);
expect(fn).toThrow();
expect(promise).rejects.toThrow("msg");
expect(n).toBeGreaterThanOrEqual(1);
expect([404, 204]).toContain(status);
```

## Parameterized tests

```typescript
it.each([
  ["pending", 201],
  ["unknown", 400],
])("status %s → %i", async (status, expected) => {
  const res = await app.request(/* ... */);
  expect(res.status).toBe(expected);
});
```

Use when many similar validation cases share one setup.

## Seeding store in tests

```typescript
const store = createStore();
store.add({
  id: "t1",
  /* required fields per domain type */,
});
const app = createApp(store);
```

Prefer `store.add` over POST when the test targets GET/filter/export behavior, not POST validation.

## Multipart / file upload

```typescript
const form = new FormData();
form.append("file", new Blob([csvContent], { type: "text/csv" }), "tickets.csv");

const res = await app.request("http://localhost/tickets/import", {
  method: "POST",
  body: form,
});
```

Assert import summary shape: `total`, `successful`, `failed`, `errors`.

## Mocks (sparingly)

```typescript
import { vi } from "vitest";

vi.useFakeTimers();
vi.setSystemTime(new Date("2026-01-01"));
// ... test rate-limit window ...
vi.useRealTimers();
```

Prefer fake timers only for time-dependent logic (rate limits, TTL). Prefer dependency injection over `vi.mock("../src/store.js")`.

## Coverage (when requested)

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      thresholds: { lines: 85 },
    },
  },
});
```

Run: `npx vitest run --coverage`. Focus tests on branches (validation, errors, filters), not line-padding.

## Debugging failures

1. Log body once: `console.log(await res.json())` — remove before commit.
2. Confirm fresh `createStore()` if state leaked from a prior test.
3. Confirm URL path matches mounted route prefix.
4. For 429 tests, reset or use isolated app instance per test.

## TypeScript

Vitest globals are available without importing when using default types. This project imports explicitly:

```typescript
import { describe, expect, it } from "vitest";
```

Match existing test files in the repo.
