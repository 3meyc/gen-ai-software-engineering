export type TransactionType = "deposit" | "withdrawal" | "transfer";

export type TransactionStatus = "pending" | "completed" | "failed";

export type Transaction = {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  type: TransactionType;
  timestamp: string;
  status: TransactionStatus;
};

export type CreateTransactionInput = {
  fromAccount?: unknown;
  toAccount?: unknown;
  amount?: unknown;
  currency?: unknown;
  type?: unknown;
  status?: unknown;
};
