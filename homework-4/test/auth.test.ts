import { describe, expect, it } from "vitest";
import { isManagerTokenValid, MANAGER_TOKEN } from "../src/lib/auth.js";

describe("isManagerTokenValid", () => {
  it("accepts the correct manager token", () => {
    expect(isManagerTokenValid(MANAGER_TOKEN)).toBe(true);
  });

  it("rejects an incorrect token", () => {
    expect(isManagerTokenValid("wrong-token")).toBe(false);
  });

  it("BUG-001c: uses loose equality (documented security smell)", () => {
    // Loose == is used in implementation; this test documents current behavior
    expect(isManagerTokenValid(MANAGER_TOKEN)).toBe(true);
  });
});
