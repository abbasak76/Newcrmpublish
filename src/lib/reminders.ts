import type { AppState } from '../types';

/**
 * قواعد یادآوری وظایف (در همان خط‌لوله موجود useWorkflowEngine؛ بدون موتور موازی).
 * مراحل: D7 (۷ روز قبل) · D2 (۲ روز قبل) · D0 (روز سررسید) · OVERDUE (پس از سررسید) · ESCALATION (۱ روز پس از سررسید → مدیر مستقیم، فقط اگر قابل‌تعیین باشد).
 * ضدتکرار: کلید `taskId|stage|dueDate` در state.reminderLog؛ تغییر مهلت = کلید جدید (یادآوری‌های جدید)، تکمیل/لغو = بدون یادآوری.
 * ⚠ اجرا فقط تا زمانی است که برنامه باز است؛ Scheduler سمت سرور وجود ندارد (DEFERRED).
 */
export type ReminderStage = 'D7' | 'D2' | 'D0' | 'OVERDUE' | 'ESCALATION';
export interface ReminderEvent { key: string; stage: ReminderStage; taskId: string; recipientId?: string; title: string; message: string; type: 'INFO' | 'WARNING' | 'ERROR' }

export const localDateStr = (d: Date, timeZone?: string): string => {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
  catch { return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
};
/** اختلاف روز تقویمی (due - today)؛ مثبت = آینده */
export const dayDiff = (due: string, today: string): number => Math.round((Date.UTC(+due.slice(0, 4), +due.slice(5, 7) - 1, +due.slice(8, 10)) - Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10))) / 86400000);

export const slaFromDue = (due: string | undefined, today: string): 'ON_TRACK' | 'AT_RISK' | 'BREACHED' => {
  if (!due) return 'ON_TRACK'; const d = dayDiff(due, today);
  return d < 0 ? 'BREACHED' : d <= 1 ? 'AT_RISK' : 'ON_TRACK';
};

const isActiveUser = (u: any) => u && (u.isActive ?? u.active) !== false;
export function resolveEscalationTarget(state: AppState, assigneeId?: string): string | undefined {
  const u: any = (state.users || []).find(x => x.id === assigneeId);
  if (!u) return undefined;
  const candidates = [u.managerId, (state as any).branches?.find((b: any) => b.id === u.branchId)?.managerId];
  return candidates.find(id => id && id !== assigneeId && isActiveUser((state.users || []).find(x => x.id === id)));
}

export function computeTaskReminders(state: AppState, now: Date, timeZone?: string): ReminderEvent[] {
  const today = localDateStr(now, timeZone); const log = state.reminderLog || {}; const out: ReminderEvent[] = [];
  for (const t of state.tasks || []) {
    if (t.status === 'COMPLETED' || (t as any).status === 'CANCELLED' || (t as any).deletedAt || !t.dueDate) continue;
    const diff = dayDiff(t.dueDate, today); let stage: ReminderStage | null = null;
    if (diff === 7) stage = 'D7'; else if (diff === 2) stage = 'D2'; else if (diff === 0) stage = 'D0'; else if (diff < 0) stage = 'OVERDUE';
    const push = (s: ReminderStage, recipientId: string | undefined, title: string, message: string, type: ReminderEvent['type']) => {
      const key = `${t.id}|${s}|${t.dueDate}`; if (log[key] || out.some(e => e.key === key)) return;
      out.push({ key, stage: s, taskId: t.id, recipientId, title, message, type });
    };
    const assignee = t.assigneeType === 'GROUP' ? undefined : t.assigneeId;
    if (stage === 'D7') push('D7', assignee, 'یادآوری: ۷ روز تا سررسید', `وظیفه «${t.title}» ۷ روز دیگر سررسید می‌شود.`, 'INFO');
    if (stage === 'D2') push('D2', assignee, 'یادآوری: ۲ روز تا سررسید', `وظیفه «${t.title}» ۲ روز دیگر سررسید می‌شود.`, 'WARNING');
    if (stage === 'D0') push('D0', assignee, 'سررسید امروز', `مهلت وظیفه «${t.title}» امروز است.`, 'WARNING');
    if (stage === 'OVERDUE') push('OVERDUE', assignee, 'وظیفه معوق', `وظیفه «${t.title}» ${Math.abs(diff).toLocaleString('fa-IR')} روز از مهلت گذشته است.`, 'ERROR');
    if (diff <= -1) {
      const boss = resolveEscalationTarget(state, t.assigneeId);
      if (boss) push('ESCALATION', boss, 'ارجاع هشدار تأخیر (Escalation)', `وظیفه «${t.title}» بیش از یک روز معوق است و پیگیری مسئول لازم است.`, 'ERROR');
    }
  }
  return out;
}
