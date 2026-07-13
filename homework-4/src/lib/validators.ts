import type { LeaveRequest } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * BUG-001b: Does not reject endDate before startDate.
 */
export function validateLeaveRequest(request: LeaveRequest): ValidationResult {
  const errors: string[] = [];

  if (!request.employeeName.trim()) {
    errors.push("Employee name is required.");
  }

  if (!request.startDate) {
    errors.push("Start date is required.");
  }

  if (!request.endDate) {
    errors.push("End date is required.");
  }

  if (!request.reason.trim()) {
    errors.push("Reason is required.");
  }

  if (!request.managerToken.trim()) {
    errors.push("Manager approval token is required.");
  }

  return { valid: errors.length === 0, errors };
}
