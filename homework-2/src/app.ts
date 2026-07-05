import { Hono } from "hono";
import { createTicketRoutes } from "./routes/tickets.js";
import type { TicketStore } from "./store.js";

export function createApp(store: TicketStore) {
  const app = new Hono();

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "Internal server error" }, 500);
  });

  app.route("/tickets", createTicketRoutes(store));

  return app;
}
