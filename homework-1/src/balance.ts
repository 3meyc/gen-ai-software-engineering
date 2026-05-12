import type { Transaction } from "./types.js";

/**
 * Completed transactions only. Per-currency balances for one account.
 */
export function balancesForAccount(
  accountId: string,
  transactions: Transaction[],
): Record<string, number> {
  const balances: Record<string, number> = {};

  const add = (currency: string, delta: number) => {
    balances[currency] = (balances[currency] ?? 0) + delta;
  };

  for (const t of transactions) {
    if (t.status !== "completed") continue;

    switch (t.type) {
      case "deposit":
        if (t.toAccount === accountId) add(t.currency, t.amount);
        break;
      case "withdrawal":
        if (t.fromAccount === accountId) add(t.currency, -t.amount);
        break;
      case "transfer":
        if (t.fromAccount === accountId) add(t.currency, -t.amount);
        if (t.toAccount === accountId) add(t.currency, t.amount);
        break;
    }
  }

  return balances;
}
