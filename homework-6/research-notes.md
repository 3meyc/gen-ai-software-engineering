# Research Notes — HW6 Task 2

Context7 queries used during pipeline code generation.

---

## Query 1: decimal.js monetary arithmetic

- **Search:** `decimal.js compare amounts threshold Node.js`
- **context7 library ID:** `/MikeMcl/decimal.js`
- **Applied:** Used `Decimal` constructor for parsing amount strings from JSON; `gte()` for high-value threshold checks ($10,000 USD equivalent); `mul()` with fixed demo rates for EUR/GBP conversion. Avoided native `number` for all money comparisons in `src/pipeline/money.ts`.

---

## Query 2: Hono routing and Node server

- **Search:** `Hono app.route mount sub-app @hono/node-server`
- **context7 library ID:** `/honojs/hono`
- **Applied:** Factory pattern with `createApp()` wiring `app.route("/api/pipeline", subApp)` and `app.route("/api/results", subApp)`; served via `serve({ fetch: app.fetch, port })` from `@hono/node-server` in `src/api/server.ts`. CORS middleware for Vite dev origin.

---

## Query 3: Svelte 5 runes for dashboard state

- **Search:** `Svelte 5 $state $effect runes`
- **context7 library ID:** `/sveltejs/svelte`
- **Applied:** Dashboard uses `$state` for loading/error/summary/results and `$effect` for initial data load on mount in `frontend/src/App.svelte`.
