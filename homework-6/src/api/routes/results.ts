import { readFile } from "node:fs/promises";
import path from "node:path";
import { readdir } from "node:fs/promises";
import { Hono } from "hono";
import { getSharedRoot, sharedDir } from "../../pipeline/fs-utils.js";
import type { AppDeps } from "../app.js";

export function createResultsRoutes(deps: AppDeps) {
  const r = new Hono();

  r.get("/", async (c) => {
    const root = getSharedRoot(deps.sharedRoot);
    const resultsDir = sharedDir(root, "results");
    const files = await readdir(resultsDir);
    const txnFiles = files.filter(
      (f) => f.endsWith(".json") && f !== "pipeline-summary.json",
    );

    const results = await Promise.all(
      txnFiles.map(async (file) => {
        const content = await readFile(path.join(resultsDir, file), "utf8");
        return JSON.parse(content);
      }),
    );

    return c.json(results, 200);
  });

  r.get("/:transactionId", async (c) => {
    const root = getSharedRoot(deps.sharedRoot);
    const transactionId = c.req.param("transactionId");
    const filePath = path.join(
      sharedDir(root, "results"),
      `${transactionId}.json`,
    );

    try {
      const content = await readFile(filePath, "utf8");
      return c.json(JSON.parse(content), 200);
    } catch {
      return c.json({ error: "Not found" }, 404);
    }
  });

  return r;
}
