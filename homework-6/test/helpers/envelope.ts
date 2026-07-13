import type { PipelineEnvelope, RawTransaction } from "../../src/types.js";
import { createEnvelope } from "../../src/pipeline/fs-utils.js";

export function baseTransaction(
  overrides: Partial<RawTransaction> = {},
): RawTransaction {
  return {
    transaction_id: "TXN-TEST",
    timestamp: "2026-03-16T09:00:00Z",
    source_account: "ACC-1001",
    destination_account: "ACC-2001",
    amount: "1500.00",
    currency: "USD",
    transaction_type: "transfer",
    description: "Test payment",
    metadata: { channel: "online", country: "US" },
    ...overrides,
  };
}

export function validatedEnvelope(
  overrides: Partial<RawTransaction> = {},
): PipelineEnvelope {
  const envelope = createEnvelope(
    baseTransaction(overrides),
    "validator",
    "fraud_detector",
  );
  envelope.data.status = "validated";
  return envelope;
}
