import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState } from '../types';
import { CheckSquare, Clock, AlertTriangle, Building2, ChevronLeft, Calendar, ListChecks, CalendarCheck, Plus, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { DataSourceStatus } from './ui/DataSourceStatus';
import { evaluatePortfolioChurn } from '../services/churnPredictionService';

const greeting = (h: number) => (h < 5 ? 'شب بخیر' : h < 12 ? 'صبح بخیر' : h < 17 ? 'ظهر بخیر' : h < 20 ? 'عصر بخیر' : 'شب بخیر');
const fa = (n: number) => n.toLocaleString('fa-IR');

interface StatProps { label: string; value: number; hint: string; icon: React.ElementType; tone: 'danger' | 'warning' | 'primary' | 'success'; onClick: () => void; index: number }
const TONES = {
  danger: 'bg-danger-soft text-danger', 
  warning: 'bg-warning-soft text-warning', 
  primary: 'bg-primary/10 text-primary', 
  success: 'bg-success-soft text-success',
} as const;

function StatCard({ label, value, hint, icon: Icon, tone, onClick, index }: StatProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ['--i' as any]: index }}
      className="group relative overflow-hidden flex min-h-[52px] cursor-pointer flex-col justify-between p-4 text-start transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_28px_-6px_rgba(37,99,235,0.12)] active:scale-[0.98] rounded-2xl bg-surface backdrop-blur-xl border border-border/80 hover:border-primary/50 shadow-sm text-ink"
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-bold text-text-secondary group-hover:text-text-main transition-colors">{label}</span>
        <span className={cn('grid h-9 w-9 place-items-center rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm', TONES[tone])}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-2">
        <span className="text-2xl sm:text-3xl font-black leading-none tracking-tight text-text-main font-mono">{fa(value)}</span>
        <p className="mt-1 text-[11px] font-medium text-text-secondary line-clamp-1">{hint}</p>
      </div>
    </button>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between px-1 mt-2">
      <h2 className="text-sm font-extrabold text-text-main">{title}</h2>
      {action && <button type="button" onClick={onAction} className="flex min-h-[44px] cursor-pointer items-center gap-0.5 px-1 text-[11px] font-bold text-primary hover:underline">{action}<ChevronLeft size={13} /></button>}
    </div>
  );
}

