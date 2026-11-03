import { LEGACY_DEFAULT_CREDIT_LIMIT, getDefaultCreditLimit } from '../lib/orgPolicy.ts';
/**
 * AKHAVAN CRM - Smart Collection & Receivables Engine
 * موتور هوشمند پیگیری وصول مطالبات، رتبه‌بندی ریسک و تولید خودکار وظایف پیگیری
 */

import { AppState, Invoice, Account, Task, Cheque } from '../types.ts';
import { generateId } from '../lib/utils.ts';
import { calculateDaysOverdue } from './collectionDateUtils.ts';
export { calculateDaysOverdue } from './collectionDateUtils.ts';

export type AgingBucket = 'CURRENT' | 'OVERDUE_1_15' | 'OVERDUE_16_30' | 'OVERDUE_31_60' | 'OVERDUE_CRITICAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface OverdueInvoiceInfo {
  invoice: Invoice;
  daysOverdue: number;
  bucket: AgingBucket;
  remainingAmount: number;
}

export interface CustomerCollectionProfile {
  accountId: string;
  accountName: string;
  phone?: string;
  creditLimit: number;
  totalBalance: number;
  overdueBalance: number;
  maxDaysOverdue: number;
  riskScore: number; // 0 (بی‌خطر) تا 100 (بحرانی‌ترین)
  riskLevel: RiskLevel;
  bouncedChequesCount: number;
  overdueInvoices: OverdueInvoiceInfo[];
  activePromises: CollectionPromiseRecord[];
  recommendedAction: string;
}

export interface CollectionPromiseRecord {
  id: string;
  accountId: string;
  accountName: string;
  invoiceId?: string;
  promisedAmount: number;
  promisedDate: string; // ISO date
  paymentMethod: string;
  sayadChequeNumber?: string;
  contactPerson: string;
  notes?: string;
  status: 'PENDING' | 'FULFILLED' | 'BROKEN';
  createdAt: string;
  createdById?: string;
}

export interface CollectionDashboardSummary {
  totalOverdueAmount: number;
  criticalOverdueAmount: number; // بالای ۶۰ روز
  highRiskAccountsCount: number;
  totalUnpaidInvoicesCount: number;
  todayPromisesCount: number;
  agingBuckets: {
    current: number;
    days1to15: number;
    days16to30: number;
    days31to60: number;
    days60plus: number;
  };
}

/**
 * محاسبه روزهای سپری شده از سررسید فاکتور
 */

/**
 * تعیین بازه سنی بدهی (Aging Bucket)
 */
export function getAgingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return 'CURRENT';
  if (daysOverdue <= 15) return 'OVERDUE_1_15';
  if (daysOverdue <= 30) return 'OVERDUE_16_30';
  if (daysOverdue <= 60) return 'OVERDUE_31_60';
  return 'OVERDUE_CRITICAL';
}

/**
 * محاسبه امتیاز ریسک مشتری (Risk Scoring) بین ۰ تا ۱۰۰
 */
export function calculateCustomerRiskScore(
  account: Account,
  overdueBalance: number,
  maxDaysOverdue: number,
  bouncedChequesCount: number,
  fallbackCreditLimit: number = LEGACY_DEFAULT_CREDIT_LIMIT
): { score: number; level: RiskLevel } {
  let score = 0;

  // ۱. فاکتور روزهای تأخیر (حداکثر ۴۰ امتیاز)
  if (maxDaysOverdue > 60) {
    score += 40;
  } else if (maxDaysOverdue > 30) {
    score += 25;
  } else if (maxDaysOverdue > 15) {
    score += 15;
  } else if (maxDaysOverdue > 0) {
    score += 5;
  }

  // ۲. نسبت بدهی به سقف اعتبار (حداکثر ۳۰ امتیاز)
  const creditLimit = account.creditLimit || fallbackCreditLimit;
  const ratio = overdueBalance / creditLimit;
  if (ratio >= 1.0) {
    score += 30;
  } else if (ratio >= 0.7) {
    score += 20;
  } else if (ratio >= 0.4) {
    score += 10;
  }

  // ۳. چک‌های برگشتی (هر چک برگشتی ۱۵ امتیاز، حداکثر ۳۰ امتیاز)
  score += Math.min(30, bouncedChequesCount * 15);

  score = Math.min(100, Math.max(0, score));

  let level: RiskLevel = 'LOW';
  if (score >= 70) level = 'CRITICAL';
  else if (score >= 45) level = 'HIGH';
  else if (score >= 20) level = 'MEDIUM';

  return { score, level };
}

/**
 * استخراج و تحلیل پروفایل مطالبات تمام مشتریان سازمان
 */
