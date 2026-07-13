import { describe, expect, it } from "vitest";
import {
  buildPipelineSummary,
  checkCompliance,
} from "../src/pipeline/compliance.js";
import type { ComplianceResult, RejectionResult } from "../src/types.js";
import { validatedEnvelope } from "./helpers/envelope.js";

function fraudReviewEnvelope(score: number, signals: string[]) {
  const envelope = validatedEnvelope({
    transaction_id: "TXN-FRAUD",
    amount: "25000.00",
    currency: "USD",
    transaction_type: "wire_transfer",
  });
  envelope.data.status = "fraud_review";
  envelope.data.risk_score = score;
  envelope.data.fraud_signals = signals;
  return envelope;
}

describe("checkCompliance", () => {
  it("flags high-value wire transfers for reporting", () => {
    const result = checkCompliance(
      fraudReviewEnvelope(55, ["high_value", "wire_transfer"]),
    );
    expect(result.compliance_status).toBe("flagged");
    expect(result.final_status).toBe("fraud_review");
    expect(result.reason).toContain("Fraud review required");
  });

  it("clears normal approved transactions", () => {
    const envelope = validatedEnvelope({ transaction_id: "TXN001" });
    envelope.data.status = "approved";
    envelope.data.risk_score = 0;
    envelope.data.fraud_signals = [];

    const result = checkCompliance(envelope);
    expect(result.compliance_status).toBe("cleared");
    expect(result.final_status).toBe("approved");
    expect(result.reason).toBeNull();
  });
});

describe("buildPipelineSummary", () => {
  it("aggregates approved, fraud_review, rejected, and compliance_flagged", () => {
    const rejections: RejectionResult[] = [
      {
        transaction_id: "TXN006",
        status: "rejected",
        final_status: "rejected",
        reason: "Invalid currency code",
        stage: "validator",
      },
      {
        transaction_id: "TXN007",
        status: "rejected",
        final_status: "rejected",
        reason: "Invalid amount",
        stage: "validator",
      },
    ];

    const compliance: ComplianceResult[] = [
      {
        transaction_id: "TXN001",
        final_status: "approved",
        compliance_status: "cleared",
        risk_score: 0,
        fraud_signals: [],
        reason: null,
        amount: "1500.00",
        currency: "USD",
        transaction_type: "transfer",
        timestamp: "2026-03-16T09:00:00Z",
      },
      {
        transaction_id: "TXN002",
        final_status: "fraud_review",
        compliance_status: "flagged",
        risk_score: 55,
        fraud_signals: ["high_value", "wire_transfer"],
        reason: "Fraud review required",
        amount: "25000.00",
        currency: "USD",
        transaction_type: "wire_transfer",
        timestamp: "2026-03-16T09:15:00Z",
      },
    ];

    const summary = buildPipelineSummary([...rejections, ...compliance]);
    expect(summary.total).toBe(4);
    expect(summary.approved).toBe(1);
    expect(summary.fraud_review).toBe(1);
    expect(summary.rejected).toBe(2);
    expect(summary.compliance_flagged).toBe(1);
    expect(summary.generated_at).toBeTruthy();
  });
});
