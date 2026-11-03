import { appendTaskActivity, type TaskActivityAction } from './taskActivity.ts';

export type TaskWorkflowAction = 'START' | 'BLOCK' | 'UNBLOCK' | 'COMPLETE' | 'REOPEN' | 'RECORD_RESULT';
export interface TaskWorkflowInput {
  action: TaskWorkflowAction;
  actorId: string;
  reason?: string;
  result?: string;
  nextAction?: string;
  at?: string;
}
export interface TaskWorkflowResult<T> { ok: boolean; task: T; error?: string }

const transitions: Record<TaskWorkflowAction, { from: string[]; to?: string; event: TaskActivityAction; summary: string }> = {
  START: { from: ['OPEN', 'PENDING'], to: 'IN_PROGRESS', event: 'STARTED', summary: 'اجرای وظیفه آغاز شد' },
  BLOCK: { from: ['OPEN', 'PENDING', 'IN_PROGRESS'], to: 'BLOCKED', event: 'BLOCKED', summary: 'وظیفه متوقف و مانع ثبت شد' },
  UNBLOCK: { from: ['BLOCKED'], to: 'IN_PROGRESS', event: 'UNBLOCKED', summary: 'مانع رفع شد و وظیفه ادامه یافت' },
  COMPLETE: { from: ['OPEN', 'PENDING', 'IN_PROGRESS'], to: 'COMPLETED', event: 'COMPLETED', summary: 'نتیجه وظیفه ثبت و کار تکمیل شد' },
  REOPEN: { from: ['COMPLETED', 'CANCELLED', 'CANCELED'], to: 'OPEN', event: 'REOPENED', summary: 'وظیفه دوباره باز شد' },
  RECORD_RESULT: { from: ['OPEN', 'PENDING', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'], event: 'RESULT_RECORDED', summary: 'نتیجه و اقدام بعدی ثبت شد' }
};

/** Validates a workflow transition and appends its business event. Local history is not a server-authoritative audit. */
export function applyTaskWorkflow<T extends Record<string, any>>(task: T, input: TaskWorkflowInput): TaskWorkflowResult<T> {
  const rule = transitions[input.action];
  const current = String(task.status || 'OPEN').toUpperCase();
  if (!rule.from.includes(current)) return { ok: false, task, error: `این عملیات از وضعیت «${current}» مجاز نیست.` };
  if (input.action === 'BLOCK' && !input.reason?.trim()) return { ok: false, task, error: 'برای توقف وظیفه، شرح مانع الزامی است.' };
  if (input.action === 'COMPLETE' && !input.result?.trim()) return { ok: false, task, error: 'برای تکمیل وظیفه، نتیجه انجام کار الزامی است.' };
  if (input.action === 'RECORD_RESULT' && !input.result?.trim()) return { ok: false, task, error: 'نتیجه پیگیری را وارد کنید.' };
  const next: Record<string, any> = { ...task };
  if (rule.to) next.status = rule.to;
  if (input.action === 'BLOCK') { next.blockReason = input.reason!.trim(); next.blockedAt = input.at || new Date().toISOString(); }
  if (input.action === 'UNBLOCK') { next.blockReason = ''; next.unblockedAt = input.at || new Date().toISOString(); }
  if (input.result?.trim()) next.result = input.result.trim();
  if (input.nextAction?.trim()) next.nextAction = input.nextAction.trim();
  if (input.action === 'COMPLETE') next.completedAt = input.at || new Date().toISOString();
  const details = [input.reason?.trim() ? `مانع/دلیل: ${input.reason.trim()}` : '', input.result?.trim() ? `نتیجه: ${input.result.trim()}` : '', input.nextAction?.trim() ? `اقدام بعدی: ${input.nextAction.trim()}` : ''].filter(Boolean).join('؛ ');
  const updated = appendTaskActivity(next, { action: rule.event, actorId: input.actorId || 'UNKNOWN', at: input.at, summary: rule.summary, details: details || undefined });
  return { ok: true, task: updated };
}

export function getTaskExceptions<T extends Record<string, any>>(tasks: T[], now = new Date()): Array<{ task: T; reasons: string[] }> {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const closed = new Set(['COMPLETED', 'CANCELLED', 'CANCELED', 'VOID', 'DELETED']);
  return tasks
    .filter(task => !closed.has(String(task.status || '').toUpperCase()))
    .map(task => {
      const reasons: string[] = [];
      const status = String(task.status || 'OPEN').toUpperCase();
      const rawDue = task.slaDueAt || task.dueDate || task.targetDate || '';
      const assigned = Boolean(String(task.assigneeId || task.assignedTo || '').trim());
      const due = rawDue ? new Date(rawDue) : null;
      if (status === 'BLOCKED') reasons.push('متوقف');
      if (status === 'BLOCKED' && !String(task.blockReason || task.blockedReason || '').trim()) reasons.push('علت مانع ثبت نشده');
      if (!rawDue) reasons.push('بدون مهلت');
      else if (!due || Number.isNaN(due.getTime())) reasons.push('مهلت نامعتبر');
      else if (due.getTime() < today) reasons.push('مهلت گذشته');
      if (!assigned) reasons.push('بدون مسئول');
      if (['HIGH', 'URGENT'].includes(String(task.priority || '').toUpperCase()) && !rawDue) reasons.push('اولویت بالا بدون برنامه زمانی');
      return { task, reasons: [...new Set(reasons)] };
    })
    .filter(item => item.reasons.length > 0)
    .sort((a, b) => {
      const weight = (reasons: string[]) => (reasons.includes('متوقف') ? 100 : 0) + (reasons.includes('مهلت گذشته') ? 80 : 0) + (reasons.includes('بدون مسئول') ? 40 : 0) + reasons.length;
      return weight(b.reasons) - weight(a.reasons);
    });
}
