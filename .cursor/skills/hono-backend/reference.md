# Hono Backend Reference

## Context (`c`) essentials

| API | Purpose |
|-----|---------|
| `c.req.param("id")` | Path params |
| `c.req.query("key")` | Query string |
| `c.req.header("name")` | Request headers |
| `await c.req.json()` | JSON body |
| `await c.req.parseBody()` | Form / multipart |
| `c.req.raw` | Underlying `Request` |
| `c.json(data, status)` | JSON response |
| `c.text(body, status)` | Plain text |
| `c.body(null, 204)` | No content |
| `c.redirect(url, 302)` | Redirect |

## Grouping and mounting

```typescript
const api = new Hono();
api.route("/v1", v1App);
app.route("/api", api);
```

Order matters: more specific routes before parametric ones (`/search` before `/:id`).

## Typed bindings (optional)

```typescript
type Env = { Variables: { requestId: string } };
const app = new Hono<Env>();
app.use("*", async (c, next) => {
  c.set("requestId", crypto.randomUUID());
  await next();
});
```

## Common middleware patterns

**Request ID + timing**

```typescript
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  c.header("X-Response-Time", `${Date.now() - start}ms`);
});
```

**Simple in-memory rate limit** — track counts per key (IP or API key) in a `Map` with window reset; return `429` when exceeded.

**CORS** — add `@hono/cors` only if the user needs browser clients:

```typescript
import { cors } from "hono/cors";
app.use("*", cors());
```

## Error handling

```typescript
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));
```

Throw only for unexpected failures; return `c.json(..., 4xx)` for expected client errors.

## Bulk import endpoints

For `POST /resource/import` accepting CSV/JSON/XML:

1. Detect format from `Content-Type` or file extension query param.
2. Parse in a dedicated module; never block the event loop on huge files without streaming (for homework-scale files, in-memory parse is fine).
3. Validate each record; collect per-row errors.
4. Respond with `{ total, successful, failed, errors: [{ row, message }] }` and `201` or `207`/`400` per project spec.

## package.json baseline

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "tsx src/server.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@hono/node-server": "^2",
    "hono": "^4"
  },
  "devDependencies": {
    "@types/node": "^25",
    "tsx": "^4",
    "typescript": "^6",
    "vitest": "^4"
  }
}
```

## tsconfig hints

- `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`
- `"strict": true`
- Include `src` and `test`

## When to add libraries

| Need | Library |
|------|---------|
| Schema validation | `@hono/zod-validator` + `zod` (user request) |
| OpenAPI docs | `@hono/zod-openapi` (user request) |
| JWT auth | `hono/jwt` or custom middleware (user request) |
| HTML/views | `hono/jsx` (user request) |

Default: zero extra Hono plugins beyond `@hono/node-server`.
