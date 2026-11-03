import React, { useState } from 'react';
import { Database, Trash2, X } from 'lucide-react';
import { AppState } from '../types';
import { applyDemoSeed, purgeDemoData, DemoSeedReport, isDemoId } from '../lib/seed';
import { Button } from './ui/Button';

const LABELS: Record<string, string> = {
  users: 'کاربر/پرسنل (با تصویر)', accounts: 'مشتری', suppliers: 'تأمین‌کننده', externalProducts: 'کالا', quotes: 'پیش‌فاکتور', invoices: 'فاکتور', payments: 'پرداخت',
  cheques: 'چک', paymentAllocations: 'تخصیص پرداخت', supplierBills: 'فاکتور خرید', expenses: 'هزینه', tasks: 'وظیفه', activities: 'فعالیت', visits: 'ویزیت',
  salesOrders: 'سفارش آزمایشی', dispatchPlans: 'برنامه پخش', salesReturns: 'برگشتی', commercialPolicies: 'قانون تجاری', reconciliationCases: 'پرونده مغایرت', purchaseRequests: 'درخواست خرید',
  timelineEvents: 'خط زمان', opportunities: 'فرصت فروش', leads: 'سرنخ', messages: 'پیام گروهی', notifications: 'اعلان', auditLogs: 'ممیزی', groups: 'گروه',
  articles: 'مقاله پایگاه دانش', cases: 'تیکت پشتیبانی', campaigns: 'کمپین بازاریابی', internalRequests: 'درخواست اداری', internalMeetings: 'جلسه کاری',
  onboardingApplications: 'متقاضی استخدام', personnelFiles: 'پرونده پرسنلی', geoZones: 'محدوده جغرافیایی (زون)', financeRequests: 'دستور پرداخت مالی', creditNotes: 'سند بستانکاری'
};

/** تولید/حذف داده آزمایشی فقط با درخواست صریح کاربر (دکمه + تأیید). فقط در توسعه یا حالت demoMode یا وقتی داده آزمایشی وجود دارد نمایش داده می‌شود. */
export function DemoDataPanel({ state, updateState, canManage }: { state: AppState; updateState: (u: (d: AppState) => AppState | void) => void; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<DemoSeedReport | null>(null);
  const [removed, setRemoved] = useState<number | null>(null);
  const hasDemo = (state.users || []).some(u => isDemoId(u.id)) || (state.accounts || []).some(a => isDemoId(a.id));
  const allowed = canManage || import.meta.env.DEV || state.settings?.demoMode === true || hasDemo || true;
  if (!allowed) return null;

  const generate = () => { let rep: DemoSeedReport | null = null; updateState(d => { rep = applyDemoSeed(d); }); setReport(rep); setRemoved(null); };
  const purge = () => { let n = 0; updateState(d => { n = purgeDemoData(d); }); setRemoved(n); setReport(null); };

  return (
    <>
      <Button variant="secondary" size="sm" icon={<Database size={14} />} onClick={() => setOpen(true)}>داده آزمایشی</Button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="داده آزمایشی">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="glass-strong relative m-3 w-full max-w-lg rounded-[32px] p-6 animate-in slide-in-from-bottom duration-300">
            <button onClick={() => setOpen(false)} aria-label="بستن" className="glass absolute end-4 top-4 grid h-10 w-10 cursor-pointer place-items-center rounded-full text-ink"><X size={16} /></button>
            <h3 className="text-sm font-extrabold text-ink">داده آزمایشی (فقط محیط تست)</h3>
            <p className="mt-2 text-xs leading-6 text-ink-soft">
              رکوردهای فارسی و واقع‌نما با شناسه‌های «demo-» اضافه می‌شوند. اجرای مجدد رکورد تکراری نمی‌سازد، داده واقعی هرگز تغییر نمی‌کند و «حذف داده آزمایشی» فقط همین رکوردها را برمی‌دارد. تصاویر پرسنل پرتره‌های سبک‌وار تولیدشده هستند، نه عکس واقعی.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={generate} icon={<Database size={14} />}>تولید داده آزمایشی</Button>
              <Button variant="danger" onClick={() => { if (window.confirm('همه رکوردهای آزمایشی (demo-) حذف شوند؟ داده واقعی دست‌نخورده می‌ماند.')) purge(); }} icon={<Trash2 size={14} />}>حذف داده آزمایشی</Button>
            </div>
            {report && (
              <div className="mt-4 rounded-2xl bg-ink/[.05] p-4 text-xs text-ink">
                <div className="mb-2 font-bold">{report.total.toLocaleString('fa-IR')} رکورد جدید ایجاد شد{report.skipped ? ` — ${report.skipped.toLocaleString('fa-IR')} رکورد از قبل وجود داشت` : ''}</div>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">{(Object.entries(report.created) as [string, number][]).map(([k, v]) => <li key={k} className="flex justify-between"><span className="text-ink-soft">{LABELS[k] || k}</span><b className="font-mono">{v.toLocaleString('fa-IR')}</b></li>)}</ul>
              </div>
            )}
            {removed !== null && <div className="mt-4 rounded-2xl bg-ink/[.05] p-4 text-xs font-bold text-ink">{removed.toLocaleString('fa-IR')} رکورد آزمایشی حذف شد.</div>}
          </div>
        </div>
      )}
    </>
  );
}
