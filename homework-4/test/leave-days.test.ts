import { describe, expect, it } from "vitest";
import { calculateLeaveDays } from "../src/lib/leave-days.js";

describe("calculateLeaveDays", () => {
  it("returns 1 for same start and end date (inclusive range)", () => {
    expect(calculateLeaveDays("2026-07-01", "2026-07-01")).toBe(1);
  });

  it("returns 3 for a three-calendar-day inclusive range", () => {
    expect(calculateLeaveDays("2026-07-01", "2026-07-03")).toBe(3);
  });

  it("returns 0 when end is before start", () => {
    expect(calculateLeaveDays("2026-07-10", "2026-07-01")).toBe(0);
  });
});
