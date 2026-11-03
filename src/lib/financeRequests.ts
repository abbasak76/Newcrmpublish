import type { AppState } from '../types';

/**
 * دستور پرداخت و مجوز واریز (درخواست به حسابدار). CRM فقط «درخواست و تصمیم» را ثبت می‌کند؛
 * صدور چک پرداختی، سند و اجرای پرداخت در ERP انجام می‌شود (erpStatus تا اتصال واقعی NOT_CONFIGURED).
 */
export type FinanceRequestKind = 'PAYMENT_ORDER' | 'DEPOSIT_AUTHORIZATION';
export type FinanceRequestStatus = 'SUBMITTED' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'ERP_PENDING' | 'CANCELLED';
export const FINANCE_KIND_LABEL: Record<FinanceRequestKind, string> = { PAYMENT_ORDER: 'دستور پرداخت', DEPOSIT_AUTHORIZATION: 'مجوز واریز' };
export const FINANCE_STATUS_LABEL: Record<FinanceRequestStatus, string> = { SUBMITTED: 'در انتظار حسابدار', NEEDS_INFO: 'نیازمند اطلاعات', APPROVED: 'تایید شد', REJECTED: 'رد شد', ERP_PENDING: 'تایید شد؛ در انتظار اجرا در ERP', CANCELLED: 'لغو شد' };

export interface FinanceRequestInput { kind: FinanceRequestKind; payeeName?: string; amount: number; reason?: string; dueDate?: string; accountId?: string; requestedBy?: string }
const norm = (s?: string) => (s || '').trim().toLowerCase();
const ACTIVE: FinanceRequestStatus[] = ['SUBMITTED', 'NEEDS_INFO', 'APPROVED', 'ERP_PENDING'];
export const requestKey = (i: FinanceRequestInput) => `${i.kind}|${norm(i.payeeName)}|${Math.round(Number(i.amount) || 0)}|${i.dueDate || ''}`;
const list = (s: any): any[] => (s.financeRequests || []);

export function checkFinanceRequest(state: Pick<AppState, 'accounts'> & { financeRequests?: any[] }, i: FinanceRequestInput): { ok: boolean; errors: string[] } {
  const errors: string[] = []; const amount = Number(i.amount);
  if (!['PAYMENT_ORDER', 'DEPOSIT_AUTHORIZATION'].includes(i.kind)) errors.push('نوع درخواست نامعتبر است.');
  if (!norm(i.payeeName)) errors.push('نام ذی‌نفع/دریافت‌کننده الزامی است.');
  if (!Number.isFinite(amount) || amount <= 0) errors.push('مبلغ باید بزرگ‌تر از صفر باشد.');
  if (!norm(i.reason)) errors.push('شرح/علت درخواست الزامی است.');
  if (i.accountId && !(state.accounts || []).some(a => a.id === i.accountId)) errors.push('مشتری مرتبط معتبر نیست.');
  const key = requestKey(i);
  if (list(state).some(r => !r.deletedAt && ACTIVE.includes(r.status) && r.idempotencyKey === key)) errors.push('درخواست مشابه فعالی با همین ذی‌نفع، مبلغ و مهلت وجود دارد.');
  return { ok: errors.length === 0, errors };
}

export function buildFinanceRequest(i: FinanceRequestInput, id: string, now: Date): any {
  return { id, kind: i.kind, payeeName: i.payeeName!.trim(), amount: Math.round(Number(i.amount)), reason: i.reason!.trim(), dueDate: i.dueDate, accountId: i.accountId,
    status: 'SUBMITTED' as FinanceRequestStatus, requestedBy: i.requestedBy, requestedAt: now.toISOString(), erpStatus: 'NOT_CONFIGURED', idempotencyKey: requestKey(i) };
}

/** تصمیم حسابدار. رد/نیازمند اطلاعات = یادداشت الزامی؛ درخواست‌کننده نمی‌تواند درخواست خودش را تایید کند (تفکیک وظایف). */
export function decideFinanceRequest(draft: any, id: string, decision: 'APPROVE' | 'REJECT' | 'NEEDS_INFO', note: string, actorId: string | undefined, now: Date): { ok: boolean; reason?: string } {
  const r = list(draft).find(x => x.id === id);
  if (!r || r.deletedAt) return { ok: false, reason: 'درخواست یافت نشد.' };
  if (!['SUBMITTED', 'NEEDS_INFO'].includes(r.status)) return { ok: false, reason: 'این درخواست قبلاً تصمیم‌گیری شده است.' };
  if (!actorId) return { ok: false, reason: 'کاربر نامعلوم.' };
  if (r.requestedBy === actorId) return { ok: false, reason: 'تایید/رد درخواست خود مجاز نیست.' };
  if (decision !== 'APPROVE' && !norm(note)) return { ok: false, reason: 'یادداشت تصمیم الزامی است.' };
  r.status = decision === 'APPROVE' ? 'ERP_PENDING' : decision === 'REJECT' ? 'REJECTED' : 'NEEDS_INFO';
  r.decidedBy = actorId; r.decidedAt = now.toISOString(); r.decisionNote = note.trim() || undefined; r.erpStatus = 'NOT_CONFIGURED';
  return { ok: true };
}

/** اصلاح و ارسال مجدد توسط خود درخواست‌کننده پس از «نیازمند اطلاعات» */
export function resubmitFinanceRequest(draft: any, id: string, patch: Partial<FinanceRequestInput>, actorId: string | undefined, now: Date): { ok: boolean; reason?: string } {
  const r = list(draft).find(x => x.id === id);
  if (!r || r.status !== 'NEEDS_INFO') return { ok: false, reason: 'فقط درخواست «نیازمند اطلاعات» قابل ارسال مجدد است.' };
  if (r.requestedBy !== actorId) return { ok: false, reason: 'فقط ثبت‌کننده می‌تواند اصلاح کند.' };
  Object.assign(r, { payeeName: patch.payeeName ?? r.payeeName, amount: patch.amount ? Math.round(Number(patch.amount)) : r.amount, reason: patch.reason ?? r.reason, dueDate: patch.dueDate ?? r.dueDate });
  r.idempotencyKey = requestKey({ kind: r.kind, payeeName: r.payeeName, amount: r.amount, dueDate: r.dueDate }); r.status = 'SUBMITTED'; r.resubmittedAt = now.toISOString(); return { ok: true };
}
