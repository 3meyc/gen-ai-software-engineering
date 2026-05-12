import { randomBytes } from "node:crypto";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "./types.js";

function newTransactionId(): string {
  return `txn_${randomBytes(8).toString("hex")}`;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function parseType(v: unknown): TransactionType | null {
  if (v === "deposit" || v === "withdrawal" || v === "transfer") return v;
  return null;
}

function parseStatus(v: unknown): TransactionStatus | null {
  if (v === "pending" || v === "completed" || v === "failed") return v;
  return null;
}

function parseAmount(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  return v;
}

export type ParseCreateBodyResult =
  | { ok: true; transaction: Omit<Transaction, "id" | "timestamp"> }
  | { ok: false; error: string };

/**
 * Validates POST body and builds a row without id/timestamp (server assigns those).
 * `status` is taken from the client; `id` and `timestamp` in the body are ignored.
 */
export function parseCreateTransactionBody(
  body: CreateTransactionInput,
): ParseCreateBodyResult {
  const type = parseType(body.type);
  if (!type) {
    return { ok: false, error: 'Invalid or missing "type" (deposit | withdrawal | transfer)' };
  }

  const status = parseStatus(body.status);
  if (!status) {
    return { ok: false, error: 'Invalid or missing "status" (pending | completed | failed)' };
  }

  const amount = parseAmount(body.amount);
  if (amount === null) {
    return { ok: false, error: '"amount" must be a positive finite number' };
  }

  if (!isNonEmptyString(body.currency)) {
    return { ok: false, error: 'Missing or invalid "currency"' };
  }

  const currency = body.currency.trim();

  let fromAccount = "";
  let toAccount = "";

  if (type === "deposit") {
    if (!isNonEmptyString(body.toAccount)) {
      return { ok: false, error: 'Deposit requires non-empty "toAccount"' };
    }
    toAccount = body.toAccount.trim();
  } else if (type === "withdrawal") {
    if (!isNonEmptyString(body.fromAccount)) {
      return { ok: false, error: 'Withdrawal requires non-empty "fromAccount"' };
    }
    fromAccount = body.fromAccount.trim();
  } else {
    if (!isNonEmptyString(body.fromAccount) || !isNonEmptyString(body.toAccount)) {
      return {
        ok: false,
        error: 'Transfer requires non-empty "fromAccount" and "toAccount"',
      };
    }
    fromAccount = body.fromAccount.trim();
    toAccount = body.toAccount.trim();
  }

  return {
    ok: true,
    transaction: {
      fromAccount,
      toAccount,
      amount,
      currency,
      type,
      status,
    },
  };
}

/** Attaches server-generated `id` and `timestamp`. */
export function finalizeTransaction(partial: Omit<Transaction, "id" | "timestamp">): Transaction {
  return {
    ...partial,
    id: newTransactionId(),
    timestamp: new Date().toISOString(),
  };
}
