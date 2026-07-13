import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/api/app.js";
import { createTmpShared } from "./helpers/tmp-shared.js";

function json(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

describe("API", () => {
  let tmp: Awaited<ReturnType<typeof createTmpShared>>;

  afterEach(async () => {
    if (tmp) await tmp.cleanup();
  });

  it("GET /api/summary returns 404 when no pipeline has run", async () => {
    tmp = await createTmpShared();
    const app = createApp({ sharedRoot: tmp.sharedRoot });
    const res = await app.request("http://localhost/api/summary");
    expect(res.status).toBe(404);
  });

  it("POST /api/pipeline/run executes pipeline and returns summary", async () => {
    tmp = await createTmpShared();
    const app = createApp({ sharedRoot: tmp.sharedRoot });

    const runRes = await app.request("http://localhost/api/pipeline/run", {
      method: "POST",
    });

    expect(runRes.status).toBe(200);
    const summary = await json(runRes);
    expect(summary.total).toBe(8);
    expect(summary.approved).toBe(4);
    expect(summary.fraud_review).toBe(2);
    expect(summary.rejected).toBe(2);
  });

  it("GET /api/results lists transaction results after pipeline run", async () => {
    tmp = await createTmpShared();
    const app = createApp({ sharedRoot: tmp.sharedRoot });

    await app.request("http://localhost/api/pipeline/run", { method: "POST" });

    const res = await app.request("http://localhost/api/results");
    expect(res.status).toBe(200);
    const results = (await res.json()) as unknown[];
    expect(results).toHaveLength(8);
  });

  it("GET /api/results/:id returns single result or 404", async () => {
    tmp = await createTmpShared();
    const app = createApp({ sharedRoot: tmp.sharedRoot });

    await app.request("http://localhost/api/pipeline/run", { method: "POST" });

    const found = await app.request("http://localhost/api/results/TXN006");
    expect(found.status).toBe(200);
    const body = await json(found);
    expect(body.transaction_id).toBe("TXN006");
    expect(body.final_status ?? body.status).toBe("rejected");

    const missing = await app.request("http://localhost/api/results/TXN999");
    expect(missing.status).toBe(404);
  });

  it("GET /api/summary returns pipeline summary after run", async () => {
    tmp = await createTmpShared();
    const app = createApp({ sharedRoot: tmp.sharedRoot });

    await app.request("http://localhost/api/pipeline/run", { method: "POST" });

    const res = await app.request("http://localhost/api/summary");
    expect(res.status).toBe(200);
    const summary = await json(res);
    expect(summary.compliance_flagged).toBe(2);
  });
});
