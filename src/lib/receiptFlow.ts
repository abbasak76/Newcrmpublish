import type { AppState } from '../types';

/**
 * مسیر رسید پرداخت: ثبت → بررسی حسابداری → تطبیق (ضدتکرار) → تعیین وضعیت → تخصیص (PaymentAllocation) → انتقال ERP.
 * - `status` (PENDING|CLEARED) معنای گزارش‌های موجود را حفظ می‌کند؛ CLEARED = تأیید حسابدار در CRM (نه ثبت ERP).
 * - `receiptStatus` وضعیت گردش‌کار است؛ `erpStatus` تا اتصال واقعی ERP همیشه NOT_CONFIGURED می‌ماند (انتقال ساختگی ممنوع).
 * - منبع حقیقت تخصیص: PaymentAllocation. مانده فاکتور فقط توسط تخصیص کاهش می‌یابد؛ هرگز بیش از مانده یا دوباره برای همان پرداخت.
 */
export type ReceiptStatus = 'RECEIVED' | 'PENDING_REVIEW' | 'NEEDS_FIX' | 'PENDING_ERP' | 'ERP_CONFIRMED' | 'MISMATCH';
export const RECEIPT_STATUS_LABEL: Record<ReceiptStatus, string> = {
  RECEIVED: 'رسید دریافت شد', PENDING_REVIEW: 'در انتظار بررسی', NEEDS_FIX: 'نیازمند اصلاح', PENDING_ERP: 'در انتظار ثبت ERP', ERP_CONFIRMED: 'در ERP تأیید شد', MISMATCH: 'مغایرت',
};

export interface ReceiptInput { accountId?: string; amount: number; method?: string; reference?: string; bankName?: string; date?: string; submittedBy?: string; requireEvidence?: boolean; hasEvidence?: boolean }
export interface ReceiptCheck { ok: boolean; errors: string[]; duplicateOf?: string; probableDuplicateOf?: string }

const norm = (s?: string) => (s || '').trim().toLowerCase();
export const receiptKey = (i: ReceiptInput) => `${i.accountId}|${Math.round(Number(i.amount) || 0)}|${norm(i.reference)}`;

/** اعتبارسنجی + تطبیق: مرجع یکسان = تکراری قطعی (رد)؛ همان حساب/مبلغ/روش در همان روز بدون مرجع = احتمالی (هشدار، رد نمی‌شود) */
export function checkReceipt(state: Pick<AppState, 'payments' | 'accounts'>, input: ReceiptInput): ReceiptCheck {
  const errors: string[] = []; const amount = Number(input.amount);
  if (!input.accountId || !(state.accounts || []).some(a => a.id === input.accountId)) errors.push('مشتری معتبر انتخاب نشده است.');
  if (!Number.isFinite(amount) || amount <= 0) errors.push('مبلغ باید عددی بزرگ‌تر از صفر باشد.');
  if (input.requireEvidence && !input.hasEvidence) errors.push('پیوست عکس یا رسید وصولی الزامی است.');
  const ref = norm(input.reference);
  let duplicateOf: string | undefined; let probableDuplicateOf: string | undefined;
  for (const p of (state.payments || []) as any[]) {
    if (p.deletedAt || p.receiptStatus === 'NEEDS_FIX') continue;
    if (ref && norm(p.reference) === ref && (p.accountId === input.accountId || p.customerId === input.accountId)) { duplicateOf = p.id; break; }
    if (!ref && !norm(p.reference) && p.accountId === input.accountId && Math.round(p.amount) === Math.round(amount) && p.method === input.method && String(p.date).slice(0, 10) === String(input.date || new Date().toISOString()).slice(0, 10)) probableDuplicateOf = p.id;
  }
  if (duplicateOf) errors.push('پرداخت دیگری با همین کد رهگیری برای این مشتری ثبت شده است (تکراری).');
  return { ok: errors.length === 0, errors, duplicateOf, probableDuplicateOf };
}

