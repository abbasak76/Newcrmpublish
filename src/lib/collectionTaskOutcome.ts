import type { Payment, Task } from '../types';

export const COLLECTION_OUTCOME_OPTIONS = [
  { value: 'PAYMENT_RECORDED', label: 'وصول ثبت‌شده در پرداخت‌ها' },
  { value: 'PROMISE_TO_PAY', label: 'تعهد به پرداخت' },
  { value: 'NO_PAYMENT', label: 'عدم وصول' },
  { value: 'CUSTOMER_UNAVAILABLE', label: 'مشتری در دسترس نبود' },
  { value: 'DISPUTED', label: 'اختلاف / اعتراض مالی' },
  { value: 'VISIT_COMPLETED', label: 'مراجعه انجام شد؛ نتیجه غیرمالی' },
  { value: 'NO_SHOW', label: 'عدم حضور / مراجعه ناموفق' },
] as const;
export type CollectionOutcomeCode = typeof COLLECTION_OUTCOME_OPTIONS[number]['value'];

export interface CollectionOutcomeInput {
  outcome: string;
  paymentId?: string;
  failureReason?: string;
  followUpDate?: string;
  note?: string;
}
export interface CollectionOutcomeValidation {
  valid: boolean;
  error?: string;
  payment?: Payment;
  collectedAmount?: number;
}

const reasonRequired = new Set(['NO_PAYMENT', 'CUSTOMER_UNAVAILABLE', 'DISPUTED', 'NO_SHOW']);

/** A reported collection amount can only be derived from a cleared payment belonging to this task's customer. */
export function validateCollectionTaskOutcome(
  task: Task,
  input: CollectionOutcomeInput,
  payments: Payment[] = [],
): CollectionOutcomeValidation {
  if (task.taskType !== 'COLLECTION' || task.source !== 'GEO_ZONE') return { valid: false, error: 'این گردش فقط برای وظیفهٔ وصول ایجادشده از زون معتبر است.' };
  if (!COLLECTION_OUTCOME_OPTIONS.some(option => option.value === input.outcome)) return { valid: false, error: 'نتیجهٔ انتخاب‌شده معتبر نیست.' };
  if (reasonRequired.has(input.outcome) && !input.failureReason?.trim()) return { valid: false, error: 'برای نتیجهٔ ناموفق، علت ثبت الزامی است.' };
  if (input.outcome === 'PROMISE_TO_PAY' && !input.followUpDate) return { valid: false, error: 'برای تعهد به پرداخت، تاریخ پیگیری بعدی الزامی است.' };
  if (input.outcome === 'PAYMENT_RECORDED') {
    if (!input.paymentId) return { valid: false, error: 'برای ثبت وصول، یک پرداخت معتبر انتخاب کنید.' };
    const payment = payments.find(item => item.id === input.paymentId);
    const customerId = String(task.customerId || task.accountId || '');
    if (!payment || String(payment.customerId || payment.accountId || '') !== customerId || payment.status !== 'CLEARED' || !Number.isFinite(payment.amount) || payment.amount <= 0) {
      return { valid: false, error: 'پرداخت باید متعلق به همین مشتری، نهایی‌شده (CLEARED) و دارای مبلغ مثبت باشد.' };
    }
    return { valid: true, payment, collectedAmount: payment.amount };
  }
  if (input.paymentId) return { valid: false, error: 'فقط نتیجهٔ «وصول ثبت‌شده» می‌تواند به رکورد پرداخت متصل شود.' };
  return { valid: true };
}
