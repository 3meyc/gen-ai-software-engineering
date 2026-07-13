export type TransactionType = "transfer" | "wire_transfer" | "refund";

export type TransactionMetadata = {
  channel?: string;
  country?: string;
};

export type RawTransaction = {
  transaction_id: string;
  timestamp: string;
  source_account: string;
  destination_account: string;
  amount: string;
  currency: string;
  transaction_type: TransactionType | string;
  description: string;
  metadata?: TransactionMetadata;
};

export type PipelineStage =
  | "orchestrator"
  | "validator"
  | "fraud_detector"
  | "compliance";

export type TransactionStatus =
  | "validated"
  | "approved"
  | "fraud_review"
  | "rejected";

export type ComplianceStatus = "flagged" | "cleared";

export type PipelineEnvelopeData = RawTransaction & {
  status?: TransactionStatus;
  risk_score?: number;
  fraud_signals?: string[];
  compliance_status?: ComplianceStatus;
};

export type PipelineEnvelope = {
  message_id: string;
  timestamp: string;
  source_stage: PipelineStage | string;
  target_stage: PipelineStage | string;
  message_type: "transaction";
  data: PipelineEnvelopeData;
};

export type ValidationResult =
  | { ok: true; envelope: PipelineEnvelope }
  | { ok: false; rejection: RejectionResult };

export type RejectionResult = {
  transaction_id: string;
  status: "rejected";
  final_status: "rejected";
  reason: string;
  stage: "validator";
};

export type FraudResult = {
  envelope: PipelineEnvelope;
  risk_score: number;
  fraud_signals: string[];
  status: "approved" | "fraud_review";
};

export type ComplianceResult = {
  transaction_id: string;
  final_status: "approved" | "fraud_review" | "rejected";
  compliance_status: ComplianceStatus;
  risk_score: number;
  fraud_signals: string[];
  reason: string | null;
  amount: string;
  currency: string;
  transaction_type: string;
  timestamp: string;
};

export type FinalResult = RejectionResult | ComplianceResult;

export type PipelineSummary = {
  total: number;
  approved: number;
  fraud_review: number;
  rejected: number;
  compliance_flagged: number;
  generated_at: string;
};
