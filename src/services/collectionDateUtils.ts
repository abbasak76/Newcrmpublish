/** Deterministic calendar-day helpers for receivables aging. */
export function calculateDaysOverdue(dueDateStr?: string, referenceDate: Date = new Date()): number {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr).getTime();
  const now = referenceDate.getTime();
  if (!Number.isFinite(due) || !Number.isFinite(now)) return 0;
  const dueDay = new Date(due).toISOString().slice(0, 10);
  const nowDay = new Date(now).toISOString().slice(0, 10);
  const dueMidnight = Date.parse(`${dueDay}T00:00:00.000Z`);
  const nowMidnight = Date.parse(`${nowDay}T00:00:00.000Z`);
  return Math.max(0, Math.floor((nowMidnight - dueMidnight) / 86400000));
}
