import Decimal from "decimal.js";
import {
  HIGH_VALUE_USD,
  USD_RATES,
  VALID_CURRENCIES,
  type ValidCurrency,
} from "./constants.js";

export function parseAmount(value: string): Decimal | null {
  try {
    const amount = new Decimal(value.trim());
    if (!amount.isFinite()) return null;
    return amount;
  } catch {
    return null;
  }
}

export function isValidCurrency(code: string): code is ValidCurrency {
  return (VALID_CURRENCIES as readonly string[]).includes(code);
}

export function toUsdEquivalent(amount: Decimal, currency: string): Decimal | null {
  if (!isValidCurrency(currency)) return null;
  const rate = new Decimal(USD_RATES[currency]);
  return amount.mul(rate);
}

export function isHighValue(amount: Decimal, currency: string): boolean {
  const usd = toUsdEquivalent(amount, currency);
  if (!usd) return false;
  return usd.gte(HIGH_VALUE_USD);
}
