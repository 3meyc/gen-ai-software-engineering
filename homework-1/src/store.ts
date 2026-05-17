import type { Transaction } from "./types.js";

export type TransactionStore = {
  add(transaction: Transaction): void;
  list(): Transaction[];
  get(id: string): Transaction | undefined;
};

export function createStore(): TransactionStore {
  const byId = new Map<string, Transaction>();
  const order: string[] = [];

  return {
    add(transaction) {
      byId.set(transaction.id, transaction);
      order.push(transaction.id);
    },
    list() {
      return order.map((id) => byId.get(id)!).filter(Boolean);
    },
    get(id) {
      return byId.get(id);
    },
  };
}