export function buildReceiptPayment(input: ReceiptInput, id: string, now: Date, probableDuplicateOf?: string): any {
  return {
    id, accountId: input.accountId, customerId: input.accountId, amount: Math.round(Number(input.amount)), date: input.date || now.toISOString(), method: input.method || 'TRANSFER',
    reference: input.reference?.trim() || undefined, bankName: input.bankName,
    status: 'PENDING', receiptStatus: (probableDuplicateOf ? 'MISMATCH' : 'PENDING_REVIEW') as ReceiptStatus, erpStatus: 'NOT_CONFIGURED',
    idempotencyKey: receiptKey(input), submittedBy: input.submittedBy, evidence: !!input.hasEvidence, submittedAt: now.toISOString(), probableDuplicateOf,
  };
}

export interface AllocResult { ok: boolean; reason?: string; allocated: number; remainder: number; allocations: { invoiceId: string; amount: number }[] }

/** تأیید حسابدار + تخصیص FIFO (قدیمی‌ترین سررسید اول). روی draft اجرا می‌شود؛ قابل‌اجرا دوباره نیست (Idempotent). */
export function approveAndAllocate(draft: AppState, paymentId: string, actorId: string | undefined, now: Date, newId: () => string): AllocResult {
  const fail = (reason: string): AllocResult => ({ ok: false, reason, allocated: 0, remainder: 0, allocations: [] });
  const p: any = (draft.payments || []).find(x => x.id === paymentId);
  if (!p) return fail('پرداخت یافت نشد.');
  if (p.deletedAt) return fail('پرداخت حذف شده است.');
  if ((draft.paymentAllocations || []).some(a => a.paymentId === paymentId) || p.receiptStatus === 'PENDING_ERP' || p.receiptStatus === 'ERP_CONFIRMED') return fail('این پرداخت قبلاً تخصیص یافته است.');
  if (!['PENDING_REVIEW', 'RECEIVED', 'MISMATCH'].includes(p.receiptStatus || 'PENDING_REVIEW')) return fail('وضعیت رسید اجازه تخصیص نمی‌دهد.');
  let remaining = Math.round(p.amount); const allocations: { invoiceId: string; amount: number }[] = [];
  const open = (draft.invoices || []).filter(i => (i.accountId === p.accountId || i.customerId === p.accountId) && i.balance > 0)
    .sort((a, b) => String(a.dueDate || a.date).localeCompare(String(b.dueDate || b.date)));
  if (!draft.paymentAllocations) draft.paymentAllocations = [];
  for (const inv of open) {
    if (remaining <= 0) break;
    const a = Math.min(remaining, Math.round(inv.balance)); if (a <= 0) continue;
    inv.paidAmount = (inv.paidAmount || 0) + a; inv.balance = Math.max(0, inv.balance - a); inv.status = inv.balance === 0 ? 'PAID' : 'PARTIAL';
    draft.paymentAllocations.push({ id: newId(), paymentId, invoiceId: inv.id, amount: a, createdAt: now.toISOString() });
    allocations.push({ invoiceId: inv.id, amount: a }); remaining -= a;
  }
  const allocated = Math.round(p.amount) - remaining;
  const acc = (draft.accounts || []).find(a => a.id === p.accountId); if (acc) acc.balance = (acc.balance || 0) - Math.round(p.amount);
  p.status = 'CLEARED'; p.receiptStatus = 'PENDING_ERP' as ReceiptStatus; p.erpStatus = 'NOT_CONFIGURED'; p.approvedBy = actorId; p.approvedAt = now.toISOString(); p.unallocatedAmount = remaining; p.needsFixReason = undefined;
  return { ok: true, allocated, remainder: remaining, allocations };
}

export function markNeedsFix(draft: AppState, paymentId: string, reason: string, actorId?: string, now: Date = new Date()): boolean {
  const p: any = (draft.payments || []).find(x => x.id === paymentId);
  if (!p || (draft.paymentAllocations || []).some(a => a.paymentId === paymentId) || !reason.trim()) return false;
  p.receiptStatus = 'NEEDS_FIX' as ReceiptStatus; p.needsFixReason = reason.trim(); p.status = 'PENDING'; p.reviewedBy = actorId; p.reviewedAt = now.toISOString(); return true;
}

/** انتقال به ERP فقط با Connector واقعی. تا آن زمان صریحاً NOT_CONFIGURED (دکمه موفقیت نمایشی ممنوع). */
export function transferToErp(): { status: 'NOT_CONFIGURED'; message: string } {
  return { status: 'NOT_CONFIGURED', message: 'اتصال ERP پیکربندی نشده است؛ رسید در وضعیت «در انتظار ثبت ERP» می‌ماند.' };
}
