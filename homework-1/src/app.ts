import { Hono } from "hono";
import { rateLimitMiddleware } from "./rate-limit.js";
import { createAccountRoutes } from "./routes/accounts.js";
import { createTransactionRoutes } from "./routes/transactions.js";
import type { TransactionStore } from "./store.js";

export function createApp(store: TransactionStore) {
  const app = new Hono();

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "Internal server error" }, 500);
  });

  app.use("*", rateLimitMiddleware());

  app.route("/transactions", createTransactionRoutes(store));
  app.route("/accounts", createAccountRoutes(store));

  return app;
}
