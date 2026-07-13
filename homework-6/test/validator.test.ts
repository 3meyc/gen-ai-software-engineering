import { describe, expect, it } from "vitest";
import { processTransaction } from "../src/pipeline/validator.js";
import { baseTransaction } from "./helpers/envelope.js";

describe("processTransaction", () => {
  it("accepts a valid transaction", () => {
    const result = processTransaction(baseTransaction(), { dryRun: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.envelope.data.status).toBe("validated");
      expect(result.envelope.target_stage).toBe("fraud_detector");
    }
  });

  it("rejects TXN006 invalid currency", () => {
    const result = processTransaction(
      baseTransaction({ transaction_id: "TXN006", currency: "XYZ" }),
      { dryRun: true },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.rejection.reason).toBe("Invalid currency code");
      expect(result.rejection.stage).toBe("validator");
    }
  });

  it("rejects TXN007 negative amount", () => {
    const result = processTransaction(
      baseTransaction({ transaction_id: "TXN007", amount: "-100.00", currency: "GBP" }),
      { dryRun: true },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.rejection.reason).toBe("Invalid amount");
    }
  });

  it("rejects missing required field", () => {
    const record = baseTransaction();
    delete (record as { description?: string }).description;
    const result = processTransaction(record, { dryRun: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.rejection.reason).toContain("Missing required field");
    }
  });

  it("rejects invalid timestamp", () => {
    const result = processTransaction(
      baseTransaction({ timestamp: "not-a-date" }),
      { dryRun: true },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.rejection.reason).toBe("Invalid timestamp format");
    }
  });
});
