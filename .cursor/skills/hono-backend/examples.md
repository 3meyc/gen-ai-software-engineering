# Hono Backend Examples

## Store module

```typescript
// store.ts
import type { Ticket } from "./types.js";

export type TicketStore = {
  list(): Ticket[];
  get(id: string): Ticket | undefined;
  add(ticket: Ticket): void;
  update(id: string, patch: Partial<Ticket>): Ticket | undefined;
  remove(id: string): boolean;
};

export function createStore(): TicketStore {
  const byId = new Map<string, Ticket>();

  return {
    list: () => [...byId.values()],
    get: (id) => byId.get(id),
    add: (t) => { byId.set(t.id, t); },
    update: (id, patch) => {
      const cur = byId.get(id);
      if (!cur) return undefined;
      const next = { ...cur, ...patch, updated_at: new Date().toISOString() };
      byId.set(id, next);
      return next;
    },
    remove: (id) => byId.delete(id),
  };
}
```

## POST with validation

```typescript
r.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const parsed = validateCreateTicket(body);
  if (!parsed.ok) {
    return c.json({ error: "Validation failed", details: parsed.details }, 400);
  }

  const ticket = {
    ...parsed.value,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.add(ticket);
  return c.json(ticket, 201);
});
```

```typescript
function validateCreateTicket(
  body: unknown,
): { ok: true; value: CreateTicketInput } | { ok: false; details: { field: string; message: string }[] } {
  if (!body || typeof body !== "object") {
    return { ok: false, details: [{ field: "body", message: "Expected object" }] };
  }
  const b = body as Record<string, unknown>;
  const details: { field: string; message: string }[] = [];

  if (typeof b.subject !== "string" || b.subject.length < 1 || b.subject.length > 200) {
    details.push({ field: "subject", message: "Required string, 1-200 chars" });
  }
  // ... more fields

  if (details.length) return { ok: false, details };
  return { ok: true, value: b as CreateTicketInput };
}
```

## GET with query filters

```typescript
r.get("/", (c) => {
  const status = c.req.query("status");
  const category = c.req.query("category");
  let items = store.list();
  if (status) items = items.filter((t) => t.status === status);
  if (category) items = items.filter((t) => t.category === category);
  return c.json(items, 200);
});
```

## Rate-limit middleware (sketch)

```typescript
import type { MiddlewareHandler } from "hono";

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(max = 100, windowMs = 60_000): MiddlewareHandler {
  return async (c, next) => {
    const key = c.req.header("x-forwarded-for") ?? "local";
    const now = Date.now();
    let bucket = hits.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      hits.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      return c.json({ error: "Too many requests" }, 429);
    }
    await next();
  };
}
```

## Vitest: validation + 404

```typescript
it("returns 400 for invalid email", async () => {
  const app = createApp(createStore());
  const res = await app.request("http://localhost/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer_email: "not-an-email", subject: "x", description: "1234567890" }),
  });
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBe("Validation failed");
});

it("returns 404 for missing ticket", async () => {
  const app = createApp(createStore());
  const res = await app.request("http://localhost/tickets/missing-id");
  expect(res.status).toBe(404);
});
```

## Sample .http file (manual checks)

```http
### Create ticket
POST http://localhost:3000/tickets
Content-Type: application/json

{
  "customer_id": "c1",
  "customer_email": "a@b.com",
  "subject": "Login issue",
  "description": "Cannot reset password after update"
}
```
