export type LeaveType = "day-off" | "vacation" | "sick-leave";

export interface LeaveRequest {
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  managerToken: string;
}

export interface LeaveSubmissionResult {
  id: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reasonHtml: string;
  submittedAt: string;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  "day-off": "Day off",
  vacation: "Vacation",
  "sick-leave": "Sick leave",
};
