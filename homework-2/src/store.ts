import type { ClassificationDecision, Ticket } from "./types.js";

export type TicketStore = {
  add(ticket: Ticket): void;
  list(): Ticket[];
  get(id: string): Ticket | undefined;
  update(id: string, ticket: Ticket): boolean;
  delete(id: string): boolean;
  logClassification(decision: ClassificationDecision): void;
  getClassificationLog(): ClassificationDecision[];
};

export function createStore(): TicketStore {
  const byId = new Map<string, Ticket>();
  const order: string[] = [];
  const classificationLog: ClassificationDecision[] = [];

  return {
    add(ticket) {
      byId.set(ticket.id, ticket);
      order.push(ticket.id);
    },
    list() {
      return order.map((id) => byId.get(id)!).filter(Boolean);
    },
    get(id) {
      return byId.get(id);
    },
    update(id, ticket) {
      if (!byId.has(id)) return false;
      byId.set(id, ticket);
      return true;
    },
    delete(id) {
      if (!byId.has(id)) return false;
      byId.delete(id);
      const idx = order.indexOf(id);
      if (idx >= 0) order.splice(idx, 1);
      return true;
    },
    logClassification(decision) {
      classificationLog.push(decision);
    },
    getClassificationLog() {
      return [...classificationLog];
    },
  };
}
