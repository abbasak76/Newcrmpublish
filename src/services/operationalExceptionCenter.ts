import type { AppState } from '../types.ts';
import { getTaskExceptions } from './taskWorkflow.ts';
import { activeRecords } from '../lib/recordLifecycle.ts';

export type OperationalExceptionKind = 'TASK' | 'OVERDUE_RECEIVABLE' | 'HIGH_COLLECTION_RISK' | 'BOUNCED_CHEQUE' | 'BROKEN_COLLECTION_PROMISE';
export type OperationalExceptionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface OperationalException {
  id: string;
  kind: OperationalExceptionKind;
  severity: OperationalExceptionSeverity;
  title: string;
  description: string;
  accountId?: string;
  taskId?: string;
  amount?: number;
  source: 'TASK_WORKFLOW' | 'COLLECTION_ENGINE';
  reasons: string[];
  recommendedAction: string;
}

/**
 * Aggregates existing task and collection domain engines into a single read-only work queue.
 * This does not post accounting data or replace the source engines. Amounts are only shown when
 * supplied by the existing collection engine; ERP provenance must be displayed separately by the UI.
 */
export function buildOperationalExceptionCenter(state: AppState, now = new Date(), collectionProfiles: Array<{ accountId: string; accountName: string; overdueBalance: number; maxDaysOverdue: number; overdueInvoices: unknown[]; riskLevel: string; riskScore: number; bouncedChequesCount: number; recommendedAction: string; activePromises: Array<{ id: string; promisedDate: string; promisedAmount: number; status: string }> }> = []): OperationalException[] {
  const output: OperationalException[] = [];
  const tasks = activeRecords(state.tasks || []).filter(task => !['COMPLETED', 'CANCELLED', 'CANCELED', 'VOID', 'DELETED'].includes(String(task.status || '').toUpperCase()));

  for (const item of getTaskExceptions(tasks, now)) {
    const task = item.task;
    const reasons = item.reasons;
    const critical = reasons.includes('متوقف') || reasons.includes('مهلت گذشته');
    output.push({
      id: `TASK:${String(task.id)}`,
      kind: 'TASK',
      severity: critical ? 'HIGH' : 'MEDIUM',
      title: String(task.title || 'وظیفه بدون عنوان'),
      description: reasons.join('؛ '),
      accountId: String(task.accountId || task.customerId || '') || undefined,
      taskId: String(task.id),
      source: 'TASK_WORKFLOW',
      reasons,
      recommendedAction: reasons.includes('متوقف') ? 'رفع مانع و تعیین مسئول اقدام بعدی' : reasons.includes('مهلت گذشته') ? 'بازبینی فوری مهلت و ثبت نتیجه پیگیری' : 'تکمیل مسئولیت و زمان‌بندی معتبر'
    });
  }

  // Defend the aggregation boundary against malformed/stale adapter rows.
  // The source collection engine remains authoritative; this layer only presents valid signals.
  const seenAccounts = new Set<string>();
  for (const profile of collectionProfiles) {
    const accountId = String(profile.accountId || '').trim();
    if (!accountId || seenAccounts.has(accountId)) continue;
    seenAccounts.add(accountId);
    const overdueBalance = Number(profile.overdueBalance);
    const maxDaysOverdue = Number(profile.maxDaysOverdue);
    const bouncedChequesCount = Number(profile.bouncedChequesCount);
    const riskScore = Number(profile.riskScore);
    const overdueInvoices = Array.isArray(profile.overdueInvoices) ? profile.overdueInvoices : [];
    const accountName = String(profile.accountName || accountId);
    if (Number.isFinite(overdueBalance) && overdueBalance > 0) {
      output.push({
        id: `RECEIVABLE:${accountId}`,
        kind: 'OVERDUE_RECEIVABLE',
        severity: Number.isFinite(maxDaysOverdue) && maxDaysOverdue > 60 ? 'CRITICAL' : Number.isFinite(maxDaysOverdue) && maxDaysOverdue > 15 ? 'HIGH' : 'MEDIUM',
        title: `مطالبه معوق — ${accountName}`,
        description: `${Number.isFinite(maxDaysOverdue) ? maxDaysOverdue : 'نامشخص'} روز بیشترین تأخیر؛ ${overdueInvoices.length} فاکتور معوق`,
        accountId,
        amount: overdueBalance,
        source: 'COLLECTION_ENGINE',
        reasons: [`بدهی معوق: ${overdueBalance}`, `حداکثر تأخیر: ${Number.isFinite(maxDaysOverdue) ? maxDaysOverdue : 'نامشخص'} روز`],
        recommendedAction: profile.recommendedAction
      });
    }
    if ((profile.riskLevel === 'HIGH' || profile.riskLevel === 'CRITICAL') && Number.isFinite(riskScore)) {
      output.push({
        id: `RISK:${accountId}`,
        kind: 'HIGH_COLLECTION_RISK',
        severity: profile.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        title: `ریسک وصول — ${accountName}`,
        description: `امتیاز ریسک ${riskScore} از ۱۰۰`,
        accountId,
        amount: Number.isFinite(overdueBalance) && overdueBalance > 0 ? overdueBalance : undefined,
        source: 'COLLECTION_ENGINE',
        reasons: [`سطح ریسک: ${profile.riskLevel}`, `امتیاز ریسک: ${riskScore}`],
        recommendedAction: profile.recommendedAction
      });
    }
    if (Number.isFinite(bouncedChequesCount) && bouncedChequesCount > 0) {
      output.push({
        id: `BOUNCED:${accountId}`,
        kind: 'BOUNCED_CHEQUE',
        severity: 'CRITICAL',
        title: `چک برگشتی — ${accountName}`,
        description: `${bouncedChequesCount} چک برگشتی/عودت‌شده`,
        accountId,
        source: 'COLLECTION_ENGINE',
        reasons: [`تعداد چک برگشتی: ${bouncedChequesCount}`],
        recommendedAction: 'تطبیق وضعیت با سند مرجع و ارجاع برای پیگیری مجاز مالی'
      });
    }
    for (const promise of (Array.isArray(profile.activePromises) ? profile.activePromises : [])) {
      const due = promise.promisedDate ? new Date(promise.promisedDate) : null;
      if ((promise.status === 'BROKEN' || (promise.status === 'PENDING' && due && !Number.isNaN(due.getTime()) && due.getTime() < now.getTime()))) {
        output.push({
          id: `PROMISE:${promise.id}`,
          kind: 'BROKEN_COLLECTION_PROMISE',
          severity: 'HIGH',
          title: `وعده پرداخت سررسیدگذشته — ${accountName}`,
          description: promise.status === 'BROKEN' ? `وعده پرداخت نقض‌شده؛ سررسید ثبت‌شده: ${promise.promisedDate || 'نامشخص'}` : `سررسید وعده: ${promise.promisedDate}`, 
          accountId,
          amount: Number.isFinite(Number(promise.promisedAmount)) && Number(promise.promisedAmount) > 0 ? Number(promise.promisedAmount) : undefined,
          source: 'COLLECTION_ENGINE',
          reasons: [promise.status === 'BROKEN' ? 'وعده پرداخت صراحتاً نقض‌شده ثبت شده است' : 'وعده پرداخت در وضعیت انتظار و پس از سررسید است'],
          recommendedAction: 'تماس پیگیری، ثبت نتیجه و تعیین موعد جدید با مستندات'
        });
      }
    }
  }

  const severityWeight: Record<OperationalExceptionSeverity, number> = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
  return output.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity] || (b.amount || 0) - (a.amount || 0) || a.title.localeCompare(b.title, 'fa'));
}
