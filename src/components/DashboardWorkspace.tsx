import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIAdvisorService } from '../services/aiAdvisorService';
import { AppState } from '../types';
import { Card } from './ui/Card';
import { FileText, Hourglass, MessageSquare, MessageCircle, Calendar, Filter, AlertTriangle, ArrowLeft } from 'lucide-react';
import { formatAppDate } from '../lib/utils';
import { DonutChart, GaugeChart, FunnelChart } from './charts';
import { PageToolbar } from './ui/PageToolbar';
import { Button } from './ui/Button';
import { DataSourceStatus } from './ui/DataSourceStatus';
import { OPPORTUNITY_STAGES } from '../config/pipeline';
import { activeRecords } from '../lib/recordLifecycle';
import { evaluatePortfolioChurn } from '../services/churnPredictionService';

export function DashboardWorkspace({ state }: { state: AppState }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('هفتگی');

  const recommendations = state.settings?.aiKillSwitch ? [] : new AIAdvisorService(state).generateRecommendations();

  const myTasks = (state.tasks || []).filter(t => !state.currentUserId || t.assigneeId === state.currentUserId);
  const recentTasksCount = myTasks.length;
  const dueProjectsCount = (state.opportunities || []).filter(o => o.stage !== 'WON' && o.stage !== 'LOST').length;
  const discussionsCount = (state.messages || []).length;
  const commentsCount = (state.customerNotes || []).length;

  const stuckTasks = myTasks.filter(t => t.status === 'OPEN' && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]).length;
  const inProgressTasks = myTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const inReviewTasks = myTasks.filter(t => t.status === 'OPEN' && (!t.dueDate || t.dueDate >= new Date().toISOString().split('T')[0])).length;
  const doneTasks = myTasks.filter(t => t.status === 'COMPLETED').length;
  const totalDonut = stuckTasks + inProgressTasks + inReviewTasks + doneTasks || 1;

  const oppStages = OPPORTUNITY_STAGES.filter(stage => stage.id !== 'LOST').map(stage => ({ label: stage.id === 'DISCOVERY' ? 'کشف نیاز' : stage.id === 'PROPOSAL' ? 'پیشنهاد' : stage.label.split(' (')[0], value: activeRecords(state.opportunities).filter(o => o.stage === stage.id).length }));

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = myTasks.filter(t => t.dueDate === todayStr && t.status !== 'COMPLETED');
  const churnPortfolio = evaluatePortfolioChurn(state);

  return (
    <div className="w-full space-y-5 px-1 py-1 sm:px-3 sm:py-3 pb-32 font-premium" dir="rtl">
      
      <PageToolbar
        title="داشبورد مدیریتی"
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="جستجو در وظایف، پروژه‌ها و گزارشات..."
        actions={
          <Button
            variant="secondary"
            icon={<Filter size={14} />}
            title="تغییر دوره زمانی فیلتر"
            onClick={() => {
              const periods = ['هفتگی', 'ماهانه', 'فصلی'];
              setFilterPeriod(periods[(periods.indexOf(filterPeriod) + 1) % periods.length]);
            }}
          >
            فیلتر ({filterPeriod})
          </Button>
        }
      />

      <DataSourceStatus 
        source="CRM" 
        sourceName="پایگاه عملیاتی و انبار داده‌های تحلیلی" 
        isAuthoritative={true}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="none" className="group rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 hover:border-primary/40 transition-all duration-200" onClick={() => navigate('/tasks')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
              <FileText size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono">وظایف</span>
          </div>
          <div className="text-2xl font-black text-ink font-mono">{recentTasksCount.toLocaleString('fa-IR')}</div>
          <div className="text-xs font-bold text-ink-soft mt-1">وظایف در جریان</div>
        </Card>

        <Card padding="none" className="group rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 hover:border-primary/40 transition-all duration-200" onClick={() => navigate('/opportunities')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
              <Hourglass size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono">فرصت‌ها</span>
          </div>
          <div className="text-2xl font-black text-ink font-mono">{dueProjectsCount.toLocaleString('fa-IR')}</div>
          <div className="text-xs font-bold text-ink-soft mt-1">فرصت‌های باز فروش</div>
        </Card>

        <Card padding="none" className="group rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 hover:border-primary/40 transition-all duration-200" onClick={() => navigate('/groups')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
              <MessageSquare size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono">چت</span>
          </div>
          <div className="text-2xl font-black text-ink font-mono">{discussionsCount.toLocaleString('fa-IR')}</div>
          <div className="text-xs font-bold text-ink-soft mt-1">گفتگوهای فعال</div>
        </Card>

        <Card padding="none" className="group rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 hover:border-primary/40 transition-all duration-200" onClick={() => navigate('/accounts')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
              <MessageCircle size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono">حساب‌ها</span>
          </div>
          <div className="text-2xl font-black text-ink font-mono">{commentsCount.toLocaleString('fa-IR')}</div>
          <div className="text-xs font-bold text-ink-soft mt-1">یادداشت و تعاملات</div>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-extrabold text-ink-soft uppercase tracking-wider">شاخص‌های بهره‌وری</h2>
          <div className="flex items-center gap-1 bg-surface-secondary/80 p-1 rounded-2xl border border-border/80 backdrop-blur-md">
            {(['هفتگی', 'ماهانه', 'فصلی'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setFilterPeriod(p)}
                className={`px-3 py-1 text-[11px] font-bold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
                  filterPeriod === p ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text-main'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card padding="none" className="rounded-[28px] p-6 lg:col-span-2 backdrop-blur-2xl bg-surface border border-border/70 shadow-sm text-ink">
            <h3 className="mb-4 text-xs font-extrabold text-ink">وضعیت وظایف من</h3>
            <DonutChart
              centerValue={String(doneTasks)}
              centerLabel="تکمیل‌شده"
              segments={[
                { label: 'معوق', value: stuckTasks, color: 'var(--color-chart-2)' },
                { label: 'در حال انجام', value: inProgressTasks, color: 'var(--color-chart-3)' },
                { label: 'باز', value: inReviewTasks, color: 'var(--color-chart-1)' },
                { label: 'انجام شده', value: doneTasks, color: 'var(--color-chart-5)' },
              ]}
            />
          </Card>
          <Card padding="none" className="flex flex-col items-center justify-center rounded-[28px] p-6 backdrop-blur-2xl bg-surface border border-border/70 shadow-sm text-ink">
            <h3 className="mb-2 self-start text-xs font-extrabold text-ink">نرخ تکمیل</h3>
            <GaugeChart value={doneTasks} max={myTasks.length} display={`${Math.round(myTasks.length ? (doneTasks / myTasks.length) * 100 : 0).toLocaleString('fa-IR')}٪`} label={`${doneTasks.toLocaleString('fa-IR')} از ${myTasks.length.toLocaleString('fa-IR')} وظیفه`} color="var(--color-chart-5)" />
          </Card>
        </div>
        {oppStages.some(x => x.value > 0) && (
          <Card padding="none" className="rounded-[28px] p-6 backdrop-blur-2xl bg-surface border border-border/70 shadow-sm text-ink">
            <h3 className="mb-4 text-xs font-extrabold text-ink">فرصت‌های فروش به تفکیک مرحله</h3>
            <FunnelChart stages={oppStages} />
          </Card>
        )}

        {/* هوش تحلیلی پیش‌بینی ریزش مشتریان (Customer Churn Prediction) */}
        <Card padding="none" className="rounded-[28px] p-5 sm:p-6 backdrop-blur-2xl bg-surface border border-border/75 shadow-sm text-ink">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-ink">پایش هوشمند و پیش‌بینی ریزش مشتریان (Churn Risk)</h3>
                <p className="text-[11px] text-ink-soft mt-0.5">تحلیل نرخ ریسک بر پایه الگوی خرید، کهنگی سفارشات و شکایات باز</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-center active:scale-95 transition-transform"
            >
              <span>مشاهده مشتریان</span>
              <ArrowLeft size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 transition-transform hover:scale-[1.02]">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block">ریزش بحرانی</span>
              <strong className="text-lg font-black font-mono text-rose-800 dark:text-rose-200 block mt-0.5">
                {churnPortfolio.criticalCount.toLocaleString('fa-IR')} <span className="text-[10px] font-normal font-sans">حساب</span>
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 transition-transform hover:scale-[1.02]">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">ریسک بالا</span>
              <strong className="text-lg font-black font-mono text-amber-800 dark:text-amber-200 block mt-0.5">
                {churnPortfolio.highCount.toLocaleString('fa-IR')} <span className="text-[10px] font-normal font-sans">حساب</span>
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 transition-transform hover:scale-[1.02]">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block">هشدار متوسط</span>
              <strong className="text-lg font-black font-mono text-blue-800 dark:text-blue-200 block mt-0.5">
                {churnPortfolio.mediumCount.toLocaleString('fa-IR')} <span className="text-[10px] font-normal font-sans">حساب</span>
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 transition-transform hover:scale-[1.02]">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">سالم / فعال</span>
              <strong className="text-lg font-black font-mono text-emerald-800 dark:text-emerald-200 block mt-0.5">
                {churnPortfolio.lowCount.toLocaleString('fa-IR')} <span className="text-[10px] font-normal font-sans">حساب</span>
              </strong>
            </div>
          </div>

          {churnPortfolio.atRiskAccounts.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-border/70">
              <span className="text-[11px] font-bold text-ink-soft block">مشتریان نیازمند مداخله و پیگیری فوری:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {churnPortfolio.atRiskAccounts.slice(0, 3).map(acc => (
                  <div
                    key={acc.accountId}
                    onClick={() => navigate(`/accounts/${acc.accountId}`)}
                    className="p-3 rounded-2xl bg-surface/90 border border-border/80 hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-2 active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-xs font-bold text-ink truncate">{acc.accountName}</strong>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black font-mono ${
                        acc.riskTier === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
                      }`}>
                        {acc.churnScore.toLocaleString('fa-IR')}٪
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-soft line-clamp-1">
                      {acc.reasons[0] || 'نیاز به پیگیری تجاری'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-extrabold text-ink-soft uppercase tracking-wider">وظایف امروز</h2>
          <button className="text-xs font-bold text-primary hover:underline cursor-pointer active:scale-95 transition-all" onClick={() => navigate('/tasks')}>
            مشاهده همه
          </button>
        </div>

        {todayTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {todayTasks.map(t => (
              <Card key={t.id} padding="none" className="rounded-[24px] p-5 backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-border/70 flex flex-col justify-between gap-4 cursor-pointer hover:border-primary/50 hover:shadow-card hover:-translate-y-1 active:scale-[0.98] transition-all duration-200" onClick={() => navigate('/tasks')}>
                <div>
                  <h3 className="text-xs font-extrabold text-ink leading-snug line-clamp-2">{t.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-ink-soft mt-3 font-medium">
                    <span className="flex items-center gap-1 font-mono"><Calendar size={12}/> {formatAppDate(t.dueDate, state.settings?.locale)}</span>
                  </div>
                </div>
                <div>
                  <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                    t.status === 'IN_PROGRESS'
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {t.status === 'IN_PROGRESS' ? 'در حال انجام' : 'باز'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-surface/80 backdrop-blur-md rounded-[24px] text-xs text-ink-soft border border-border/80 font-medium">
            وظیفه‌ای برای امروز ثبت نشده است.
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-ink">توصیه‌ها و تحلیل‌های مدیریتی</h2>
          {recommendations.slice(0, 3).map(r => (
            <div key={r.id} className="rounded-[24px] border-r-4 border-r-primary border border-border/75 bg-surface/85 backdrop-blur-xl p-4 shadow-subtle hover:-translate-y-0.5 hover:shadow-card transition-all duration-200">
              <strong className="block text-xs font-bold text-ink">{r.title}</strong>
              <p className="mt-1 text-[11px] leading-6 text-ink-soft">{r.reason}</p>
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-ink-soft">{r.proposedAction}</span>
                {r.actionPayload?.targetTab && (
                  <button
                    onClick={() => navigate(`/${r.actionPayload.targetTab}`)}
                    className="min-h-[36px] shrink-0 cursor-pointer rounded-xl border border-primary/30 bg-primary/10 px-3.5 text-xs font-bold text-primary active:scale-95 transition-all"
                  >
                    مشاهده
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
