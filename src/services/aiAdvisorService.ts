import { getHighValueQuoteThreshold, getChurnRiskPolicy } from '../lib/orgPolicy';
import { AppState, AIRecommendation } from '../types';
import { formatCurrency } from '../lib/utils';

export class AIAdvisorService {
  constructor(private state: AppState) {}

  generateRecommendations(): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();

    const accounts = this.state.accounts || [];

    const churn = getChurnRiskPolicy(this.state);
    if (churn) accounts.forEach(account => {
      const quotes = (this.state.quotes || []).filter(q => q.accountId === account.id);
      if (quotes.length >= 1) {
        const totalSales = quotes.reduce((sum, q) => sum + q.totalAmount, 0);
        const sorted = [...quotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const lastDate = new Date(sorted[0].createdAt);
        const daysSinceLastOrder = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

        if (daysSinceLastOrder > churn.days && totalSales > churn.minSales) {
          recommendations.push({
            id: `rec-risk-${account.id}`,
            title: `ریزش احتمالی حساب تجاری: ${account.name}`,
            customerId: account.id,
            category: 'CUSTOMER_RISK',
            reason: `مشتری با ارزش تاریخی بالا (${formatCurrency(totalSales)} ریال)، بیش از ${daysSinceLastOrder} روز است که پیش‌فاکتور جدیدی ثبت نکرده است.`,
            dataUsed: `پیش‌فاکتورهای گذشته: ${quotes.length} فقره | آخرین تاریخ: ${sorted[0].createdAt} | ارزش کل: ${formatCurrency(totalSales)} ریال`,
            proposedAction: `ثبت ویزیت حضوری یا تماس تلفنی پیگیری با مدیر بازرگانی`,
            actionPayload: { targetTab: 'accounts', customerId: account.id, actionType: 'PLAN_VISIT' },
            createdAt: todayStr
          });
        }
      }
    });

    (this.state.opportunities || []).filter(o => o.stage === 'NEGOTIATION' && o.amount > getHighValueQuoteThreshold(this.state)).forEach(opp => {
      recommendations.push({
        id: `rec-opp-${opp.id}`,
        title: `پیگیری فرصت کلیدی: ${opp.title}`,
        customerId: opp.accountId,
        category: 'NEGOTIATION_DEAL',
        reason: `مذاکره با ارزش ${formatCurrency(opp.amount)} ریال در مرحله نهایی قرار دارد.`,
        dataUsed: `ارزش معامله: ${formatCurrency(opp.amount)} ریال | تاریخ هدف: ${opp.expectedCloseDate || '-'}`,
        proposedAction: `تنظیم جلسه حضوری جهت نهایی‌سازی قرارداد و صدور پیش‌فاکتور قطعی`,
        actionPayload: { targetTab: 'opportunities', customerId: opp.accountId, actionType: 'CLOSE_DEAL' },
        createdAt: todayStr
      });
    });

    return recommendations;
  }
}
