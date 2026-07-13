import { readFile } from "node:fs/promises";
import path from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getSharedRoot, sharedDir } from "../pipeline/fs-utils.js";
import { createPipelineRoutes } from "./routes/pipeline.js";
import { createResultsRoutes } from "./routes/results.js";

export type AppDeps = {
  sharedRoot?: string;
};

export function createApp(deps: AppDeps = {}) {
  const app = new Hono();

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "Internal server error" }, 500);
  });

  app.use(
    "*",
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    }),
  );

  app.get("/api/summary", async (c) => {
    const root = getSharedRoot(deps.sharedRoot);
    const summaryPath = path.join(sharedDir(root, "results"), "pipeline-summary.json");
    try {
      const content = await readFile(summaryPath, "utf8");
      return c.json(JSON.parse(content), 200);
    } catch {
      return c.json({ error: "Summary not found" }, 404);
    }
  });

  app.route("/api/pipeline", createPipelineRoutes(deps));
  app.route("/api/results", createResultsRoutes(deps));

  return app;
}