export function HomeWorkspace({ state }: { state: AppState }) {
  const navigate = useNavigate();
  const currentUser = state.users.find(u => u.id === state.currentUserId);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const myTasks = (state.tasks || []).filter(t => t.assigneeId === state.currentUserId && t.status !== 'COMPLETED');
  const overdueTasks = myTasks.filter(t => t.dueDate && t.dueDate < today);
  const pendingApprovals = (state.internalRequests || []).filter((r: any) => r.currentAssigneeId === state.currentUserId && r.status === 'IN_REVIEW');
  const todayActivities = (state.activities || []).filter(a => a.ownerId === state.currentUserId && a.dateTime.startsWith(today));
  const todayMeetings = (state.internalMeetings || []).filter((m: any) => (m.organizerId === state.currentUserId || m.participantIds?.includes(state.currentUserId || '')) && m.date === today);
  const recentAccounts = [...(state.accounts || [])].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5);
  const todayDateStr = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now);
  const todayCount = todayMeetings.length + todayActivities.length;
  const churnPortfolio = evaluatePortfolioChurn(state);

  return (
    <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-24 font-premium" dir="rtl">
      
      {/* سلام و خلاصه روز */}
      <section
        data-tour="header-user"
        className="relative overflow-hidden p-5 sm:p-6 rounded-[28px] bg-surface backdrop-blur-2xl border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-ink"
      >
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <Calendar size={14} className="text-primary" />
            {todayDateStr}
          </p>
          <h1 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-text-main">
            {greeting(now.getHours())}، {currentUser?.name?.split(' ')[0] || 'همکار گرامی'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl">
            {myTasks.length === 0 && todayCount === 0 
              ? 'امروز مورد بازی یا برنامه‌ای ندارید؛ می‌توانید از دکمه‌های عملیات درون صفحه، کار جدیدی ثبت کنید.' 
              : `${fa(myTasks.length)} وظیفه باز و ${fa(todayCount)} برنامه برای امروز دارید.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/tasks?new=1')}
              className="bg-primary hover:bg-primary-hover text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-[0_4px_14px_rgba(37,99,235,0.35)] active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>تسک جدید</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/customers?new=1')}
              className="bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-text-main rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 border border-border/70 active:scale-95 transition-all cursor-pointer"
            >
              <Building2 size={15} />
              <span>مشتری جدید</span>
            </button>
          </div>
        </div>
      </section>

      <DataSourceStatus 
        source="CRM" 
        sourceName="فضای کاری شخصی و تقویم وظایف" 
        isAuthoritative={true}
      />

      {/* کارت توصیه‌های تحلیلی روز */}
      <section className="relative overflow-hidden rounded-[24px] p-4 sm:p-5 shadow-sm space-y-3 bg-surface border border-border/80">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
            <Sparkles size={16} />
          </span>
          <b className="text-sm font-extrabold text-ink">توصیه‌های تحلیلی روز</b>
        </div>
        <p className="text-xs sm:text-sm text-ink-soft leading-relaxed font-medium">
          {overdueTasks.length > 0
            ? `${fa(overdueTasks.length)} وظیفه در وضعیت نیاز به پیگیری فوری قرار دارد. پیشنهاد می‌کنم ابتدا کارتابل پیگیری را بررسی کنید.`
            : churnPortfolio.criticalCount > 0
            ? `${fa(churnPortfolio.criticalCount)} حساب در وضعیت ریسک ریزش بحرانی شناسایی شده‌اند. پیشنهاد می‌کنم از پرونده مشتریان برای آن‌ها وظیفه حفظ حساب ثبت فرمایید.`
            : 'وضعیت مشتریان و پیگیری‌ها پایدار است. می‌توانید فرصت‌های جدید فروش و پیش‌فاکتورها را بررسی نمایید.'}
        </p>
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            مشاهده اقدام‌ها
          </button>
          <button
            type="button"
            onClick={() => navigate('/accounts')}
            className="btn sec h-9 px-4 rounded-xl text-xs font-bold active:scale-95 transition-transform shadow-xs cursor-pointer"
          >
            حساب‌های مشتریان
          </button>
        </div>
      </section>

      {/* نیاز به اقدام */}
      <section data-tour="needs-action" className="space-y-2.5" aria-label="نیاز به اقدام">
        <SectionTitle title="نیاز به اقدام شما" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard index={0} label="وظایف تأخیردار" value={overdueTasks.length} hint="نیازمند پیگیری فوری" icon={AlertTriangle} tone="danger" onClick={() => navigate('/tasks')} />
          <StatCard index={1} label="تأییدیه‌های منتظر" value={pendingApprovals.length} hint="کارتابل اتوماسیون" icon={CheckSquare} tone="warning" onClick={() => navigate('/internal_automation')} />
          <StatCard index={2} label="وظایف باز من" value={myTasks.length} hint="در انتظار انجام" icon={ListChecks} tone="primary" onClick={() => navigate('/tasks')} />
          <StatCard index={3} label="برنامه امروز" value={todayCount} hint="جلسه و فعالیت" icon={CalendarCheck} tone="success" onClick={() => navigate('/calendar')} />
        </div>
      </section>

      {/* برنامه امروز */}
      <section data-tour="today-schedule" className="space-y-3" aria-label="برنامه کاری امروز">
        <SectionTitle title="برنامه کاری امروز" action="مشاهده تقویم" onAction={() => navigate('/calendar')} />
        <div className="space-y-2.5">
          {todayMeetings.map((m: any) => (
            <div key={m.id} className="se-card flex items-center gap-3 border-e-4 border-e-primary p-3.5">
              <div className="flex min-w-[56px] flex-col items-center rounded-2xl bg-canvas px-2 py-1.5 text-center border border-border/50">
                <span className="text-xs font-bold text-text-main font-mono">{m.startTime}</span>
                <span className="text-[10px] text-text-secondary font-mono">{m.endTime}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-text-main">{m.title}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-secondary"><Clock size={12} />جلسه کاری</p>
              </div>
            </div>
          ))}
          {todayActivities.map(a => {
            const acc = state.accounts.find(x => x.id === a.accountId);
            return (
              <div key={a.id} className="se-card flex items-center gap-3 border-e-4 border-e-chart-5 p-3.5">
                <div className="flex min-w-[56px] flex-col items-center rounded-2xl bg-canvas px-2 py-1.5 text-center border border-border/50">
                  <span className="text-xs font-bold text-text-main font-mono">{new Date(a.dateTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-text-main">{a.title}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-secondary"><Building2 size={12} /><span className="truncate">{acc?.name || 'مشتری'}</span></p>
                </div>
              </div>
            );
          })}
          {todayCount === 0 && (
            <div className="rounded-2xl border border-dashed border-border-strong bg-white/40 px-4 py-8 text-center text-xs font-medium text-text-secondary">رویداد یا جلسه‌ای برای امروز ثبت نشده است.</div>
          )}
        </div>
      </section>

      {/* مشتریان اخیر */}
      <section data-tour="customer-worklist" className="space-y-3" aria-label="مشتریان اخیر">
        <SectionTitle title="مشتریان اخیر" action="همه حساب‌ها" onAction={() => navigate('/accounts')} />
        <div className="space-y-2">
          {recentAccounts.map(acc => (
            <button key={acc.id} onClick={() => navigate(`/accounts/${acc.id}`)}
              className="se-card se-interactive se-pressable flex min-h-[60px] w-full cursor-pointer items-center justify-between p-3.5 text-start hover:shadow-raised rounded-2xl">
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{acc.name ? acc.name.substring(0, 1) : 'م'}</span>
                <span className="min-w-0"><span className="block truncate text-sm font-bold text-text-main">{acc.name}</span><span className="mt-0.5 block truncate text-[11px] text-text-secondary font-mono" dir="ltr" style={{ textAlign: 'right' }}>{acc.phone || 'بدون شماره'}</span></span>
              </span>
              <ChevronLeft size={16} className="shrink-0 text-text-secondary" />
            </button>
          ))}
          {recentAccounts.length === 0 && <div className="rounded-2xl border border-dashed border-border-strong bg-white/40 px-4 py-8 text-center text-xs text-text-secondary">هنوز مشتری ثبت نشده است.</div>}
        </div>
      </section>
    </div>
  );
}
