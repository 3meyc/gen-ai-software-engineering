import Decimal from "decimal.js";

export const VALID_CURRENCIES = ["USD", "EUR", "GBP", "JPY"] as const;

export type ValidCurrency = (typeof VALID_CURRENCIES)[number];

export const USD_RATES: Record<ValidCurrency, string> = {
  USD: "1.00",
  EUR: "1.08",
  GBP: "1.27",
  JPY: "0.0067",
};

export const FRAUD_THRESHOLD = 50;
export const HIGH_VALUE_USD = new Decimal("10000");

export const REQUIRED_FIELDS = [
  "transaction_id",
  "timestamp",
  "source_account",
  "destination_account",
  "amount",
  "currency",
  "transaction_type",
  "description",
] as const;

export const FRAUD_SCORES = {
  highValue: 40,
  crossBorder: 25,
  unusualTiming: 20,
  wireTransfer: 15,
} as const;

export const UNUSUAL_HOUR_START = 2;
export const UNUSUAL_HOUR_END = 5;
