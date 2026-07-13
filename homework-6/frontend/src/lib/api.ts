export type PipelineSummary = {
  total: number;
  approved: number;
  fraud_review: number;
  rejected: number;
  compliance_flagged: number;
  generated_at: string;
};

export type TransactionResult = {
  transaction_id: string;
  final_status?: string;
  status?: string;
  compliance_status?: string;
  risk_score?: number;
  reason?: string | null;
  amount?: string;
  currency?: string;
  stage?: string;
};

export async function runPipeline(): Promise<PipelineSummary> {
  const res = await fetch("/api/pipeline/run", { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Pipeline failed (${res.status})`);
  }
  return res.json() as Promise<PipelineSummary>;
}

export async function fetchResults(): Promise<TransactionResult[]> {
  const res = await fetch("/api/results");
  if (!res.ok) {
    throw new Error(`Failed to load results (${res.status})`);
  }
  return res.json() as Promise<TransactionResult[]>;
}

export async function fetchSummary(): Promise<PipelineSummary | null> {
  const res = await fetch("/api/summary");
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load summary (${res.status})`);
  }
  return res.json() as Promise<PipelineSummary>;
}
