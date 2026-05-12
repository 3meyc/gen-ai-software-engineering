import { randomBytes } from "node:crypto";
import { code as iso4217Code } from "currency-codes";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "./types.js";

const ACCOUNT_RE = /^ACC-[A-Za-z0-9]+$/;

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

function hasAtMostTwoDecimalPlaces(amount: number): boolean {
  const cents = amount * 100;
  if (!Number.isFinite(cents)) return false;
  return Math.abs(cents - Math.round(cents)) < 1e-9;
}

function isValidIso4217(code: string): boolean {
  return Boolean(iso4217Code(code));
}

export type ValidationDetail = { field: string; message: string };

export type ParseCreateBodyResult =
  | { ok: true; transaction: Omit<Transaction, "id" | "timestamp"> }
  | { ok: false; error: string; details: ValidationDetail[] };

/**
 * Validates POST body and builds a row without id/timestamp (server assigns those).
 * `status` is taken from the client; `id` and `timestamp` in the body are ignored.
 */
export function parseCreateTransactionBody(body: CreateTransactionInput): ParseCreateBodyResult {
  const details: ValidationDetail[] = [];

  const type = parseType(body.type);
  if (!type) {
    details.push({
      field: "type",
      message: 'Must be one of: deposit, withdrawal, transfer',
    });
  }

  const status = parseStatus(body.status);
  if (!status) {
    details.push({
      field: "status",
      message: 'Must be one of: pending, completed, failed',
    });
  }

  let amount = 0;
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount)) {
    details.push({ field: "amount", message: "Amount must be a finite number" });
  } else if (body.amount <= 0) {
    details.push({ field: "amount", message: "Amount must be a positive number" });
  } else if (!hasAtMostTwoDecimalPlaces(body.amount)) {
    details.push({
      field: "amount",
      message: "Amount must have at most 2 decimal places",
    });
  } else {
    amount = body.amount;
  }

  let currency = "";
  if (!isNonEmptyString(body.currency)) {
    details.push({ field: "currency", message: "Currency is required" });
  } else {
    currency = body.currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      details.push({ field: "currency", message: "Invalid currency code" });
    } else if (!isValidIso4217(currency)) {
      details.push({ field: "currency", message: "Invalid currency code" });
    }
  }

  let fromAccount = "";
  if (!isNonEmptyString(body.fromAccount)) {
    details.push({
      field: "fromAccount",
      message:
        "Account must be non-empty and match ACC- followed by one or more alphanumeric characters",
    });
  } else {
    fromAccount = body.fromAccount.trim();
    if (!ACCOUNT_RE.test(fromAccount)) {
      details.push({
        field: "fromAccount",
        message:
          "Invalid account format (expected ACC- followed by one or more alphanumeric characters)",
      });
    }
  }

  let toAccount = "";
  if (!isNonEmptyString(body.toAccount)) {
    details.push({
      field: "toAccount",
      message:
        "Account must be non-empty and match ACC- followed by one or more alphanumeric characters",
    });
  } else {
    toAccount = body.toAccount.trim();
    if (!ACCOUNT_RE.test(toAccount)) {
      details.push({
        field: "toAccount",
        message:
          "Invalid account format (expected ACC- followed by one or more alphanumeric characters)",
      });
    }
  }

  if (details.length > 0) {
    return { ok: false, error: "Validation failed", details };
  }

  return {
    ok: true,
    transaction: {
      fromAccount,
      toAccount,
      amount,
      currency,
      type: type!,
      status: status!,
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
