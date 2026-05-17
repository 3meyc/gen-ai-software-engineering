import type { Transaction, TransactionStatus, TransactionType } from "./types.js";

export type SummaryCell = { count: number; amount: number };

export type SummaryMatrix = Record<TransactionType, Record<TransactionStatus, SummaryCell>>;

export type AccountSummary = {
  summary: SummaryMatrix;
  mostRecentTransactionDate: string | null;
};

export function emptySummaryMatrix(): SummaryMatrix {
  const emptyCell = () => ({ count: 0, amount: 0 });
  return {
    deposit: { pending: emptyCell(), completed: emptyCell(), failed: emptyCell() },
    withdrawal: { pending: emptyCell(), completed: emptyCell(), failed: emptyCell() },
    transfer: { pending: emptyCell(), completed: emptyCell(), failed: emptyCell() },
  };
}

/** Counts and total amounts by `type` × `status` for rows where `accountId` matches `fromAccount` or `toAccount`. */
export function summaryMatrixForAccount(accountId: string, transactions: Transaction[]): AccountSummary {
  const matrix = emptySummaryMatrix();
  let latestDate: string | null = null;

  for (const tx of transactions) {
    if (tx.fromAccount !== accountId && tx.toAccount !== accountId) continue;

    const cell = matrix[tx.type][tx.status];
    cell.count += 1;
    cell.amount = Number((cell.amount + tx.amount).toFixed(2));

    if (!latestDate || tx.timestamp > latestDate) {
      latestDate = tx.timestamp;
    }
  }

  return {
    summary: matrix,
    mostRecentTransactionDate: latestDate,
  };
}

