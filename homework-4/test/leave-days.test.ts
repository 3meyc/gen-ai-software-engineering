import { describe, expect, it } from "vitest";
import { calculateLeaveDays } from "../src/lib/leave-days.js";

describe("calculateLeaveDays", () => {
  it("returns 0 for same start and end date (current exclusive logic)", () => {
    // BUG-001a: inclusive range should be 1 day
    expect(calculateLeaveDays("2026-07-01", "2026-07-01")).toBe(0);
  });

  it("returns 2 for a three-calendar-day inclusive range (current bug)", () => {
    // BUG-001a: Jul 1–3 inclusive = 3 days; buggy impl returns 2
    expect(calculateLeaveDays("2026-07-01", "2026-07-03")).toBe(2);
  });

  it("returns 0 when end is before start", () => {
    expect(calculateLeaveDays("2026-07-10", "2026-07-01")).toBe(0);
  });
});
