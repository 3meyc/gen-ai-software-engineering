import { randomUUID } from "node:crypto";
import type { Ticket } from "./types.js";
import type { TicketFields } from "./validation.js";

export function finalizeTicket(fields: TicketFields): Ticket {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    ...fields,
    created_at: now,
    updated_at: now,
    classification_confidence: null,
    classification_reasoning: null,
    classification_keywords: [],
  };
}

export function applyPartialUpdate(existing: Ticket, fields: TicketFields): Ticket {
  return {
    ...existing,
    ...fields,
    id: existing.id,
    created_at: existing.created_at,
    updated_at: new Date().toISOString(),
  };
}

export type ListFilterResult =
  | { ok: true; tickets: Ticket[] }
  | { ok: false; error: string; details: { field: string; message: string }[] };

export function filterTickets(tickets: Ticket[], params: URLSearchParams): ListFilterResult {
  const details: { field: string; message: string }[] = [];

  const customer_id = params.get("customer_id")?.trim();
  const customer_email = params.get("customer_email")?.trim();
  const customer_name = params.get("customer_name")?.trim();
  const category = params.get("category")?.trim();
  const priority = params.get("priority")?.trim();
  const status = params.get("status")?.trim();
  const assigned_to = params.get("assigned_to");
  const tagsParam = params.get("tags")?.trim();

  if (category && !(category.length > 0)) {
    details.push({ field: "category", message: "Invalid value" });
  }
  if (priority && !(priority.length > 0)) {
    details.push({ field: "priority", message: "Invalid value" });
  }
  if (status && !(status.length > 0)) {
    details.push({ field: "status", message: "Invalid value" });
  }

  if (details.length > 0) {
    return { ok: false, error: "Validation failed", details };
  }

  const requiredTags = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  const filtered = tickets.filter((t) => {
    if (customer_id && t.customer_id !== customer_id) return false;
    if (customer_email && t.customer_email !== customer_email) return false;
    if (customer_name && t.customer_name !== customer_name) return false;
    if (category && t.category !== category) return false;
    if (priority && t.priority !== priority) return false;
    if (status && t.status !== status) return false;
    if (assigned_to !== null && assigned_to !== undefined) {
      if (t.assigned_to !== assigned_to) return false;
    }
    if (requiredTags.length > 0) {
      if (!requiredTags.every((tag) => t.tags.includes(tag))) return false;
    }
    return true;
  });

  return { ok: true, tickets: filtered };
}
