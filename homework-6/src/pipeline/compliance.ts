import path from "node:path";
import type {
  ComplianceResult,
  FinalResult,
  PipelineEnvelope,
  PipelineSummary,
  RejectionResult,
} from "../types.js";
import { logAudit } from "./audit-log.js";
import { FRAUD_THRESHOLD } from "./constants.js";
import {
  getSharedRoot,
  readJsonFiles,
  sharedDir,
  transactionFileName,
  writeJson,
} from "./fs-utils.js";
import { isHighValue, parseAmount } from "./money.js";

function isWireHighValue(data: PipelineEnvelope["data"]): boolean {
  if (data.transaction_type !== "wire_transfer") return false;
  const amount = parseAmount(data.amount);
  if (!amount) return false;
  return isHighValue(amount, data.currency);
}

export function checkCompliance(envelope: PipelineEnvelope): ComplianceResult {
  const { data } = envelope;
  const risk_score = data.risk_score ?? 0;
  const fraud_signals = data.fraud_signals ?? [];

  const compliance_flagged =
    isWireHighValue(data) || risk_score >= FRAUD_THRESHOLD;
  const compliance_status = compliance_flagged ? "flagged" : "cleared";

  const final_status =
    risk_score >= FRAUD_THRESHOLD ? "fraud_review" : "approved";

  let reason: string | null = null;
  if (final_status === "fraud_review") {
    reason = `Fraud review required (score ${risk_score}: ${fraud_signals.join(", ")})`;
  } else if (compliance_flagged) {
    reason = "Compliance flagged for reporting";
  }

  return {
    transaction_id: data.transaction_id,
    final_status,
    compliance_status,
    risk_score,
    fraud_signals,
    reason,
    amount: data.amount,
    currency: data.currency,
    transaction_type: data.transaction_type,
    timestamp: data.timestamp,
  };
}

export function buildPipelineSummary(results: FinalResult[]): PipelineSummary {
  let approved = 0;
  let fraud_review = 0;
  let rejected = 0;
  let compliance_flagged = 0;

  for (const result of results) {
    if ("stage" in result && result.stage === "validator") {
      rejected += 1;
      continue;
    }

    const compliance = result as ComplianceResult;
    if (compliance.final_status === "approved") approved += 1;
    if (compliance.final_status === "fraud_review") fraud_review += 1;
    if (compliance.compliance_status === "flagged") compliance_flagged += 1;
  }

  return {
    total: results.length,
    approved,
    fraud_review,
    rejected,
    compliance_flagged,
    generated_at: new Date().toISOString(),
  };
}

export async function writePipelineSummary(
  sharedRoot: string,
  results: FinalResult[],
): Promise<PipelineSummary> {
  const summary = buildPipelineSummary(results);
  const summaryPath = path.join(sharedDir(sharedRoot, "results"), "pipeline-summary.json");
  await writeJson(summaryPath, summary);
  return summary;
}

export async function runCompliance(sharedRoot?: string): Promise<{
  results: ComplianceResult[];
  summary: PipelineSummary;
}> {
  const root = getSharedRoot(sharedRoot);
  const outputDir = sharedDir(root, "output");
  const resultsDir = sharedDir(root, "results");
  const processingDir = sharedDir(root, "processing");

  const envelopes = await readJsonFiles<PipelineEnvelope>(outputDir);
  const complianceResults: ComplianceResult[] = [];

  for (const envelope of envelopes) {
    const processingPath = path.join(
      processingDir,
      transactionFileName(envelope.data.transaction_id),
    );
    await writeJson(processingPath, envelope);

    const result = checkCompliance(envelope);
    complianceResults.push(result);
    logAudit("compliance", result.transaction_id, result.final_status);

    await writeJson(
      path.join(resultsDir, transactionFileName(result.transaction_id)),
      result,
    );
  }

  const existingRejections = await readJsonFiles<RejectionResult>(resultsDir);
  const rejections = existingRejections.filter(
    (r): r is RejectionResult => "stage" in r && r.stage === "validator",
  );

  const allResults: FinalResult[] = [...rejections, ...complianceResults];
  const summary = await writePipelineSummary(root, allResults);

  return { results: complianceResults, summary };
}
