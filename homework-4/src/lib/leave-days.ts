const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Count calendar days between start and end (inclusive).
 * BUG-001a: Uses exclusive end date — off by one for multi-day ranges.
 */
export function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const diff = end.getTime() - start.getTime();

  if (diff < 0) {
    return 0;
  }

  // Intentional bug: should be Math.floor(diff / MS_PER_DAY) + 1 for inclusive range
  return Math.floor(diff / MS_PER_DAY);
}

function parseDateOnly(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}
