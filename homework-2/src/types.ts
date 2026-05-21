export const TICKET_CATEGORIES = [
  "account_access",
  "technical_issue",
  "billing_question",
  "feature_request",
  "bug_report",
  "other",
] as const;

export const TICKET_PRIORITIES = ["urgent", "high", "medium", "low"] as const;

export const TICKET_STATUSES = [
  "new",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
] as const;

export const METADATA_SOURCES = ["web_form", "email", "api", "chat", "phone"] as const;

export const DEVICE_TYPES = ["desktop", "mobile", "tablet"] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type MetadataSource = (typeof METADATA_SOURCES)[number];
export type DeviceType = (typeof DEVICE_TYPES)[number];

export type TicketMetadata = {
  source?: MetadataSource;
  browser?: string;
  device_type?: DeviceType;
};

export type Ticket = {
  id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
  tags: string[];
  metadata: TicketMetadata;
};

export type ImportFormat = "csv" | "json" | "xml";

export type ImportSummary = {
  total: number;
  successful: number;
  failed: number;
  errors: { row: number; message: string }[];
};

export type CreateTicketInput = Record<string, unknown>;
