import {
  DEVICE_TYPES,
  METADATA_SOURCES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type DeviceType,
  type MetadataSource,
  type Ticket,
  type TicketCategory,
  type TicketMetadata,
  type TicketPriority,
  type TicketStatus,
} from "./types.js";

export type ValidationDetail = { field: string; message: string };

export type ParseResult =
  | { ok: true; fields: TicketFields }
  | { ok: false; error: string; details: ValidationDetail[] };

export type TicketFields = {
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  resolved_at: string | null;
  assigned_to: string | null;
  tags: string[];
  metadata: TicketMetadata;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function parseCategory(v: unknown): TicketCategory | null {
  return (TICKET_CATEGORIES as readonly string[]).includes(v as string)
    ? (v as TicketCategory)
    : null;
}

function parsePriority(v: unknown): TicketPriority | null {
  return (TICKET_PRIORITIES as readonly string[]).includes(v as string)
    ? (v as TicketPriority)
    : null;
}

function parseStatus(v: unknown): TicketStatus | null {
  return (TICKET_STATUSES as readonly string[]).includes(v as string)
    ? (v as TicketStatus)
    : null;
}

function parseIsoDatetime(v: unknown): string | null | undefined {
  if (v === null) return null;
  if (v === undefined) return undefined;
  if (typeof v !== "string" || v.trim().length === 0) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function parseTags(v: unknown): string[] | undefined {
  if (v === undefined) return undefined;
  if (Array.isArray(v)) {
    if (!v.every((t) => typeof t === "string")) return undefined;
    return v.map((t) => t.trim()).filter((t) => t.length > 0);
  }
  if (typeof v === "string") {
    return v
      .split(/[;,]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
  return undefined;
}

function parseMetadata(v: unknown): TicketMetadata | undefined {
  if (v === undefined) return undefined;
  if (v === null || typeof v !== "object" || Array.isArray(v)) return undefined;
  const raw = v as Record<string, unknown>;
  const meta: TicketMetadata = {};
  if (raw.source !== undefined) {
    if (!(METADATA_SOURCES as readonly string[]).includes(raw.source as string)) {
      return undefined;
    }
    meta.source = raw.source as MetadataSource;
  }
  if (raw.browser !== undefined) {
    if (typeof raw.browser !== "string") return undefined;
    meta.browser = raw.browser;
  }
  if (raw.device_type !== undefined) {
    if (!(DEVICE_TYPES as readonly string[]).includes(raw.device_type as string)) {
      return undefined;
    }
    meta.device_type = raw.device_type as DeviceType;
  }
  return meta;
}

function validateDescription(value: string | undefined, details: ValidationDetail[], field = "description") {
  if (value === undefined || value === "") return;
  if (value.length < 10 || value.length > 2000) {
    details.push({ field, message: "Must be 10-2000 characters when provided" });
  }
}

function validateSubject(value: string | undefined, details: ValidationDetail[], required: boolean) {
  if (value === undefined) {
    if (required) details.push({ field: "subject", message: "Required" });
    return;
  }
  if (value.length < 1 || value.length > 200) {
    details.push({ field: "subject", message: "Must be 1-200 characters" });
  }
}

function validateEmail(value: string | undefined, details: ValidationDetail[], required: boolean) {
  if (value === undefined) {
    if (required) details.push({ field: "customer_email", message: "Required" });
    return;
  }
  if (!EMAIL_RE.test(value)) {
    details.push({ field: "customer_email", message: "Invalid email format" });
  }
}

/** Full validation for create / import rows. */
export function parseTicketRecord(
  body: Record<string, unknown>,
  opts: { partial: false },
): ParseResult;
/** Partial validation for PUT — only keys present in body are checked. */
export function parseTicketRecord(
  body: Record<string, unknown>,
  opts: { partial: true; existing: Ticket },
): ParseResult;
export function parseTicketRecord(
  body: Record<string, unknown>,
  opts: { partial: boolean; existing?: Ticket },
): ParseResult {
  const details: ValidationDetail[] = [];
  const partial = opts.partial;
  const existing = partial && "existing" in opts ? opts.existing : undefined;

  const get = <T>(key: keyof TicketFields, fallback: T): T | undefined => {
    if (key in body) return body[key as string] as T;
    if (partial) return fallback;
    return undefined;
  };

  const customer_idRaw = get("customer_id", existing?.customer_id ?? "");
  const customer_emailRaw = get("customer_email", existing?.customer_email ?? "");
  const customer_nameRaw = get("customer_name", existing?.customer_name ?? "");
  const subjectRaw = get("subject", existing?.subject ?? "");
  const descriptionRaw = get("description", existing?.description ?? "");
  const categoryRaw = get("category", existing?.category);
  const priorityRaw = get("priority", existing?.priority);
  const statusRaw = get("status", existing?.status);
  const resolvedAtRaw = partial
    ? "resolved_at" in body
      ? body.resolved_at
      : existing?.resolved_at
    : body.resolved_at;
  const assignedToRaw = partial
    ? "assigned_to" in body
      ? body.assigned_to
      : existing?.assigned_to
    : body.assigned_to;
  const tagsRaw = partial ? ("tags" in body ? body.tags : existing?.tags) : body.tags;
  const metadataRaw = partial
    ? "metadata" in body
      ? body.metadata
      : existing?.metadata
    : body.metadata;

  const customer_id =
    customer_idRaw !== undefined && isNonEmptyString(customer_idRaw)
      ? customer_idRaw.trim()
      : undefined;
  if (!partial && !customer_id) {
    details.push({ field: "customer_id", message: "Required non-empty string" });
  } else if (partial && "customer_id" in body && !customer_id) {
    details.push({ field: "customer_id", message: "Must be a non-empty string" });
  }

  const customer_email =
    customer_emailRaw !== undefined && typeof customer_emailRaw === "string"
      ? customer_emailRaw.trim()
      : undefined;
  validateEmail(customer_email, details, !partial);

  const customer_name =
    customer_nameRaw !== undefined && isNonEmptyString(customer_nameRaw)
      ? customer_nameRaw.trim()
      : undefined;
  if (!partial && !customer_name) {
    details.push({ field: "customer_name", message: "Required non-empty string" });
  } else if (partial && "customer_name" in body && !customer_name) {
    details.push({ field: "customer_name", message: "Must be a non-empty string" });
  }

  const subject =
    subjectRaw !== undefined && typeof subjectRaw === "string" ? subjectRaw.trim() : undefined;
  validateSubject(subject, details, !partial);

  let description = "";
  if (descriptionRaw !== undefined) {
    if (typeof descriptionRaw !== "string") {
      details.push({ field: "description", message: "Must be a string" });
    } else {
      description = descriptionRaw;
      validateDescription(description, details);
    }
  } else if (!partial) {
    description = "";
  } else if (existing) {
    description = existing.description;
  }

  const category = categoryRaw !== undefined ? parseCategory(categoryRaw) : partial ? existing?.category : null;
  if (!partial && !category) {
    details.push({
      field: "category",
      message: `Must be one of: ${TICKET_CATEGORIES.join(", ")}`,
    });
  } else if (partial && "category" in body && !category) {
    details.push({
      field: "category",
      message: `Must be one of: ${TICKET_CATEGORIES.join(", ")}`,
    });
  }

  const priority = priorityRaw !== undefined ? parsePriority(priorityRaw) : partial ? existing?.priority : null;
  if (!partial && !priority) {
    details.push({
      field: "priority",
      message: `Must be one of: ${TICKET_PRIORITIES.join(", ")}`,
    });
  } else if (partial && "priority" in body && !priority) {
    details.push({
      field: "priority",
      message: `Must be one of: ${TICKET_PRIORITIES.join(", ")}`,
    });
  }

  const status = statusRaw !== undefined ? parseStatus(statusRaw) : partial ? existing?.status : null;
  if (!partial && !status) {
    details.push({
      field: "status",
      message: `Must be one of: ${TICKET_STATUSES.join(", ")}`,
    });
  } else if (partial && "status" in body && !status) {
    details.push({
      field: "status",
      message: `Must be one of: ${TICKET_STATUSES.join(", ")}`,
    });
  }

  let resolved_at: string | null = existing?.resolved_at ?? null;
  if (resolvedAtRaw !== undefined) {
    const parsed = parseIsoDatetime(resolvedAtRaw);
    if (parsed === undefined && resolvedAtRaw !== null) {
      details.push({ field: "resolved_at", message: "Must be a valid ISO datetime or null" });
    } else if (parsed !== undefined) {
      resolved_at = parsed;
    }
  }

  let assigned_to: string | null = existing?.assigned_to ?? null;
  if (assignedToRaw !== undefined) {
    if (assignedToRaw === null) {
      assigned_to = null;
    } else if (typeof assignedToRaw === "string" && assignedToRaw.trim().length > 0) {
      assigned_to = assignedToRaw.trim();
    } else if (assignedToRaw !== null) {
      details.push({ field: "assigned_to", message: "Must be a non-empty string or null" });
    }
  }

  let tags: string[] = existing?.tags ?? [];
  if (tagsRaw !== undefined) {
    const parsed = parseTags(tagsRaw);
    if (parsed === undefined) {
      details.push({ field: "tags", message: "Must be an array of strings or comma-separated string" });
    } else {
      tags = parsed;
    }
  }

  let metadata: TicketMetadata = existing?.metadata ?? {};
  if (metadataRaw !== undefined) {
    const parsed = parseMetadata(metadataRaw);
    if (parsed === undefined) {
      details.push({ field: "metadata", message: "Invalid metadata object or enum values" });
    } else {
      metadata = partial ? { ...existing?.metadata, ...parsed } : parsed;
    }
  }

  if (details.length > 0) {
    return { ok: false, error: "Validation failed", details };
  }

  return {
    ok: true,
    fields: {
      customer_id: customer_id ?? existing!.customer_id,
      customer_email: customer_email ?? existing!.customer_email,
      customer_name: customer_name ?? existing!.customer_name,
      subject: subject ?? existing!.subject,
      description: partial && !("description" in body) ? existing!.description : description,
      category: category ?? existing!.category,
      priority: priority ?? existing!.priority,
      status: status ?? existing!.status,
      resolved_at,
      assigned_to,
      tags,
      metadata,
    },
  };
}
