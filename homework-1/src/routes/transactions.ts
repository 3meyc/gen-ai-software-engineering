import { Hono } from "hono";
import type { TransactionStore } from "../store.js";
import {
  filterTransactionsForListQuery,
  finalizeTransaction,
  parseCreateTransactionBody,
} from "../transaction-logic.js";

export function createTransactionRoutes(store: TransactionStore) {
  const r = new Hono();

  r.get("/", (c) => {
    const params = new URL(c.req.url).searchParams;
    const result = filterTransactionsForListQuery(store.list(), params);
    if (!result.ok) {
      return c.json({ error: result.error, details: result.details }, 400);
    }
    return c.json(result.filtered, 200);
  });

  r.get("/:id", (c) => {
    const id = c.req.param("id");
    const tx = store.get(id);
    if (!tx) {
      return c.json({ error: "Transaction not found" }, 404);
    }
    return c.json(tx, 200);
  });

  r.post("/", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return c.json({ error: "Request body must be a JSON object" }, 400);
    }

    const parsed = parseCreateTransactionBody(body as Record<string, unknown>);
    if (!parsed.ok) {
      return c.json({ error: parsed.error, details: parsed.details }, 400);
    }

    const created = finalizeTransaction(parsed.transaction);
    store.add(created);
    return c.json(created, 201);
  });

  return r;
}
