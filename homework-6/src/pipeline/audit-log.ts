import type { PipelineStage } from "../types.js";

export type AuditEntry = {
  timestamp: string;
  stage: PipelineStage | string;
  transaction_id: string;
  outcome: string;
};

export function logAudit(
  stage: PipelineStage | string,
  transactionId: string,
  outcome: string,
): void {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    stage,
    transaction_id: transactionId,
    outcome,
  };
  console.log(JSON.stringify(entry));
}
