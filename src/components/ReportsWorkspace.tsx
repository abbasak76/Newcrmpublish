import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Download, TrendingUp, Users, Package, 
  MapPin, CheckCircle2, Wallet, ShoppingCart, Activity as ActivityIcon, ArrowUpRight
} from 'lucide-react';
import { AppState, NavigationTab } from '../types';
import { Card } from './ui/Card';
import { FilterChip } from './ui/Tabs';
import { formatCurrency } from '../lib/utils';

interface ReportsWorkspaceProps {
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
  setActiveTab: (tab: NavigationTab) => void;
}

export function ReportsWorkspace({ state }: ReportsWorkspaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<'SALES' | 'DISTRIBUTION' | 'TEAM' | 'INVENTORY'>('SALES');

  const salesMetrics = useMemo(() => {
    const quotes = state.quotes || [];
    const validQuotes = quotes.filter(q => q.status !== 'REJECTED');
    const totalGrossSales = validQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
    
    const payments = state.payments || [];
    const clearedPayments = payments.filter(p => p.status === 'CLEARED');
    const totalRealizedRevenue = clearedPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingChecks = payments.filter((p: any) => p.status === 'REGISTERED' || p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
    const outstandingMarketReceivables = Math.max(0, totalGrossSales - totalRealizedRevenue);

    let totalSalesRevenue = 0;
    let totalSalesCost = 0;
    validQuotes.forEach(q => {
      q.lines.forEach(l => {
        totalSalesRevenue += l.lineTotal;
        totalSalesCost += (l.costPrice * l.quantity);
      });
    });
    const overallMargin = totalSalesRevenue > 0 ? Math.round(((totalSalesRevenue - totalSalesCost) / totalSalesRevenue) * 1000) / 10 : 0;
    const avgOrderValue = validQuotes.length > 0 ? Math.round(totalGrossSales / validQuotes.length) : 0;

    return {
      totalGrossSales,
      totalRealizedRevenue,
      pendingChecks,
      outstandingMarketReceivables,
      overallMargin,
      avgOrderValue,
      quoteCount: validQuotes.length
    };
  }, [state.quotes, state.payments]);

  const productAnalytics = useMemo(() => {
    const map: Record<string, { name: string; sku: string; quantity: number; revenue: number; cost: number }> = {};
    (state.quotes || []).forEach(q => {
      if (q.status === 'REJECTED') return;
      q.lines.forEach(l => {
        const prod = state.externalProducts.find(p => p.id === l.productId);
        if (!map[l.productId]) {
          map[l.productId] = {
            name: prod?.name || 'کالای نامشخص',
            sku: prod?.sku || '-',
            quantity: 0,
            revenue: 0,
            cost: 0
          };
        }
        map[l.productId].quantity += l.quantity;
        map[l.productId].revenue += l.lineTotal;
        map[l.productId].cost += (l.costPrice * l.quantity);
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [state.quotes, state.externalProducts]);

  const routeAnalytics = useMemo(() => {
    return (state.routes || []).map((r: any) => {
      const routeAccounts = (state.accounts || []).filter(a => a.routeId === r.id);
      const accountIds = new Set(routeAccounts.map(a => a.id));
      const routeQuotes = (state.quotes || []).filter(q => q.accountId && accountIds.has(q.accountId) && q.status !== 'REJECTED');
      const routeRevenue = routeQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
      const routeActivities = (state.activities || []).filter(act => act.accountId && accountIds.has(act.accountId));

      return {
        route: r,
        accountsCount: routeAccounts.length,
        activitiesCount: routeActivities.length,
        quotesCount: routeQuotes.length,
        revenue: routeRevenue
      };
    });
  }, [state.routes, state.accounts, state.quotes, state.activities]);

  const teamAnalytics = useMemo(() => {
    return (state.users || []).map(user => {
      const userQuotes = (state.quotes || []).filter(q => q.ownerId === user.id && q.status !== 'REJECTED');
      const userRevenue = userQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
      const userActivities = (state.activities || []).filter(a => a.ownerId === user.id);
      const userTasks = (state.tasks || []).filter(t => t.assigneeId === user.id);
      const completedTasks = userTasks.filter(t => t.status === 'COMPLETED');
      const taskCompletionRate = userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 100;

      return {
        user,
        quotesCount: userQuotes.length,
        revenue: userRevenue,
        activitiesCount: userActivities.length,
        taskCompletionRate
      };
    });
  }, [state.users, state.quotes, state.activities, state.tasks]);

  const handleExportCSV = () => {
    let csv = '';
    if (selectedCategory === 'SALES') {
      csv = 'کالا,کد کالا,تعداد فروش,درآمد کل (ریال),سود ناخالص (ریال)\n';
      productAnalytics.forEach(p => {
        csv += `"${p.name}","${p.sku}",${p.quantity},${p.revenue},${p.revenue - p.cost}\n`;
      });
    } else if (selectedCategory === 'DISTRIBUTION') {
      csv = 'نام مسیر,کد مسیر,تعداد مشتریان,ویزیت های ثبت شده,پیش فاکتورها,درآمد مسیر (ریال)\n';
      routeAnalytics.forEach((r: any) => {
        csv += `"${r.route.name}","${r.route.code}",${r.accountsCount},${r.activitiesCount},${r.quotesCount},${r.revenue}\n`;
      });
    } else {
      csv = 'نام کارشناس,نام کاربری,تعداد فعالیت ها,تعداد پیش فاکتورها,ارزش فروش (ریال),نرخ اتمام وظایف\n';
      teamAnalytics.forEach(t => {
        csv += `"${t.user.name}","${t.user.username}",${t.activitiesCount},${t.quotesCount},${t.revenue},"${t.taskCompletionRate}%"\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fmcg_analytics_${selectedCategory.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-24 font-premium" dir="rtl">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> گزارشات تحلیلی و هوش تجاری
            </h2>
            <span className="text-xs text-text-secondary">پایش زنجیره ارزش، توزیع مویرگی، وصولی و بهره‌وری تیم</span>
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border text-text-main hover:bg-canvas text-xs font-bold rounded-[10px] shadow-sm transition-colors cursor-pointer"
          >
            <Download size={15} className="text-primary" /> استخراج اکسل / CSV
          </button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <FilterChip label="فروش و درآمد" active={selectedCategory === 'SALES'} onClick={() => setSelectedCategory('SALES')} />
          <FilterChip label="عملکرد مسیرها و توزیع" active={selectedCategory === 'DISTRIBUTION'} onClick={() => setSelectedCategory('DISTRIBUTION')} />
          <FilterChip label="بهره‌وری تیم فروش" active={selectedCategory === 'TEAM'} onClick={() => setSelectedCategory('TEAM')} />
          <FilterChip label="تحلیل کاتالوگ و سودآوری" active={selectedCategory === 'INVENTORY'} onClick={() => setSelectedCategory('INVENTORY')} />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {selectedCategory === 'SALES' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card padding="sm" className="space-y-1 bg-surface border-border">
                <span className="text-[11px] font-bold text-text-secondary block">فروش ناخالص کل</span>
                <strong className="text-base font-bold font-mono text-text-main block">{formatCurrency(salesMetrics.totalGrossSales)}</strong>
                <span className="text-[10px] text-text-secondary">از {salesMetrics.quoteCount} پیش‌فاکتور</span>
              </Card>

              <Card padding="sm" className="space-y-1 bg-surface border-border">
                <span className="text-[11px] font-bold text-success block">وصولی تحقق‌یافته (نقد/پاس‌شده)</span>
                <strong className="text-base font-bold font-mono text-success block">{formatCurrency(salesMetrics.totalRealizedRevenue)}</strong>
                <span className="text-[10px] text-text-secondary">تسویه قطعی</span>
              </Card>

              <Card padding="sm" className="space-y-1 bg-surface border-border">
                <span className="text-[11px] font-bold text-warning block">مطالبات در بازار / چک سررسید</span>
                <strong className="text-base font-bold font-mono text-warning block">{formatCurrency(salesMetrics.outstandingMarketReceivables)}</strong>
                <span className="text-[10px] text-text-secondary">مانده حساب مشتریان</span>
              </Card>

              <Card padding="sm" className="space-y-1 bg-surface border-border">
                <span className="text-[11px] font-bold text-primary block">حاشیه سود ناخالص سبد</span>
                <strong className="text-base font-bold font-mono text-primary block">{salesMetrics.overallMargin}٪</strong>
                <span className="text-[10px] text-text-secondary">میانگین سفارش: {formatCurrency(salesMetrics.avgOrderValue)}</span>
              </Card>
            </div>

            <Card padding="md" className="bg-surface border-border">
              <h3 className="font-bold text-sm text-text-main mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> پرفروش‌ترین اقلام کالایی در سفارشات
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-canvas text-text-secondary font-semibold border-b border-border">
                    <tr>
                      <th className="p-2.5">نام کالا</th>
                      <th className="p-2.5">کد SKU</th>
                      <th className="p-2.5">تیراژ فروش</th>
                      <th className="p-2.5">درآمد ناخالص (ریال)</th>
                      <th className="p-2.5">سود ناخالص (ریال)</th>
                      <th className="p-2.5">حاشیه سود</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {productAnalytics.map((p, idx) => {
                      const margin = p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 1000) / 10 : 0;
                      return (
                        <tr key={idx} className="hover:bg-canvas/50">
                          <td className="p-2.5 font-bold text-text-main">{p.name}</td>
                          <td className="p-2.5 font-mono text-text-secondary">{p.sku}</td>
                          <td className="p-2.5 font-mono font-bold text-text-main">{p.quantity}</td>
                          <td className="p-2.5 font-mono text-primary font-bold">{formatCurrency(p.revenue)}</td>
                          <td className="p-2.5 font-mono text-text-secondary">{formatCurrency(p.revenue - p.cost)}</td>
                          <td className="p-2.5 font-mono font-bold text-primary">{margin}٪</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {selectedCategory === 'DISTRIBUTION' && (
          <div className="space-y-4">
            <Card padding="md" className="bg-surface border-border">
              <h3 className="font-bold text-sm text-text-main mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> تحلیل عملکرد مسیرهای توزیع و تور ویزیت (Routes)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-canvas text-text-secondary font-semibold border-b border-border">
                    <tr>
                      <th className="p-2.5">مسیر توزیع</th>
                      <th className="p-2.5">کد مسیر</th>
                      <th className="p-2.5">مشتریان پوشش داده شده</th>
                      <th className="p-2.5">ویزیت‌های ثبت‌شده</th>
                      <th className="p-2.5">سفارشات صادرشده</th>
                      <th className="p-2.5">درآمد کل مسیر (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {routeAnalytics.map((r: any) => (
                      <tr key={r.route.id} className="hover:bg-canvas/50">
                        <td className="p-2.5 font-bold text-text-main">{r.route.name}</td>
                        <td className="p-2.5 font-mono text-text-secondary">{r.route.code}</td>
                        <td className="p-2.5 font-mono font-bold">{r.accountsCount} فروشگاه</td>
                        <td className="p-2.5 font-mono">{r.activitiesCount} تعامل</td>
                        <td className="p-2.5 font-mono">{r.quotesCount} پیش‌فاکتور</td>
                        <td className="p-2.5 font-mono font-bold text-primary">{formatCurrency(r.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {selectedCategory === 'TEAM' && (
          <div className="space-y-4">
            <Card padding="md" className="bg-surface border-border">
              <h3 className="font-bold text-sm text-text-main mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> شاخص‌های کلیدی عملکرد تیم فروش و ویزیتورها (KPI)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-canvas text-text-secondary font-semibold border-b border-border">
                    <tr>
                      <th className="p-2.5">کارشناس فروش</th>
                      <th className="p-2.5">نام کاربری</th>
                      <th className="p-2.5">فعالیت‌ها / ویزیت‌ها</th>
                      <th className="p-2.5">پیش‌فاکتورهای صادرشده</th>
                      <th className="p-2.5">ارزش فروش محقق‌شده</th>
                      <th className="p-2.5">نرخ تکمیل وظایف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {teamAnalytics.map(t => (
                      <tr key={t.user.id} className="hover:bg-canvas/50">
                        <td className="p-2.5 font-bold text-text-main">{t.user.name}</td>
                        <td className="p-2.5 font-mono text-text-secondary">@{t.user.username}</td>
                        <td className="p-2.5 font-mono">{t.activitiesCount} مورد</td>
                        <td className="p-2.5 font-mono">{t.quotesCount} سند</td>
                        <td className="p-2.5 font-mono font-bold text-primary">{formatCurrency(t.revenue)} ریال</td>
                        <td className="p-2.5 font-mono font-bold text-info">{t.taskCompletionRate}٪</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {selectedCategory === 'INVENTORY' && (
          <div className="space-y-4">
            <Card padding="md" className="bg-surface border-border">
              <h3 className="font-bold text-sm text-text-main mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" /> تحلیل کاتالوگ، حاشیه سود پایه و بسته‌های ترکیبی
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-canvas text-text-secondary font-semibold border-b border-border">
                    <tr>
                      <th className="p-2.5">نام کالا</th>
                      <th className="p-2.5">دسته</th>
                      <th className="p-2.5">قیمت پایه ERP (ریال)</th>
                      <th className="p-2.5">بهای تمام‌شده (ریال)</th>
                      <th className="p-2.5">حاشیه سود پایه‌ای</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {state.externalProducts.map(p => {
                      const profit = p.basePrice - p.costPrice;
                      const margin = p.basePrice > 0 ? Math.round((profit / p.basePrice) * 1000) / 10 : 0;
                      return (
                        <tr key={p.id} className="hover:bg-canvas/50">
                          <td className="p-2.5 font-bold text-text-main">{p.name}</td>
                          <td className="p-2.5 text-text-secondary">{p.category}</td>
                          <td className="p-2.5 font-mono font-bold">{formatCurrency(p.basePrice)}</td>
                          <td className="p-2.5 font-mono text-text-secondary">{formatCurrency(p.costPrice)}</td>
                          <td className="p-2.5 font-mono font-bold text-primary">{margin}٪</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
