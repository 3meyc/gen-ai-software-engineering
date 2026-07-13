import path from "node:path";
import type { FraudResult, PipelineEnvelope } from "../types.js";
import { logAudit } from "./audit-log.js";
import {
  FRAUD_SCORES,
  FRAUD_THRESHOLD,
  UNUSUAL_HOUR_END,
  UNUSUAL_HOUR_START,
} from "./constants.js";
import {
  getSharedRoot,
  readJsonFiles,
  sharedDir,
  transactionFileName,
  writeJson,
} from "./fs-utils.js";
import { isHighValue, parseAmount } from "./money.js";

function isUnusualTiming(timestamp: string): boolean {
  const hour = new Date(timestamp).getUTCHours();
  return hour >= UNUSUAL_HOUR_START && hour < UNUSUAL_HOUR_END;
}

export function scoreTransaction(envelope: PipelineEnvelope): FraudResult {
  const { data } = envelope;
  const fraud_signals: string[] = [];
  let risk_score = 0;

  const parsedAmount = parseAmount(data.amount);
  if (parsedAmount && isHighValue(parsedAmount, data.currency)) {
    risk_score += FRAUD_SCORES.highValue;
    fraud_signals.push("high_value");
  }

  if (data.metadata?.country && data.metadata.country !== "US") {
    risk_score += FRAUD_SCORES.crossBorder;
    fraud_signals.push("cross_border");
  }

  if (isUnusualTiming(data.timestamp)) {
    risk_score += FRAUD_SCORES.unusualTiming;
    fraud_signals.push("unusual_timing");
  }

  if (data.transaction_type === "wire_transfer") {
    risk_score += FRAUD_SCORES.wireTransfer;
    fraud_signals.push("wire_transfer");
  }

  const status = risk_score >= FRAUD_THRESHOLD ? "fraud_review" : "approved";

  const updatedEnvelope: PipelineEnvelope = {
    ...envelope,
    source_stage: "fraud_detector",
    target_stage: "compliance",
    timestamp: new Date().toISOString(),
    data: {
      ...data,
      status,
      risk_score,
      fraud_signals,
    },
  };

  return {
    envelope: updatedEnvelope,
    risk_score,
    fraud_signals,
    status,
  };
}

export async function runFraudDetector(sharedRoot?: string): Promise<FraudResult[]> {
  const root = getSharedRoot(sharedRoot);
  const outputDir = sharedDir(root, "output");
  const processingDir = sharedDir(root, "processing");

  const envelopes = await readJsonFiles<PipelineEnvelope>(outputDir);
  const results: FraudResult[] = [];

  for (const envelope of envelopes) {
    const processingPath = path.join(
      processingDir,
      transactionFileName(envelope.data.transaction_id),
    );
    await writeJson(processingPath, envelope);

    const result = scoreTransaction(envelope);
    results.push(result);
    logAudit("fraud_detector", envelope.data.transaction_id, result.status);

    await writeJson(
      path.join(outputDir, transactionFileName(envelope.data.transaction_id)),
      result.envelope,
    );
  }

  return results;
}