export function evaluateAllCustomerCollections(
  state: AppState,
  referenceDate: Date = new Date()
): { profiles: CustomerCollectionProfile[]; summary: CollectionDashboardSummary } {
  const accounts = state.accounts || [];
  const invoices = state.invoices || [];
  const cheques = state.cheques || [];
  const promises: CollectionPromiseRecord[] = (state as any).collectionPromises || [];

  const profiles: CustomerCollectionProfile[] = [];

  const summary: CollectionDashboardSummary = {
    totalOverdueAmount: 0,
    criticalOverdueAmount: 0,
    highRiskAccountsCount: 0,
    totalUnpaidInvoicesCount: 0,
    todayPromisesCount: 0,
    agingBuckets: {
      current: 0,
      days1to15: 0,
      days16to30: 0,
      days31to60: 0,
      days60plus: 0
    }
  };

  const todayStr = referenceDate.toISOString().split('T')[0];

  accounts.forEach(acc => {
    // استخراج فاکتورهای پرداخت‌نشده این مشتری
    const customerInvoices = invoices.filter(
      inv => (inv.accountId === acc.id || inv.customerId === acc.id) && inv.status !== 'PAID'
    );

    const overdueList: OverdueInvoiceInfo[] = [];
    let overdueBalance = 0;
    let maxDaysOverdue = 0;

    customerInvoices.forEach(inv => {
      const remaining = inv.balance !== undefined ? inv.balance : (inv.totalAmount - (inv.paidAmount || 0));
      if (remaining <= 0) return;

      summary.totalUnpaidInvoicesCount++;
      const days = calculateDaysOverdue(inv.dueDate, referenceDate);
      const bucket = getAgingBucket(days);

      if (days > 0) {
        overdueBalance += remaining;
        if (days > maxDaysOverdue) maxDaysOverdue = days;

        overdueList.push({
          invoice: inv,
          daysOverdue: days,
          bucket,
          remainingAmount: remaining
        });

        // افزودن به باکت‌های داشبورد
        if (days <= 15) summary.agingBuckets.days1to15 += remaining;
        else if (days <= 30) summary.agingBuckets.days16to30 += remaining;
        else if (days <= 60) summary.agingBuckets.days31to60 += remaining;
        else {
          summary.agingBuckets.days60plus += remaining;
          summary.criticalOverdueAmount += remaining;
        }
      } else {
        summary.agingBuckets.current += remaining;
      }
    });

    if (overdueBalance > 0) {
      summary.totalOverdueAmount += overdueBalance;
    }

    // استخراج چک‌های برگشتی مشتری
    const bouncedCheques = cheques.filter(
      ch => (ch as any).accountId === acc.id && (ch.status === 'BOUNCED' || (ch as any).status === 'RETURNED')
    );

    // محاسبه ریسک
    const { score, level } = calculateCustomerRiskScore(
      acc, 
      overdueBalance, 
      maxDaysOverdue, 
      bouncedCheques.length,
      getDefaultCreditLimit(state)
    );

    if (level === 'HIGH' || level === 'CRITICAL') {
      summary.highRiskAccountsCount++;
    }

    // استخراج وعده‌های فعال مشتری
    const customerPromises = promises.filter(p => p.accountId === acc.id && p.status === 'PENDING');
    customerPromises.forEach(p => {
      if (p.promisedDate && p.promisedDate.startsWith(todayStr)) {
        summary.todayPromisesCount++;
      }
    });

    // تعیین اقدام پیشنهادی سیستم بر پایه سطح ریسک
    let recommendedAction = 'وضعیت مالی عادی و پیگیری ملایم';
    if (level === 'CRITICAL') {
      recommendedAction = 'قفل فوری صدور پیش‌فاکتور جدید + تماس تلفنی مدیر مالی + اقدام حقوقی بر روی چک';
    } else if (level === 'HIGH') {
      recommendedAction = 'توقف فروش اعتباری + دریافت وعده واریز با سررسید حداکثر ۴۸ ساعته';
    } else if (level === 'MEDIUM') {
      recommendedAction = 'ارسال پیامک یادآوری محترمانه سررسید + هماهنگی با ویزیتور منطقه';
    }

    profiles.push({
      accountId: acc.id,
      accountName: acc.name,
      phone: acc.phone,
      creditLimit: acc.creditLimit || getDefaultCreditLimit(state),
      totalBalance: acc.balance || overdueBalance,
      overdueBalance,
      maxDaysOverdue,
      riskScore: score,
      riskLevel: level,
      bouncedChequesCount: bouncedCheques.length,
      overdueInvoices: overdueList,
      activePromises: customerPromises,
      recommendedAction
    });
  });

  // مرتب‌سازی بر اساس بالاترین میزان ریسک و بیشترین مبلغ معوق
  profiles.sort((a, b) => b.riskScore - a.riskScore || b.overdueBalance - a.overdueBalance);

  return { profiles, summary };
}

/**
 * ایجاد خودکار وظیفه (Task) پیگیری وصول در کارتابل تسک‌ها و تقویم شمسی
 */
export function generateCollectionTaskForAccount(
  account: Account,
  profile: CustomerCollectionProfile,
  assignedUserId: string,
  targetDueDate: string,
  negotiationNote?: string
): Task {
  const isCritical = profile.riskLevel === 'CRITICAL';
  
  return {
    id: generateId(),
    accountId: account.id,
    customerId: account.id,
    title: `پیگیری وصول مطالبات معوق: ${account.name}`,
    description: `مشتری دارای ${profile.overdueBalance.toLocaleString('fa-IR')} ریال بدهی معوق (${profile.maxDaysOverdue} روز تأخیر) و سطح ریسک ${profile.riskLevel} است. ${negotiationNote ? 'یادداشت: ' + negotiationNote : 'اقدام الزامی: تماس با مدیریت جهت وصول و اخذ تعهد واریز.'}`,
    dueDate: targetDueDate,
    priority: isCritical ? 'URGENT' : 'HIGH',
    status: 'PENDING',
    type: 'CALL',
    ownerId: assignedUserId,
    createdAt: new Date().toISOString()
  };
}
