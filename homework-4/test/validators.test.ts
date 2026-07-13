import { describe, expect, it } from "vitest";
import { validateLeaveRequest } from "../src/lib/validators.js";
import type { LeaveRequest } from "../src/lib/types.js";

const validRequest: LeaveRequest = {
  employeeName: "Alex Smith",
  leaveType: "vacation",
  startDate: "2026-08-01",
  endDate: "2026-08-05",
  reason: "Family trip",
  managerToken: "mgr-approve-2026",
};

describe("validateLeaveRequest", () => {
  it("accepts a complete valid request", () => {
    const result = validateLeaveRequest(validRequest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing employee name", () => {
    const result = validateLeaveRequest({ ...validRequest, employeeName: "  " });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Employee name is required.");
  });

  it("BUG-001b: accepts end date before start date (validation gap)", () => {
    const result = validateLeaveRequest({
      ...validRequest,
      startDate: "2026-08-10",
      endDate: "2026-08-01",
    });
    expect(result.valid).toBe(true);
  });
});
