---
name: vitest-testing
description: >-
  Writes and extends Vitest tests for Node.js TypeScript projects: unit tests,
  Hono API integration via app.request(), validation cases, headers, and
  coverage-oriented suites. Use when adding or fixing tests, configuring
  vitest.config.ts, running npm test, or when the user mentions Vitest,
  test coverage, or API/integration testing.
---

# Vitest Testing (Node.js / TypeScript)

## Defaults

| Choice | Use |
|--------|-----|
| Runner | Vitest (`vitest run`, `vitest` watch) |
| Environment | `node` (not jsdom unless UI code) |
| Location | `test/**/*.test.ts` |
| Imports | ESM with `.js` extensions from `src/` |
| API tests | `app.request()` — no `serve()`, no fetch to real port |

Pair with the `hono-backend` skill when testing Hono apps.

## Config baseline

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
```

Add `coverage` only when the user asks for coverage reports.

## File structure

```
test/
  api.test.ts           # HTTP integration (grouped by feature/task)
  balance.test.ts       # pure functions (optional split)
```

Group with `describe("Feature or task name", () => { ... })`. One `it` per behavior; name reads as a spec: `"returns 400 when query is invalid"`.

## Test isolation

- **Fresh store per test** when state matters: `const store = createStore()` inside each `it`.
- **Shared app only** when tests are read-only or you seed store once for a single scenario.
- Do not rely on order across `it` blocks.

## HTTP integration pattern (Hono)

```typescript
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";

function json(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

describe("POST /items", () => {
  it("returns 201 with server-generated id", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x" }),
    });
    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.id).toBeDefined();
  });
});
```

Use full URLs: `http://localhost/path` (host is ignored; path matters).

## What to cover per endpoint

For each route, add tests for:

1. **Happy path** — status, body shape, server-generated fields
2. **Validation** — missing/invalid fields → `400` + `error` / `details`
3. **Not found** — unknown id → `404`
4. **Query/body edge cases** — empty, wrong type, boundary lengths
5. **Headers** — `Content-Type`, `Content-Disposition`, `Retry-After` when spec requires
6. **Side effects** — store updated, filters applied consistently across related endpoints

## Assertions

| Check | Matcher |
|-------|---------|
| Status | `expect(res.status).toBe(400)` |
| JSON field | `expect(body.error).toBe("Validation failed")` |
| Array | `expect(Array.isArray(body.details)).toBe(true)` |
| Regex id/timestamp | `expect(body.id).toMatch(/^txn_/)` |
| Floats | `expect(n).toBeCloseTo(5, 5)` |
| Header | `expect(res.headers.get("Retry-After")).toBeTruthy()` |
| CSV/text | `const text = await res.text()` then split/lines |
| Exclusion | `expect(text).not.toContain("f2")` |

Prefer exact status codes over loose ranges unless multiple are valid by design.

## Pure function tests

Test domain logic without HTTP when logic is non-trivial:

```typescript
import { describe, expect, it } from "vitest";
import { balancesForAccount } from "../src/balance.js";

describe("balancesForAccount", () => {
  it("sums completed deposits per currency", () => {
    const txs = [/* minimal fixtures */];
    expect(balancesForAccount("ACC-1", txs)).toEqual({ USD: 10 });
  });
});
```

Use small inline fixtures; extract helpers only when repeated across many cases.

## Workflow

1. Read the requirement or endpoint spec.
2. List behaviors (happy + errors + edge).
3. Implement tests **before or alongside** code (red-green when fixing bugs).
4. Run `npm test` (or `npx vitest run`); fix until green.
5. Avoid trivial tests that only assert mocks or constants.

## Avoid unless requested

- Supertest or hitting `localhost:3000` while `serve()` runs
- `jest` APIs or config
- Heavy `vi.mock` of entire modules when injection (`createApp(store)`) works
- Snapshot tests for JSON APIs (prefer explicit `expect`)
- `test.concurrent` for tests sharing mutable store/module state

## Additional resources

- Config, mocks, `it.each`, coverage: [reference.md](reference.md)
- API, CSV, rate-limit, seeding examples: [examples.md](examples.md)
- Hono API patterns: [../hono-backend/SKILL.md](../hono-backend/SKILL.md)
