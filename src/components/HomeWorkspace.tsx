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
  danger: 'bg-danger-soft text-danger border-danger-border', 
  warning: 'bg-warning-soft text-warning border-warning-border', 
  primary: 'bg-primary-soft text-primary border-primary/20', 
  success: 'bg-success-soft text-success border-success-border',
} as const;

function StatCard({ label, value, hint, icon: Icon, tone, onClick, index }: StatProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ['--i' as any]: index }}
      className="group relative overflow-hidden flex min-h-[52px] cursor-pointer flex-col justify-between p-4 text-start transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98] rounded-2xl bg-surface border border-border shadow-sm text-text-main"
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-bold text-text-secondary group-hover:text-text-main transition-colors">{label}</span>
        <span className={cn('grid h-9 w-9 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 border', TONES[tone])}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-3">
        <span className="text-2xl sm:text-3xl font-black leading-none tracking-tight text-text-main tabular-nums">{fa(value)}</span>
        <p className="mt-1.5 text-[11px] font-medium text-text-secondary line-clamp-1">{hint}</p>
      </div>
    </button>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between px-1 mt-4 mb-3">
      <h2 className="text-sm font-extrabold text-text-main">{title}</h2>
      {action && (
        <button type="button" onClick={onAction} className="flex min-h-[36px] cursor-pointer items-center gap-0.5 px-2 rounded-lg text-xs font-bold text-primary hover:bg-primary-soft transition-colors">
          {action}<ChevronLeft size={14} />
        </button>
      )}
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
    <div className="w-full space-y-5 px-2 py-2 sm:px-4 pb-24 font-sans" dir="rtl">
      
      {/* هدر روزانه */}
      <section className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-sm text-text-main">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-2">
            <Calendar size={14} className="text-primary" />
            {todayDateStr}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-main">
            {greeting(now.getHours())}، {currentUser?.name?.split(' ')[0] || 'همکار گرامی'}
          </h1>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-xl">
            {myTasks.length === 0 && todayCount === 0 
              ? 'امروز مورد بازی یا برنامه‌ای ندارید؛ می‌توانید از دکمه‌های عملیات درون صفحه، کار جدیدی ثبت کنید.' 
              : `${fa(myTasks.length)} وظیفه باز و ${fa(todayCount)} برنامه برای امروز دارید.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/tasks?new=1')}
              className="bg-primary hover:bg-primary-hover text-white rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>تسک جدید</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/customers?new=1')}
              className="bg-canvas hover:bg-border text-text-main rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2 border border-border active:scale-95 transition-all cursor-pointer"
            >
              <Building2 size={16} />
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

      {/* توصیه تحلیلی */}
      <section className="relative overflow-hidden rounded-2xl p-5 shadow-sm space-y-3 bg-surface border border-border">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary font-bold text-xs border border-primary/20">
            <Sparkles size={16} />
          </span>
          <b className="text-sm font-extrabold text-text-main">توصیه عملیاتی روز</b>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed font-medium pl-4">
          {overdueTasks.length > 0
            ? `${fa(overdueTasks.length)} وظیفه در وضعیت نیاز به پیگیری فوری قرار دارد. پیشنهاد می‌کنم ابتدا کارتابل پیگیری را بررسی کنید.`
            : churnPortfolio.criticalCount > 0
            ? `${fa(churnPortfolio.criticalCount)} حساب در وضعیت ریسک ریزش بحرانی شناسایی شده‌اند. پیشنهاد می‌کنم از پرونده مشتریان برای آن‌ها وظیفه حفظ حساب ثبت فرمایید.`
            : 'وضعیت مشتریان و پیگیری‌ها پایدار است. می‌توانید فرصت‌های جدید فروش و پیش‌فاکتورها را بررسی نمایید.'}
        </p>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-canvas border border-border text-text-main hover:bg-border active:scale-95 transition-all cursor-pointer"
          >
            مشاهده اقدام‌ها
          </button>
        </div>
      </section>

      {/* نیاز به اقدام */}
      <section aria-label="نیاز به اقدام">
        <SectionTitle title="نیاز به اقدام شما" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard index={0} label="وظایف تأخیردار" value={overdueTasks.length} hint="نیازمند پیگیری فوری" icon={AlertTriangle} tone="danger" onClick={() => navigate('/tasks')} />
          <StatCard index={1} label="تأییدیه‌های منتظر" value={pendingApprovals.length} hint="کارتابل اتوماسیون" icon={CheckSquare} tone="warning" onClick={() => navigate('/internal_automation')} />
          <StatCard index={2} label="وظایف باز من" value={myTasks.length} hint="در انتظار انجام" icon={ListChecks} tone="primary" onClick={() => navigate('/tasks')} />
          <StatCard index={3} label="برنامه امروز" value={todayCount} hint="جلسه و فعالیت" icon={CalendarCheck} tone="success" onClick={() => navigate('/calendar')} />
        </div>
      </section>

      {/* برنامه امروز */}
      <section aria-label="برنامه کاری امروز">
        <SectionTitle title="برنامه کاری امروز" action="مشاهده تقویم" onAction={() => navigate('/calendar')} />
        <div className="space-y-3">
          {todayMeetings.map((m: any) => (
            <div key={m.id} className="bg-surface rounded-2xl flex items-center gap-4 border border-border p-4 shadow-sm">
              <div className="flex min-w-[64px] flex-col items-center rounded-xl bg-canvas px-2 py-2 text-center border border-border">
                <span className="text-sm font-bold text-text-main tabular-nums">{m.startTime}</span>
                <span className="text-[10px] text-text-secondary tabular-nums">{m.endTime}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-text-main">{m.title}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary"><Clock size={14} />جلسه کاری</p>
              </div>
            </div>
          ))}
          {todayActivities.map(a => {
            const acc = state.accounts.find(x => x.id === a.accountId);
            return (
              <div key={a.id} className="bg-surface rounded-2xl flex items-center gap-4 border border-border p-4 shadow-sm">
                <div className="flex min-w-[64px] flex-col items-center rounded-xl bg-canvas px-2 py-2 text-center border border-border">
                  <span className="text-sm font-bold text-text-main tabular-nums">{new Date(a.dateTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-text-main">{a.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary"><Building2 size={14} /><span className="truncate">{acc?.name || 'مشتری'}</span></p>
                </div>
              </div>
            );
          })}
          {todayCount === 0 && (
            <div className="rounded-2xl border border-dashed border-border-strong bg-canvas px-4 py-10 text-center text-sm font-medium text-text-secondary">
              رویداد یا جلسه‌ای برای امروز ثبت نشده است.
            </div>
          )}
        </div>
      </section>

      {/* مشتریان اخیر */}
      <section aria-label="مشتریان اخیر">
        <SectionTitle title="مشتریان اخیر" action="همه حساب‌ها" onAction={() => navigate('/accounts')} />
        <div className="space-y-3">
          {recentAccounts.map(acc => (
            <button key={acc.id} onClick={() => navigate(`/accounts/${acc.id}`)}
              className="bg-surface border border-border flex min-h-[64px] w-full cursor-pointer items-center justify-between p-4 text-start hover:shadow-card hover:border-primary/40 transition-all rounded-2xl">
              <span className="flex min-w-0 items-center gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-bold text-primary border border-primary/20">{acc.name ? acc.name.substring(0, 1) : 'م'}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-text-main">{acc.name}</span>
                  <span className="mt-1 block truncate text-xs text-text-secondary tabular-nums" dir="ltr" style={{ textAlign: 'right' }}>{acc.phone || 'بدون شماره'}</span>
                </span>
              </span>
              <ChevronLeft size={18} className="shrink-0 text-text-secondary" />
            </button>
          ))}
          {recentAccounts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border-strong bg-canvas px-4 py-10 text-center text-sm text-text-secondary">
              هنوز مشتری ثبت نشده است.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
