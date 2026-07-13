import { isManagerTokenValid } from "./auth.js";
import { calculateLeaveDays } from "./leave-days.js";
import { formatReasonAsHtml } from "./reason-html.js";
import type { LeaveRequest, LeaveSubmissionResult } from "./types.js";
import { validateLeaveRequest } from "./validators.js";

let nextId = 1;

export function submitLeaveRequest(
  request: LeaveRequest,
): { ok: true; result: LeaveSubmissionResult } | { ok: false; errors: string[] } {
  const validation = validateLeaveRequest(request);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }

  if (!isManagerTokenValid(request.managerToken)) {
    return { ok: false, errors: ["Invalid manager approval token."] };
  }

  const days = calculateLeaveDays(request.startDate, request.endDate);

  const result: LeaveSubmissionResult = {
    id: `LR-${String(nextId++).padStart(4, "0")}`,
    employeeName: request.employeeName.trim(),
    leaveType: request.leaveType,
    startDate: request.startDate,
    endDate: request.endDate,
    days,
    reasonHtml: formatReasonAsHtml(request.reason.trim()),
    submittedAt: new Date().toISOString(),
  };

  return { ok: true, result };
}

/** Reset counter for tests. */
export function resetSubmissionCounter(): void {
  nextId = 1;
}
