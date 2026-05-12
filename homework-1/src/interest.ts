import { balancesForAccount } from "./balance.js";
import type { Transaction } from "./types.js";

/** `interest[currency] = balance * rate * (days / 365)` using the same completed-only balance as `/balance`. */
export function simpleInterestByCurrency(
  accountId: string,
  transactions: Transaction[],
  rate: number,
  days: number,
): Record<string, number> {
  const balances = balancesForAccount(accountId, transactions);
  const interest: Record<string, number> = {};
  for (const [currency, balance] of Object.entries(balances)) {
    interest[currency] = balance * rate * (days / 365);
  }
  return interest;
}
