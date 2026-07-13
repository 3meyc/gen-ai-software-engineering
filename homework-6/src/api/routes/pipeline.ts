import { Hono } from "hono";
import { runPipeline } from "../../orchestrator.js";
import type { AppDeps } from "../app.js";

export function createPipelineRoutes(deps: AppDeps) {
  const r = new Hono();

  r.post("/run", async (c) => {
    try {
      const summary = await runPipeline({ sharedRoot: deps.sharedRoot });
      return c.json(summary, 200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Pipeline failed";
      return c.json({ error: message }, 500);
    }
  });

  return r;
}
