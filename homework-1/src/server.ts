import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createStore } from "./store.js";

const store = createStore();
const app = createApp(store);

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
