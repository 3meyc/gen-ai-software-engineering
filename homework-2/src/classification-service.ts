import {
  applyClassificationToTicket,
  classifyTicket,
  clearClassificationMetadata,
} from "./classify.js";
import type { TicketStore } from "./store.js";
import type { ClassificationTrigger, Ticket } from "./types.js";
import type { ClassificationResult } from "./classify.js";

export function isAutoClassifyEnabled(
  queryValue: string | undefined,
  bodyFlag: unknown,
): boolean {
  if (queryValue === "true" || queryValue === "1") return true;
  if (bodyFlag === true || bodyFlag === "true") return true;
  return false;
}

export function runClassification(
  store: TicketStore,
  ticket: Ticket,
  trigger: ClassificationTrigger,
): Ticket {
  const result = classifyTicket(ticket);
  return persistClassification(store, ticket, result, trigger);
}

export function persistClassification(
  store: TicketStore,
  ticket: Ticket,
  result: ClassificationResult,
  trigger: ClassificationTrigger,
): Ticket {
  store.logClassification({
    ticket_id: ticket.id,
    timestamp: new Date().toISOString(),
    trigger,
    previous_category: ticket.category,
    previous_priority: ticket.priority,
    new_category: result.category,
    new_priority: result.priority,
    confidence: result.confidence,
    keywords_found: result.keywords_found,
    reasoning: result.reasoning,
  });

  return applyClassificationToTicket(ticket, result);
}

export function applyManualOverride(existing: Ticket, updated: Ticket, body: Record<string, unknown>): Ticket {
  if (!("category" in body) && !("priority" in body)) {
    return updated;
  }
  return clearClassificationMetadata(updated);
}
