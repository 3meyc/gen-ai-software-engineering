import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  isHighValue,
  isValidCurrency,
  parseAmount,
  toUsdEquivalent,
} from "../src/pipeline/money.js";

describe("money", () => {
  describe("parseAmount", () => {
    it("parses valid decimal strings", () => {
      expect(parseAmount("1500.00")?.toString()).toBe("1500");
      expect(parseAmount("  9999.99  ")?.toString()).toBe("9999.99");
    });

    it("returns null for invalid amounts", () => {
      expect(parseAmount("not-a-number")).toBeNull();
      expect(parseAmount("")).toBeNull();
      expect(parseAmount("Infinity")).toBeNull();
    });
  });

  describe("isValidCurrency", () => {
    it("accepts ISO whitelist currencies", () => {
      expect(isValidCurrency("USD")).toBe(true);
      expect(isValidCurrency("EUR")).toBe(true);
      expect(isValidCurrency("GBP")).toBe(true);
      expect(isValidCurrency("JPY")).toBe(true);
    });

    it("rejects unknown codes", () => {
      expect(isValidCurrency("XYZ")).toBe(false);
      expect(isValidCurrency("")).toBe(false);
    });
  });

  describe("toUsdEquivalent", () => {
    it("converts EUR and GBP using demo rates", () => {
      const eur = toUsdEquivalent(new Decimal("500"), "EUR");
      expect(eur?.toString()).toBe("540");

      const gbp = toUsdEquivalent(new Decimal("100"), "GBP");
      expect(gbp?.toString()).toBe("127");
    });

    it("returns null for invalid currency", () => {
      expect(toUsdEquivalent(new Decimal("100"), "XYZ")).toBeNull();
    });
  });

  describe("isHighValue", () => {
    it("flags amounts at or above $10k USD equivalent", () => {
      expect(isHighValue(new Decimal("10000"), "USD")).toBe(true);
      expect(isHighValue(new Decimal("25000"), "USD")).toBe(true);
      expect(isHighValue(new Decimal("9999.99"), "USD")).toBe(false);
    });

    it("uses FX rates for non-USD currencies", () => {
      const justUnder = new Decimal("9259.25");
      expect(isHighValue(justUnder, "EUR")).toBe(false);

      const atThreshold = new Decimal("9259.26");
      expect(isHighValue(atThreshold, "EUR")).toBe(true);
    });
  });
});
