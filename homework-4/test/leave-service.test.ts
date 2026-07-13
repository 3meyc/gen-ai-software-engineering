import { beforeEach, describe, expect, it } from "vitest";
import { resetSubmissionCounter, submitLeaveRequest } from "../src/lib/leave-service.js";

describe("submitLeaveRequest", () => {
  beforeEach(() => {
    resetSubmissionCounter();
  });

  it("submits a valid leave request", () => {
    const outcome = submitLeaveRequest({
      employeeName: "Jordan Lee",
      leaveType: "sick-leave",
      startDate: "2026-06-02",
      endDate: "2026-06-02",
      reason: "Medical appointment",
      managerToken: "mgr-approve-2026",
    });

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.id).toBe("LR-0001");
      expect(outcome.result.employeeName).toBe("Jordan Lee");
      expect(outcome.result.days).toBe(0);
    }
  });

  it("rejects invalid manager token", () => {
    const outcome = submitLeaveRequest({
      employeeName: "Jordan Lee",
      leaveType: "day-off",
      startDate: "2026-06-02",
      endDate: "2026-06-02",
      reason: "Personal",
      managerToken: "invalid",
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.errors).toContain("Invalid manager approval token.");
    }
  });
});
