import { Hono } from "hono";
import { transactionsToCsv } from "../csv-export.js";
import type { TransactionStore } from "../store.js";
import {
  filterTransactionsForListQuery,
  finalizeTransaction,
  parseCreateTransactionBody,
} from "../transaction-logic.js";

export function createTransactionRoutes(store: TransactionStore) {
  const r = new Hono();

  r.get("/export", (c) => {
    const params = new URL(c.req.url).searchParams;
    const format = params.get("format")?.trim().toLowerCase();
    if (format !== "csv") {
      return c.json(
        {
          error: "Validation failed",
          details: [{ field: "format", message: 'format must be "csv"' }],
        },
        400,
      );
    }
    const result = filterTransactionsForListQuery(store.list(), params);
    if (!result.ok) {
      return c.json({ error: result.error, details: result.details }, 400);
    }
    const body = transactionsToCsv(result.filtered);
    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", 'attachment; filename="transactions.csv"');
    return c.body(body, 200);
  });

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
