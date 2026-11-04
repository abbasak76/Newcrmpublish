import type { Account, AppState, CustomerTask, Priority } from '../types.ts';

export function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
}

export function calculateDaysOverdue(dueDate?: string, referenceDate: Date = new Date()): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate).getTime();
  if (isNaN(due)) return 0;
  const ref = referenceDate.getTime();
  if (ref <= due) return 0;
  return Math.floor((ref - due) / 86400000);
}

export type ChurnRiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ChurnPredictionResult {
  accountId: string;
  accountName: string;
  churnScore: number; // 0 to 100
  riskTier: ChurnRiskTier;
  riskTierLabel: string;
  daysSinceLastOrder: number | null;
  daysSinceLastActivity: number | null;
  unpaidOverdueAmount: number;
  bouncedChequesCount: number;
  revenueDropPercent: number;
  reasons: string[];
  recommendations: string[];
  suggestedAction: {
    title: string;
    taskType: string;
    priority: 'HIGH' | 'CRITICAL' | 'NORMAL';
  };
}

export interface ChurnPortfolioSummary {
  totalAccounts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  averageChurnScore: number;
  atRiskAccounts: ChurnPredictionResult[];
}

const DAY_MS = 86400000;

export function predictAccountChurn(
  account: Account,
  state: AppState,
  referenceDate: Date = new Date()
): ChurnPredictionResult {
  const refMs = referenceDate.getTime();
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // ۱. فاکتورهای سفارش و خرید
  const accountQuotes = (state.quotes || []).filter(
    q => (q.accountId === account.id || q.customerId === account.id) &&
      (q.status === 'ACCEPTED' || q.status === 'APPROVED' || (q as any).status === 'INVOICED')
  );

  let daysSinceLastOrder: number | null = null;
  if (accountQuotes.length > 0) {
    const orderDates = accountQuotes
      .map(q => new Date(q.createdAt || q.issueDate || 0).getTime())
      .filter(t => !isNaN(t) && t > 0);
    if (orderDates.length > 0) {
      const latestOrderMs = Math.max(...orderDates);
      daysSinceLastOrder = Math.max(0, Math.floor((refMs - latestOrderMs) / DAY_MS));
    }
  }

  if (daysSinceLastOrder !== null) {
    if (daysSinceLastOrder >= 90) {
      score += 40;
      reasons.push(`بیش از ${daysSinceLastOrder.toLocaleString('fa-IR')} روز از آخرین سفارش می‌گذرد`);
      recommendations.push('برگزاری جلسه بررسی نارضایتی و ارائه بسته تخفیف بازگشت (Win-back Offer)');
    } else if (daysSinceLastOrder >= 60) {
      score += 25;
      reasons.push(`بیش از ۶۰ روز عدم ثبت سفارش جدید (${daysSinceLastOrder.toLocaleString('fa-IR')} روز)`);
      recommendations.push('تماس اختصاصی کارشناس فروش جهت استعلام نیازهای جدید کالا و پروژه‌ها');
    } else if (daysSinceLastOrder >= 35) {
      score += 15;
      reasons.push(`بیش از یک ماه از آخرین سفارش سپری شده است`);
    }
  } else {
    // حسابی که تا کنون هیچ سفارش تاییدشده‌ای نداشته
    const createdMs = account.createdAt ? new Date(account.createdAt).getTime() : 0;
    if (createdMs > 0 && (refMs - createdMs) > 45 * DAY_MS) {
      score += 30;
      reasons.push('حساب باسابقه بدون سابقه سفارش یا خرید موفق');
      recommendations.push('معرفی سبد کالایی جدید یا ارزیابی مجدد صلاحیت تجاری حساب');
    }
  }

  // ۲. افت حجم یا تکرار خرید (مقایسه ۶۰ روز اخیر با ۶۰ روز قبل‌تر)
  const recent60Ms = refMs - 60 * DAY_MS;
  const prev120Ms = refMs - 120 * DAY_MS;

  const recentRevenue = accountQuotes
    .filter(q => {
      const t = new Date(q.createdAt || 0).getTime();
      return t >= recent60Ms && t <= refMs;
    })
    .reduce((s, q) => s + (q.totalAmount || 0), 0);

  const prevRevenue = accountQuotes
    .filter(q => {
      const t = new Date(q.createdAt || 0).getTime();
      return t >= prev120Ms && t < recent60Ms;
    })
    .reduce((s, q) => s + (q.totalAmount || 0), 0);

  let revenueDropPercent = 0;
  if (prevRevenue > 0) {
    if (recentRevenue < prevRevenue) {
      revenueDropPercent = Math.round(((prevRevenue - recentRevenue) / prevRevenue) * 100);
      if (revenueDropPercent >= 60) {
        score += 25;
        reasons.push(`کاهش ${revenueDropPercent.toLocaleString('fa-IR')} درصدی در حجم خرید نسبت به دوره قبل`);
        recommendations.push('بررسی قیمت رقبا یا تغییر تامین‌کننده توسط مشتری');
      } else if (revenueDropPercent >= 35) {
        score += 15;
        reasons.push(`کاهش ${revenueDropPercent.toLocaleString('fa-IR')} درصدی در خریدهای اخیر`);
      }
    }
  }

  // ۳. سابقه ارتباط، فعالیت و تماس
  const accountActivities = (state.activities || []).filter(
    a => a.accountId === account.id || a.customerId === account.id
  );
  let daysSinceLastActivity: number | null = null;
  if (accountActivities.length > 0) {
    const actDates = accountActivities
      .map(a => new Date(a.dateTime || 0).getTime())
      .filter(t => !isNaN(t) && t > 0);
    if (actDates.length > 0) {
      const latestActMs = Math.max(...actDates);
      daysSinceLastActivity = Math.max(0, Math.floor((refMs - latestActMs) / DAY_MS));
    }
  }

  if (daysSinceLastActivity !== null) {
    if (daysSinceLastActivity >= 45) {
      score += 20;
      reasons.push(`عدم ثبت هرگونه تماس، جلسه یا فعالیت در ${daysSinceLastActivity.toLocaleString('fa-IR')} روز گذشته`);
      recommendations.push('برنامه‌ریزی فوری تماس احوالپرسی یا ویزیت حضوری');
    }
  } else if (accountActivities.length === 0) {
    score += 15;
    reasons.push('هیچ سابقه ارتباط یا فعالیتی در پرونده ثبت نشده است');
  }

  // ۴. وضعیت مالی، کهنگی مطالبات و چک‌های برگشتی
  const customerInvoices = (state.invoices || []).filter(
    i => (i.accountId === account.id || i.customerId === account.id) && i.status !== 'PAID'
  );

  let overdueAmount = 0;
  let maxOverdueDays = 0;
  customerInvoices.forEach(inv => {
    const days = calculateDaysOverdue(inv.dueDate, referenceDate);
    if (days > 0) {
      const rem = inv.balance !== undefined ? inv.balance : (inv.totalAmount - (inv.paidAmount || 0));
      overdueAmount += rem;
      if (days > maxOverdueDays) maxOverdueDays = days;
    }
  });

  if (maxOverdueDays > 60) {
    score += 25;
    reasons.push(`وجود مطالبات معوق بحرانی با کهنگی ${maxOverdueDays.toLocaleString('fa-IR')} روز`);
    recommendations.push('مذاکره برنامه تقسیط یا تهاتر جهت تسهیل خریدهای نقدی جدید');
  } else if (maxOverdueDays > 25) {
    score += 15;
    reasons.push(`وجود مطالبات معوق سررسیدشده (${maxOverdueDays.toLocaleString('fa-IR')} روز)`);
  }

  const bouncedCheques = (state.cheques || []).filter(
    c => ((c as any).accountId === account.id || (c as any).customerId === account.id) &&
      (c.status === 'BOUNCED' || (c as any).status === 'RETURNED')
  );
  if (bouncedCheques.length > 0) {
    score += 20;
    reasons.push(`${bouncedCheques.length.toLocaleString('fa-IR')} فقره چک برگشتی صیادی در پرونده مالی`);
    recommendations.push('تعلیق فروش اعتباری و هدایت مشتری به تسویه نقدی همراه با آفر تخفیف فوری');
  }

  // ۵. تیکت‌ها و شکایات باز پشتیبانی
  const openCases = (state.cases || []).filter(
    (c: any) => c.accountId === account.id && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
  );
  if (openCases.length > 0) {
    score += 15;
    reasons.push(`${openCases.length.toLocaleString('fa-IR')} تیکت باز یا نارضایتی پشتیبانی معلق`);
    recommendations.push('پیگیری با واحد پشتیبانی فنی و حل مسالمت‌آمیز شکایت باز');
  }

  // نرمال‌سازی امتیاز (۰ تا ۱۰۰)
  const churnScore = Math.min(100, Math.max(0, score));

  // دسته‌بندی سطح ریسک ریزش
  let riskTier: ChurnRiskTier = 'LOW';
  let riskTierLabel = 'کم (سالم)';
  if (churnScore >= 75) {
    riskTier = 'CRITICAL';
    riskTierLabel = 'بحرانی (ریزش قریب‌الوقوع)';
  } else if (churnScore >= 50) {
    riskTier = 'HIGH';
    riskTierLabel = 'زیاد (نیازمند مداخله)';
  } else if (churnScore >= 25) {
    riskTier = 'MEDIUM';
    riskTierLabel = 'متوسط (هشدار اولیه)';
  }

  // اقدام پیشنهادی
  let suggestedAction: {
    title: string;
    taskType: string;
    priority: 'HIGH' | 'CRITICAL' | 'NORMAL';
  } = {
    title: 'ارزیابی فصلی و ثبت تعامل دوره‌ای',
    taskType: 'FOLLOW_UP',
    priority: 'NORMAL',
  };

  if (riskTier === 'CRITICAL') {
    suggestedAction = {
      title: `مداخله فوری جلوگیری از ریزش مشتری: ${account.name}`,
      taskType: 'RETENTION_URGENT',
      priority: 'CRITICAL',
    };
  } else if (riskTier === 'HIGH') {
    suggestedAction = {
      title: `پیگیری پیشگیرانه و جلسه بازگشت مشتری: ${account.name}`,
      taskType: 'RETENTION_INTERVENTION',
      priority: 'HIGH',
    };
  } else if (riskTier === 'MEDIUM') {
    suggestedAction = {
      title: `تماس احوالپرسی و نیازسنجی تجاری: ${account.name}`,
      taskType: 'CHECK_IN',
      priority: 'NORMAL',
    };
  }

  return {
    accountId: account.id,
    accountName: account.name,
    churnScore,
    riskTier,
    riskTierLabel,
    daysSinceLastOrder,
    daysSinceLastActivity,
    unpaidOverdueAmount: overdueAmount,
    bouncedChequesCount: bouncedCheques.length,
    revenueDropPercent,
    reasons: reasons.length > 0 ? reasons : ['مشتری فعال و دارای تعامل منظم تجاری'],
    recommendations: recommendations.length > 0 ? recommendations : ['ادامه پایش و ارسال کاتالوگ محصولات جدید'],
    suggestedAction,
  };
}

