import { describe, expect, it } from "vitest";
import { isManagerTokenValid, MANAGER_TOKEN } from "../src/lib/auth.js";

describe("isManagerTokenValid", () => {
  it("accepts the correct manager token", () => {
    expect(isManagerTokenValid(MANAGER_TOKEN)).toBe(true);
  });

  it("rejects an incorrect token", () => {
    expect(isManagerTokenValid("wrong-token")).toBe(false);
  });

  it("uses strict equality for token comparison", () => {
    const boxedToken = new String(MANAGER_TOKEN) as unknown as string;
    expect(isManagerTokenValid(boxedToken)).toBe(false);
  });

  it("rejects empty token", () => {
    expect(isManagerTokenValid("")).toBe(false);
  });
});
