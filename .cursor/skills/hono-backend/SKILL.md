---
name: hono-backend
description: >-
  Builds Node.js REST APIs with Hono, TypeScript, and @hono/node-server using
  factory-based apps, modular routes, in-memory stores, and Vitest. Use when
  creating or modifying Hono backends, API routes, middleware, validation, or
  tests on Node.js, or when the user mentions Hono, hono/node-server, or
  TypeScript API servers.
---

# Hono Backend (Node.js)

## Defaults

| Choice | Use |
|--------|-----|
| Runtime | Node.js, ESM (`"type": "module"`) |
| Framework | `hono` + `@hono/node-server` |
| Language | TypeScript (strict), `.js` extensions in imports |
| Dev | `tsx watch src/server.ts` |
| Test | Vitest + `app.request()` (no live server) |
| Storage | In-memory store module until DB is requested |

## Project layout

```
src/
  app.ts          # createApp(deps) — wires middleware + routes
  server.ts       # serve({ fetch: app.fetch, port })
  store.ts        # createStore(), typed CRUD
  types.ts        # domain types
  routes/*.ts     # createXRoutes(deps) → Hono sub-app
test/
  *.test.ts       # integration tests via app.request()
```

Keep domain logic out of route handlers when it grows past a few lines — extract pure functions in sibling modules.

## App factory pattern

```typescript
import { Hono } from "hono";
import { createTicketRoutes } from "./routes/tickets.js";
import type { TicketStore } from "./store.js";

export function createApp(store: TicketStore) {
  const app = new Hono();

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "Internal server error" }, 500);
  });

  app.use("*", /* global middleware */);
  app.route("/tickets", createTicketRoutes(store));

  return app;
}
```

Inject dependencies (store, config) into `createApp` and route factories — no module-level mutable singletons.

## Route modules

```typescript
import { Hono } from "hono";
import type { TicketStore } from "../store.js";

export function createTicketRoutes(store: TicketStore) {
  const r = new Hono();

  r.get("/", (c) => c.json(store.list(), 200));
  r.get("/:id", (c) => {
    const item = store.get(c.req.param("id"));
    if (!item) return c.json({ error: "Not found" }, 404);
    return c.json(item, 200);
  });

  return r;
}
```

- Mount with `app.route("/prefix", subApp)` — paths in the sub-app are relative to the prefix.
- Return consistent JSON error shapes: `{ error: string }` or `{ error, details: [{ field, message }] }`.
- Use correct status codes: `201` create, `200` OK, `400` validation, `404` missing, `409` conflict, `429` rate limit.

## Server entry

```typescript
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createStore } from "./store.js";

const app = createApp(createStore());
const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
```

## Validation (manual first)

Prefer explicit parsing in route handlers or small `parseX()` helpers returning `{ ok: true, value } | { ok: false, details }`. Do not add Zod/Valibot unless the user asks.

For query params: `new URL(c.req.url).searchParams` or `c.req.query()`.

For JSON body: `await c.req.json()` inside try/catch; invalid JSON → `400`.

## Middleware

```typescript
import type { MiddlewareHandler } from "hono";

export function exampleMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    await next();
  };
}
```

Register global middleware with `app.use("*", fn)` before routes. Per-route: `r.use("/path", fn)` or inline before handlers.

## Testing

```typescript
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";

describe("API", () => {
  it("POST /items returns 201", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x" }),
    });
    expect(res.status).toBe(201);
  });
});
```

- Fresh `createStore()` per test for isolation.
- Use full URLs in `app.request("http://localhost/...")`.
- Parse bodies with `await res.json()`.

## Implementation workflow

1. Read existing `src/` layout and match naming/import style.
2. Define types in `types.ts`, store API in `store.ts`.
3. Add route module; mount in `app.ts`.
4. Add Vitest cases for happy path, validation errors, and 404.
5. Run `npm test` before finishing.

## Avoid unless requested

- Express/Fastify substitution
- DI containers, ORMs, heavy layered architecture
- Classes for simple CRUD
- Global mutable state
- Starting a real HTTP server in tests

## Additional resources

- Middleware, context API, file uploads: [reference.md](reference.md)
- Full route, store, and test examples: [examples.md](examples.md)
- Vitest patterns: [../vitest-testing/SKILL.md](../vitest-testing/SKILL.md)
