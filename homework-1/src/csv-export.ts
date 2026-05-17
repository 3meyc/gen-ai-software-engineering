import type { Transaction } from "./types.js";

const CSV_COLUMNS = [
  "id",
  "fromAccount",
  "toAccount",
  "amount",
  "currency",
  "type",
  "timestamp",
  "status",
] as const satisfies readonly (keyof Transaction)[];

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function cellString(tx: Transaction, col: (typeof CSV_COLUMNS)[number]): string {
  const v = tx[col];
  if (typeof v === "number") return String(v);
  return String(v);
}

function rowToCsv(tx: Transaction): string {
  return CSV_COLUMNS.map((col) => escapeCsvCell(cellString(tx, col))).join(",");
}

/** UTF-8 CSV: header row + one row per transaction; columns match JSON field names. */
export function transactionsToCsv(transactions: Transaction[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = transactions.map(rowToCsv);
  return [header, ...rows].join("\n");
}