export function evaluatePortfolioChurn(
  state: AppState,
  referenceDate: Date = new Date()
): ChurnPortfolioSummary {
  const accounts = state.accounts || [];
  const results = accounts.map(acc => predictAccountChurn(acc, state, referenceDate));

  const critical = results.filter(r => r.riskTier === 'CRITICAL');
  const high = results.filter(r => r.riskTier === 'HIGH');
  const medium = results.filter(r => r.riskTier === 'MEDIUM');
  const low = results.filter(r => r.riskTier === 'LOW');

  const sumScore = results.reduce((acc, r) => acc + r.churnScore, 0);
  const averageChurnScore = results.length > 0 ? Math.round(sumScore / results.length) : 0;

  // لیست مشتریان دارای ریسک نیازمند اقدام (Critical و High) مرتب‌شده بر اساس امتیاز ریزش
  const atRiskAccounts = [...critical, ...high].sort((a, b) => b.churnScore - a.churnScore);

  return {
    totalAccounts: accounts.length,
    criticalCount: critical.length,
    highCount: high.length,
    mediumCount: medium.length,
    lowCount: low.length,
    averageChurnScore,
    atRiskAccounts,
  };
}

export function generateChurnMitigationTask(
  account: Account,
  churnResult: ChurnPredictionResult,
  assigneeId: string,
  targetDueDate?: string
): CustomerTask {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dueDate = targetDueDate || tomorrow;

  const reasonsText = churnResult.reasons.slice(0, 3).map(r => `• ${r}`).join('\n');
  const recsText = churnResult.recommendations.slice(0, 2).map(r => `• ${r}`).join('\n');

  return {
    id: generateId(),
    accountId: account.id,
    customerId: account.id,
    title: churnResult.suggestedAction.title,
    description: `ریسک ریزش این مشتری به سطح «${churnResult.riskTierLabel}» با امتیاز ${churnResult.churnScore.toLocaleString('fa-IR')} از ۱۰۰ رسیده است.\n\nدلایل کلیدی:\n${reasonsText}\n\nراهکارهای پیشنهادی:\n${recsText}`,
    status: 'OPEN',
    priority: churnResult.suggestedAction.priority,
    assigneeId: assigneeId || account.ownerId || 'user-admin',
    assignedTo: assigneeId || account.ownerId || 'user-admin',
    dueDate,
    createdAt: new Date().toISOString(),
    slaStatus: churnResult.riskTier === 'CRITICAL' ? 'WARNING' : 'HEALTHY',
    type: 'CALL',
  } as unknown as CustomerTask;
}
