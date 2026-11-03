import { getTenantName } from '../lib/orgPolicy';
import React from 'react';
import { Quote, AppState } from '../types';
import { formatCurrency } from '../lib/utils';
import { Printer } from 'lucide-react';

interface PrintProps {
  quote: Quote;
  state: AppState;
}

export function CustomerInvoicePrint({ quote, state }: PrintProps) {
  const customer = (state.accounts || state.customers || []).find(
    a => a.id === (quote.accountId || quote.customerId)
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 text-xs space-y-4" dir="rtl" id="print-area">
      <div className="flex justify-between items-start border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-black text-text-main">پیش‌فاکتور رسمی فروش کالا و خدمات</h2>
          <span className="text-[11px] text-slate-500 font-bold block mt-1">{getTenantName(state) ? `${getTenantName(state)} · ` : ''}AKHAVAN CRM</span>
        </div>
        <div className="text-left font-mono text-[11px]">
          <div>شماره: <span className="font-bold text-primary">{quote.quoteNumber}</span></div>
          <div className="text-slate-400 mt-1">تاریخ: {new Date(quote.createdAt).toLocaleDateString('fa-IR')}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
        <div>
          <span className="text-slate-400 text-[10px] block font-bold">مشخصات خریدار:</span>
          <strong className="text-slate-900 block mt-0.5">{customer?.name || 'مشتری محترم'}</strong>
          <span className="text-slate-500 text-[11px] block">{customer?.company || ''} - {customer?.phone || ''}</span>
        </div>
        <div className="text-left">
          <span className="text-slate-400 text-[10px] block font-bold">آدرس و نشانی تحویل:</span>
          <span className="text-slate-700 text-[11px] block mt-0.5">{customer?.address || 'تحویل انبار مرکزی'}</span>
        </div>
      </div>

      <table className="w-full text-right border border-slate-200 rounded-xl overflow-hidden">
        <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-600">
          <tr>
            <th className="p-2.5">ردیف</th>
            <th className="p-2.5">شرح کالا / خدمات</th>
            <th className="p-2.5 text-center">تعداد</th>
            <th className="p-2.5 text-center">قیمت واحد (ریال)</th>
            <th className="p-2.5 text-center">مبلغ کل (ریال)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(quote.lines || []).map((l: any, idx: number) => (
            <tr key={idx}>
              <td className="p-2 text-slate-400 text-center font-mono">{idx + 1}</td>
              <td className="p-2 font-bold text-slate-800">{l.productName || l.description || 'کالا/خدمت'}</td>
              <td className="p-2 text-center font-mono">{l.quantity}</td>
              <td className="p-2 text-center font-mono font-bold">{(l.unitPrice || 0).toLocaleString('fa-IR')}</td>
              <td className="p-2 text-center font-mono font-bold text-primary">{(l.lineTotal || 0).toLocaleString('fa-IR')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center bg-primary/5 border border-primary/20 p-3.5 rounded-xl">
        <span className="font-bold text-slate-800">مبلغ نهایی قابل پرداخت:</span>
        <span className="font-mono font-black text-base text-primary">
          {(quote.totalAmount || 0).toLocaleString('fa-IR')} ریال
        </span>
      </div>

      {quote.notes && (
        <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <strong>توضیحات و شرایط: </strong> {quote.notes}
        </div>
      )}

      <div className="pt-2 text-center">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" /> چاپ پیش‌فاکتور رسمی (A4)
        </button>
      </div>
    </div>
  );
}
