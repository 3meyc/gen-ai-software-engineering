import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ComplianceResult, PipelineSummary, RejectionResult } from "../src/types.js";
import { getSharedRoot, readJsonFiles, sharedDir } from "../src/pipeline/fs-utils.js";

export type TransactionResultRecord = RejectionResult | ComplianceResult | Record<string, unknown>;

export class ResultsNotFoundError extends Error {
  constructor(transactionId: string) {
    super(
      `No result for ${transactionId}. Run \`npm run pipeline\` in homework-6 first.`,
    );
    this.name = "ResultsNotFoundError";
  }
}

export async function readTransactionResult(
  transactionId: string,
): Promise<TransactionResultRecord> {
  const root = getSharedRoot();
  const filePath = path.join(
    sharedDir(root, "results"),
    `${transactionId}.json`,
  );
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as TransactionResultRecord;
  } catch {
    throw new ResultsNotFoundError(transactionId);
  }
}

export async function listTransactionResults(): Promise<TransactionResultRecord[]> {
  const root = getSharedRoot();
  const resultsDir = sharedDir(root, "results");
  const all = await readJsonFiles<TransactionResultRecord>(resultsDir);
  return all.filter((r) => {
    const id = (r as { transaction_id?: string }).transaction_id;
    return id !== undefined;
  });
}

export async function readPipelineSummary(): Promise<PipelineSummary | null> {
  const root = getSharedRoot();
  const summaryPath = path.join(sharedDir(root, "results"), "pipeline-summary.json");
  try {
    const content = await readFile(summaryPath, "utf8");
    return JSON.parse(content) as PipelineSummary;
  } catch {
    return null;
  }
}

export function formatResultsSummary(
  results: TransactionResultRecord[],
  summary: PipelineSummary | null,
): string {
  const lines: string[] = [];

  if (summary) {
    lines.push("Pipeline summary:");
    lines.push(`  total: ${summary.total}`);
    lines.push(`  approved: ${summary.approved}`);
    lines.push(`  fraud_review: ${summary.fraud_review}`);
    lines.push(`  rejected: ${summary.rejected}`);
    lines.push(`  compliance_flagged: ${summary.compliance_flagged}`);
    lines.push("");
  }

  lines.push(`Transactions (${results.length}):`);
  for (const r of results) {
    const rec = r as {
      transaction_id?: string;
      final_status?: string;
      status?: string;
      compliance_status?: string;
      risk_score?: number;
      reason?: string | null;
    };
    const status = rec.final_status ?? rec.status ?? "unknown";
    const extra = [
      rec.compliance_status ? `compliance=${rec.compliance_status}` : null,
      rec.risk_score !== undefined ? `risk=${rec.risk_score}` : null,
      rec.reason ? `reason=${rec.reason}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    lines.push(`  ${rec.transaction_id}: ${status}${extra ? ` (${extra})` : ""}`);
  }

  return lines.join("\n");
}
