import type { MiddlewareHandler } from "hono";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

function isAssignmentApiPath(pathname: string): boolean {
  return pathname.startsWith("/transactions") || pathname.startsWith("/accounts");
}

function clientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

/**
 * Sliding 60s window: max 100 requests per IP on `/transactions` and `/accounts`.
 * `OPTIONS` is not counted. On limit: 429 + `Retry-After` (seconds).
 */
export function rateLimitMiddleware(): MiddlewareHandler {
  const buckets = new Map<string, number[]>();

  return async (c, next) => {
    const method = c.req.method;
    const path = new URL(c.req.url).pathname;

    if (!isAssignmentApiPath(path)) {
      await next();
      return;
    }

    if (method === "OPTIONS") {
      await next();
      return;
    }

    const ip = clientIp(c);
    const now = Date.now();
    let timestamps = buckets.get(ip);
    if (!timestamps) {
      timestamps = [];
      buckets.set(ip, timestamps);
    }

    const cutoff = now - WINDOW_MS;
    while (timestamps.length > 0 && timestamps[0]! < cutoff) {
      timestamps.shift();
    }

    if (timestamps.length >= MAX_REQUESTS) {
      const oldest = timestamps[0]!;
      const retryAfterMs = oldest + WINDOW_MS - now;
      const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
      c.header("Retry-After", String(retryAfterSec));
      return c.json({ error: "Too many requests" }, 429);
    }

    timestamps.push(now);
    await next();
  };
}
