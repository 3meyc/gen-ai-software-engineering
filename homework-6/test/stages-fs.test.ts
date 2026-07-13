import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logAudit } from "../src/pipeline/audit-log.js";
import {
  clearDir,
  createEnvelope,
  readJsonFiles,
  sharedDir,
  transactionFileName,
  writeJson,
} from "../src/pipeline/fs-utils.js";
import { runCompliance } from "../src/pipeline/compliance.js";
import { runFraudDetector } from "../src/pipeline/fraud-detector.js";
import { runValidator } from "../src/pipeline/validator.js";
import { baseTransaction } from "./helpers/envelope.js";
import { createTmpShared } from "./helpers/tmp-shared.js";

describe("pipeline stage filesystem runners", () => {
  let tmp: Awaited<ReturnType<typeof createTmpShared>>;

  afterEach(async () => {
    if (tmp) await tmp.cleanup();
  });

  it("runValidator writes valid envelopes to output and rejections to results", async () => {
    tmp = await createTmpShared();
    const inputDir = sharedDir(tmp.sharedRoot, "input");
    const valid = createEnvelope(baseTransaction(), "orchestrator", "validator");
    const invalid = createEnvelope(
      baseTransaction({ transaction_id: "TXN-BAD", currency: "XYZ" }),
      "orchestrator",
      "validator",
    );

    await writeJson(
      path.join(inputDir, transactionFileName("TXN-OK")),
      valid,
    );
    await writeJson(
      path.join(inputDir, transactionFileName("TXN-BAD")),
      invalid,
    );

    const { valid: validOut, rejected } = await runValidator(tmp.sharedRoot);
    expect(validOut).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toBe("Invalid currency code");
  });

  it("runFraudDetector scores validated envelopes in output dir", async () => {
    tmp = await createTmpShared();
    const outputDir = sharedDir(tmp.sharedRoot, "output");
    const envelope = createEnvelope(
      baseTransaction({ transaction_id: "TXN-WIRE", amount: "25000.00", transaction_type: "wire_transfer" }),
      "validator",
      "fraud_detector",
    );
    envelope.data.status = "validated";

    await writeJson(
      path.join(outputDir, transactionFileName("TXN-WIRE")),
      envelope,
    );

    const results = await runFraudDetector(tmp.sharedRoot);
    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe("fraud_review");
  });

  it("runCompliance writes final results and summary", async () => {
    tmp = await createTmpShared();
    const outputDir = sharedDir(tmp.sharedRoot, "output");
    const envelope = createEnvelope(
      baseTransaction({ transaction_id: "TXN-OK" }),
      "fraud_detector",
      "compliance",
    );
    envelope.data.status = "approved";
    envelope.data.risk_score = 0;
    envelope.data.fraud_signals = [];

    await writeJson(path.join(outputDir, transactionFileName("TXN-OK")), envelope);

    const { results, summary } = await runCompliance(tmp.sharedRoot);
    expect(results).toHaveLength(1);
    expect(summary.approved).toBe(1);

    const stored = await readJsonFiles(path.join(tmp.sharedRoot, "results"));
    expect(stored.length).toBeGreaterThanOrEqual(2);
  });

  it("clearDir removes json files but keeps .gitkeep", async () => {
    tmp = await createTmpShared();
    const inputDir = sharedDir(tmp.sharedRoot, "input");
    await writeJson(path.join(inputDir, "test.json"), { ok: true });
    await clearDir(tmp.sharedRoot, "input");
    const files = await readJsonFiles(inputDir);
    expect(files).toHaveLength(0);
  });

  it("logAudit writes structured audit entry to console", () => {
    const spy = vi.spyOn(console, "log");
    logAudit("validator", "TXN001", "validated");
    expect(spy).toHaveBeenCalled();
    const payload = JSON.parse(String(spy.mock.calls[0]?.[0]));
    expect(payload.stage).toBe("validator");
    expect(payload.transaction_id).toBe("TXN001");
    spy.mockRestore();
  });
});
