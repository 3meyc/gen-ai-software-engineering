import { describe, expect, it } from "vitest";
import { FRAUD_THRESHOLD } from "../src/pipeline/constants.js";
import { scoreTransaction } from "../src/pipeline/fraud-detector.js";
import { validatedEnvelope } from "./helpers/envelope.js";

describe("scoreTransaction", () => {
  it("TXN002 high-value wire → fraud_review", () => {
    const result = scoreTransaction(
      validatedEnvelope({
        transaction_id: "TXN002",
        amount: "25000.00",
        currency: "USD",
        transaction_type: "wire_transfer",
      }),
    );
    expect(result.risk_score).toBeGreaterThanOrEqual(FRAUD_THRESHOLD);
    expect(result.status).toBe("fraud_review");
    expect(result.fraud_signals).toContain("high_value");
    expect(result.fraud_signals).toContain("wire_transfer");
  });

  it("TXN003 just under $10k → approved with score 0", () => {
    const result = scoreTransaction(
      validatedEnvelope({
        transaction_id: "TXN003",
        amount: "9999.99",
        currency: "USD",
      }),
    );
    expect(result.risk_score).toBe(0);
    expect(result.status).toBe("approved");
    expect(result.fraud_signals).toHaveLength(0);
  });

  it("TXN004 cross-border + unusual timing → approved (score 45)", () => {
    const result = scoreTransaction(
      validatedEnvelope({
        transaction_id: "TXN004",
        amount: "500.00",
        currency: "EUR",
        timestamp: "2026-03-16T02:47:00Z",
        metadata: { country: "DE" },
      }),
    );
    expect(result.risk_score).toBe(45);
    expect(result.status).toBe("approved");
    expect(result.fraud_signals).toEqual(
      expect.arrayContaining(["cross_border", "unusual_timing"]),
    );
  });

  it("attaches risk_score and fraud_signals to envelope data", () => {
    const result = scoreTransaction(validatedEnvelope());
    expect(result.envelope.data.risk_score).toBe(result.risk_score);
    expect(result.envelope.data.fraud_signals).toEqual(result.fraud_signals);
    expect(result.envelope.source_stage).toBe("fraud_detector");
    expect(result.envelope.target_stage).toBe("compliance");
  });
});
