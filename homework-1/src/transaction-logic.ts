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

const UTC_DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Inclusive whole calendar day bounds in UTC; returns null if invalid. */
function utcCalendarDayBounds(day: string): { startMs: number; endMs: number } | null {
  const m = UTC_DAY_RE.exec(day);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const startMs = Date.UTC(y, mo - 1, d, 0, 0, 0, 0);
  const probe = new Date(startMs);
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== mo - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  const endMs = Date.UTC(y, mo - 1, d, 23, 59, 59, 999);
  return { startMs, endMs };
}

export type ListTransactionsQueryResult =
  | { ok: true; filtered: Transaction[] }
  | { ok: false; error: string; details: ValidationDetail[] };

/**
 * Applies GET /transactions query filters with AND semantics.
 * `from` / `to` are whole UTC calendar days, inclusive, compared to each row's `timestamp`.
 */
export function filterTransactionsForListQuery(
  transactions: Transaction[],
  searchParams: URLSearchParams,
): ListTransactionsQueryResult {
  const details: ValidationDetail[] = [];

  const accountIdRaw = searchParams.get("accountId");
  const accountId =
    accountIdRaw !== null && accountIdRaw.trim() !== "" ? accountIdRaw.trim() : undefined;

  const typeRaw = searchParams.get("type");
  const typeFilter = typeRaw !== null && typeRaw.trim() !== "" ? typeRaw.trim() : undefined;
  if (typeFilter !== undefined) {
    if (!parseType(typeFilter)) {
      details.push({
        field: "type",
        message: "Must be one of: deposit, withdrawal, transfer",
      });
    }
  }

  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const fromDay =
    fromRaw !== null && fromRaw.trim() !== "" ? fromRaw.trim() : undefined;
  const toDay = toRaw !== null && toRaw.trim() !== "" ? toRaw.trim() : undefined;

  let fromStartMs: number | undefined;
  if (fromDay !== undefined) {
    const b = utcCalendarDayBounds(fromDay);
    if (!b) {
      details.push({
        field: "from",
        message: "Must be a valid UTC calendar date (YYYY-MM-DD)",
      });
    } else {
      fromStartMs = b.startMs;
    }
  }

  let toEndMs: number | undefined;
  if (toDay !== undefined) {
    const b = utcCalendarDayBounds(toDay);
    if (!b) {
      details.push({
        field: "to",
        message: "Must be a valid UTC calendar date (YYYY-MM-DD)",
      });
    } else {
      toEndMs = b.endMs;
    }
  }

  if (details.length > 0) {
    return { ok: false, error: "Validation failed", details };
  }

  const typeParsed = typeFilter !== undefined ? parseType(typeFilter)! : undefined;

  const filtered = transactions.filter((tx) => {
    if (accountId !== undefined) {
      if (tx.fromAccount !== accountId && tx.toAccount !== accountId) return false;
    }
    if (typeParsed !== undefined && tx.type !== typeParsed) return false;

    const txMs = Date.parse(tx.timestamp);
    if (fromStartMs !== undefined || toEndMs !== undefined) {
      if (Number.isNaN(txMs)) return false;
      if (fromStartMs !== undefined && txMs < fromStartMs) return false;
      if (toEndMs !== undefined && txMs > toEndMs) return false;
    }
    return true;
  });

  return { ok: true, filtered };
}
