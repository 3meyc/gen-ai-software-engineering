import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { runPipeline } from "../src/orchestrator.js";
import { createTmpShared } from "./helpers/tmp-shared.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "sample-transactions.json");

describe("pipeline integration", () => {
  let tmp: Awaited<ReturnType<typeof createTmpShared>>;

  afterEach(async () => {
    if (tmp) await tmp.cleanup();
  });

  it("runs full pipeline on sample transactions in isolated tmp dir", async () => {
    tmp = await createTmpShared();
    const summary = await runPipeline({
      sharedRoot: tmp.sharedRoot,
      samplePath: fixturePath,
    });

    expect(summary.total).toBe(8);
    expect(summary.approved).toBe(4);
    expect(summary.fraud_review).toBe(2);
    expect(summary.rejected).toBe(2);
    expect(summary.compliance_flagged).toBe(2);
  });
});
