import React from 'react';
import { AppState, Quote } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, AlertTriangle, ShieldCheck, DollarSign, Layers } from 'lucide-react';

interface ProfitModalProps {
  state: AppState;
  quote: Quote;
  onClose: () => void;
}

export const ProfitModal: React.FC<ProfitModalProps> = ({ state, quote, onClose }) => {
  const threshold = state.settings?.quoteApprovalMarginThreshold || 15;
  const lines = quote.lines || [];

  const totalAmount = quote.totalAmount || lines.reduce((sum, l) => sum + (l.lineTotal || (l.unitPrice * l.quantity)), 0);
  const totalCost = lines.reduce((sum, l) => sum + ((l.costPrice || 0) * l.quantity), 0);
  const grossProfit = totalAmount - totalCost;
  const marginPercent = totalAmount > 0 ? Math.round((grossProfit / totalAmount) * 1000) / 10 : 0;
  const isBelowThreshold = marginPercent < threshold;

  const account = state.accounts?.find(a => a.id === (quote.accountId || quote.customerId));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="تحلیل اقتصادی و حاشیه سود پیش‌فاکتور"
      subtitle={`پیش‌فاکتور ${quote.quoteNumber || ''} ${account ? `• ${account.name}` : ''}`}
      maxWidth="2xl"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            بستن
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-surface rounded-xl border border-border">
            <span className="text-[11px] text-text-secondary block">مبلغ کل پیش‌فاکتور</span>
            <span className="font-mono font-bold text-sm text-text-main mt-1 block">
              {formatCurrency(totalAmount)}
            </span>
            <span className="text-[10px] text-text-secondary mt-0.5 block">ریال</span>
          </div>

          <div className="p-3 bg-surface rounded-xl border border-border">
            <span className="text-[11px] text-text-secondary block">بهای تمام‌شده اقلام</span>
            <span className="font-mono font-bold text-sm text-text-main mt-1 block">
              {formatCurrency(totalCost)}
            </span>
            <span className="text-[10px] text-text-secondary mt-0.5 block">ریال</span>
          </div>

          <div className="p-3 bg-surface rounded-xl border border-border">
            <span className="text-[11px] text-text-secondary block">سود ناخالص برآوردی</span>
            <span className={`font-mono font-bold text-sm mt-1 block ${grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(grossProfit)}
            </span>
            <span className="text-[10px] text-text-secondary mt-0.5 block">ریال</span>
          </div>

          <div className={`p-3 rounded-xl border ${isBelowThreshold ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className="text-[11px] text-text-secondary block">حاشیه سود (مارجین)</span>
            <span className={`font-mono font-bold text-sm mt-1 block ${isBelowThreshold ? 'text-amber-800' : 'text-emerald-800'}`}>
              {marginPercent}٪
            </span>
            <span className="text-[10px] text-text-secondary mt-0.5 block">آستانه تایید: {threshold}٪</span>
          </div>
        </div>

        {/* Threshold Warning or Approval Notice */}
        {isBelowThreshold ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">هشدار حاشیه سود کمتر از آستانه مجاز</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                حاشیه سود این پیش‌فاکتور ({marginPercent}٪) کمتر از حد مجاز سازمان ({threshold}٪) است. برای نهایی‌سازی و صدور قرارداد، نیازمند ثبت درخواست تاییدیه مدیر مالی یا مدیریت ارشد می‌باشد.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium">
              حاشیه سود این پیش‌فاکتور در محدوده مجاز و سودآور سازمانی قرار دارد ({marginPercent}٪ ≥ {threshold}٪).
            </span>
          </div>
        )}

        {/* Per-Line Profit Breakdown Table */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-canvas px-3.5 py-2.5 border-b border-border flex items-center justify-between">
            <span className="font-bold text-text-main flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              ریز حاشیه سود به تفکیک اقلام کالا
            </span>
            <span className="text-[10px] text-text-secondary font-mono">{lines.length} قلم کالا</span>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-right border-collapse">
              <thead className="bg-canvas text-text-secondary text-[11px] border-b border-border sticky top-0">
                <tr>
                  <th className="p-2.5">شرح کالا</th>
                  <th className="p-2.5 text-center">تعداد</th>
                  <th className="p-2.5 font-mono">قیمت فروش واحد</th>
                  <th className="p-2.5 font-mono">بهای تمام‌شده واحد</th>
                  <th className="p-2.5 font-mono">سود کل قلم</th>
                  <th className="p-2.5 text-center font-mono">مارجین</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.length > 0 ? (
                  lines.map((l, index) => {
                    const prod = state.externalProducts.find(p => p.id === l.productId);
                    const lineRevenue = l.lineTotal || (l.unitPrice * l.quantity);
                    const lineCost = (l.costPrice || prod?.costPrice || 0) * l.quantity;
                    const lineProfit = lineRevenue - lineCost;
                    const lineMargin = lineRevenue > 0 ? Math.round((lineProfit / lineRevenue) * 1000) / 10 : 0;
                    const lineLow = lineMargin < threshold;

                    return (
                      <tr key={l.id || index} className="hover:bg-surface/50 transition-colors">
                        <td className="p-2.5 font-medium text-text-main">
                          <div>{prod?.name || 'کالای سفارشی'}</div>
                          {prod?.sku && <span className="text-[10px] font-mono text-text-secondary">{prod.sku}</span>}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold">{l.quantity}</td>
                        <td className="p-2.5 font-mono">{formatCurrency(l.unitPrice)}</td>
                        <td className="p-2.5 font-mono text-text-secondary">{formatCurrency(l.costPrice || prod?.costPrice || 0)}</td>
                        <td className={`p-2.5 font-mono font-bold ${lineProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatCurrency(lineProfit)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${lineLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {lineMargin}٪
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-text-secondary">
                      قلم کالایی ثبت نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};
