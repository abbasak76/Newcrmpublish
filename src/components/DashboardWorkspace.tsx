import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIAdvisorService } from '../services/aiAdvisorService';
import { AppState } from '../types';
import { Card } from './ui/Card';
import { FileText, Hourglass, MessageSquare, MessageCircle, Calendar, Filter, AlertTriangle, ArrowLeft } from 'lucide-react';
import { cn, formatAppDate } from '../lib/utils';
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

  const oppStages = OPPORTUNITY_STAGES.filter(stage => stage.id !== 'LOST').map(stage => ({ label: stage.id === 'DISCOVERY' ? 'کشف نیاز' : stage.id === 'PROPOSAL' ? 'پیشنهاد' : stage.label.split(' (')[0], value: activeRecords(state.opportunities).filter(o => o.stage === stage.id).length }));

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = myTasks.filter(t => t.dueDate === todayStr && t.status !== 'COMPLETED');
  const churnPortfolio = evaluatePortfolioChurn(state);

  return (
    <div className="w-full space-y-5 px-2 py-2 sm:px-4 pb-24 font-sans" dir="rtl">
      
      <PageToolbar
        title="داشبورد تحلیلی"
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="جستجو در وظایف، پروژه‌ها و گزارشات..."
        actions={
          <Button
            variant="secondary"
            size="sm"
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
        <Card padding="md" className="group cursor-pointer hover:border-primary/40 transition-all duration-200" onClick={() => navigate('/tasks')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center transition-transform group-hover:scale-105 border border-primary/20">
              <FileText size={18} />
            </div>
            <span className="text-[10px] font-bold text-text-muted">وظایف</span>
          </div>
          <div className="text-2xl font-black text-text-main tabular-nums">{recentTasksCount.toLocaleString('fa-IR')}</div>
          <div className="text-xs font-bold text-text-secondary mt-1">وظایف در جریان</div>
        </Card>

        <Card padding="md" className="group cursor-pointer hover:border-primary/40 transition-all duration-200" onClick={() => navigate('/opportunities')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-warning-soft text-warning flex items-center justify-center transition-transform group-hover:scale-105 border border-warning-border">
              <Hourglass size={18} />
            </div>
            <span className="text-[10px] font-bold text-text-muted">فرصت‌ها</span>
          </div>
          <div className="text-2xl font-black text-text-main tabular-nums">{dueProjectsCount.toLocaleString('fa-IR')}</div>
          <div className="text-xs font-bold text-text-secondary mt-1">فرصت‌های باز فروش</div>
        </Card>

        <Card padding="md" className="group cursor-pointer hover:border-primary/40 transition-all duration-200" onClick={() => navigate('/groups')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-success-soft text-success flex items-center justify-center transition-transform group-hover:scale-105 border border-success-border">
              <MessageSquare size={18} />
            </div>
            <span className="text-[10px] font-bold text-text-muted">چت</span>
          </div>
          <div className="text-2xl font-black text-text-main tabular-nums">{discussionsCount.toLocaleString('fa-IR')}</div>
          <div className="text-xs font-bold text-text-secondary mt-1">گفتگوهای فعال</div>
        </Card>

        <Card padding="md" className="group cursor-pointer hover:border-primary/40 transition-all duration-200" onClick={() => navigate('/accounts')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-canvas text-text-secondary flex items-center justify-center transition-transform group-hover:scale-105 border border-border">
              <MessageCircle size={18} />
            </div>
            <span className="text-[10px] font-bold text-text-muted">حساب‌ها</span>
          </div>
          <div className="text-2xl font-black text-text-main tabular-nums">{commentsCount.toLocaleString('fa-IR')}</div>
          <div className="text-xs font-bold text-text-secondary mt-1">یادداشت و تعاملات</div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-extrabold text-text-main">شاخص‌های بهره‌وری</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card padding="lg" className="lg:col-span-2">
            <h3 className="mb-6 text-sm font-bold text-text-main">وضعیت وظایف من</h3>
            <DonutChart
              centerValue={String(doneTasks)}
              centerLabel="تکمیل‌شده"
              segments={[
                { label: 'معوق', value: stuckTasks, color: 'var(--c-danger)' },
                { label: 'در حال انجام', value: inProgressTasks, color: 'var(--c-primary)' },
                { label: 'باز', value: inReviewTasks, color: 'var(--c-text-muted)' },
                { label: 'انجام شده', value: doneTasks, color: 'var(--c-success)' },
              ]}
            />
          </Card>
          <Card padding="lg" className="flex flex-col items-center justify-center">
            <h3 className="mb-4 self-start text-sm font-bold text-text-main">نرخ تکمیل</h3>
            <GaugeChart 
              value={doneTasks} 
              max={myTasks.length} 
              display={`${Math.round(myTasks.length ? (doneTasks / myTasks.length) * 100 : 0).toLocaleString('fa-IR')}٪`} 
              label={`${doneTasks.toLocaleString('fa-IR')} از ${myTasks.length.toLocaleString('fa-IR')} وظیفه`} 
              color="var(--c-success)" 
            />
          </Card>
        </div>
        
        {oppStages.some(x => x.value > 0) && (
          <Card padding="lg">
            <h3 className="mb-6 text-sm font-bold text-text-main">فرصت‌های فروش به تفکیک مرحله</h3>
            <FunnelChart stages={oppStages} colors={['var(--c-primary-soft)', 'var(--c-primary)', 'var(--c-accent)', 'var(--c-success)']} />
          </Card>
        )}

        {/* هوش تحلیلی پیش‌بینی ریزش مشتریان (Customer Churn Prediction) */}
        <Card padding="lg" className="border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning-soft text-warning flex items-center justify-center shrink-0 border border-warning-border">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-text-main">پایش هوشمند و پیش‌بینی ریزش مشتریان (Churn Risk)</h3>
                <p className="text-xs text-text-secondary mt-1">تحلیل نرخ ریسک بر پایه الگوی خرید، کهنگی سفارشات و شکایات باز</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="text-xs font-bold text-primary hover:bg-primary-soft px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-colors border border-transparent hover:border-primary/20"
            >
              <span>مشاهده مشتریان</span>
              <ArrowLeft size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-4 rounded-xl bg-danger-soft border border-danger-border">
              <span className="text-xs font-bold text-danger block">ریزش بحرانی</span>
              <strong className="text-xl font-black tabular-nums text-danger block mt-1">
                {churnPortfolio.criticalCount.toLocaleString('fa-IR')} <span className="text-xs font-normal font-sans">حساب</span>
              </strong>
            </div>

            <div className="p-4 rounded-xl bg-warning-soft border border-warning-border">
              <span className="text-xs font-bold text-warning block">ریسک بالا</span>
              <strong className="text-xl font-black tabular-nums text-warning block mt-1">
                {churnPortfolio.highCount.toLocaleString('fa-IR')} <span className="text-xs font-normal font-sans">حساب</span>
              </strong>
            </div>

            <div className="p-4 rounded-xl bg-primary-soft border border-primary/20">
              <span className="text-xs font-bold text-primary block">هشدار متوسط</span>
              <strong className="text-xl font-black tabular-nums text-primary block mt-1">
                {churnPortfolio.mediumCount.toLocaleString('fa-IR')} <span className="text-xs font-normal font-sans">حساب</span>
              </strong>
            </div>

            <div className="p-4 rounded-xl bg-success-soft border border-success-border">
              <span className="text-xs font-bold text-success block">سالم / فعال</span>
              <strong className="text-xl font-black tabular-nums text-success block mt-1">
                {churnPortfolio.lowCount.toLocaleString('fa-IR')} <span className="text-xs font-normal font-sans">حساب</span>
              </strong>
            </div>
          </div>

          {churnPortfolio.atRiskAccounts.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <span className="text-xs font-bold text-text-secondary block">مشتریان نیازمند مداخله و پیگیری فوری:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {churnPortfolio.atRiskAccounts.slice(0, 3).map(acc => (
                  <div
                    key={acc.accountId}
                    onClick={() => navigate(`/accounts/${acc.accountId}`)}
                    className="p-4 rounded-xl bg-canvas border border-border hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-3 active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm font-bold text-text-main truncate">{acc.accountName}</strong>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums border",
                        acc.riskTier === 'CRITICAL' ? 'bg-danger-soft text-danger border-danger-border' : 'bg-warning-soft text-warning border-warning-border'
                      )}>
                        {acc.churnScore.toLocaleString('fa-IR')}٪
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-1">
                      {acc.reasons[0] || 'نیاز به پیگیری تجاری'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-extrabold text-text-main">وظایف امروز</h2>
          <button className="text-xs font-bold text-primary hover:bg-primary-soft px-3 py-1.5 rounded-lg cursor-pointer active:scale-95 transition-colors" onClick={() => navigate('/tasks')}>
            مشاهده همه
          </button>
        </div>

        {todayTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {todayTasks.map(t => (
              <Card key={t.id} padding="md" className="flex flex-col justify-between gap-4 cursor-pointer hover:border-primary/50 hover:shadow-card hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200" onClick={() => navigate('/tasks')}>
                <div>
                  <h3 className="text-sm font-bold text-text-main leading-snug line-clamp-2">{t.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-text-secondary mt-3 font-medium">
                    <Calendar size={14}/> <span className="tabular-nums">{formatAppDate(t.dueDate, state.settings?.locale)}</span>
                  </div>
                </div>
                <div>
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-lg text-[10px] font-bold border",
                    t.status === 'IN_PROGRESS'
                      ? 'bg-primary-soft text-primary border-primary/20'
                      : 'bg-canvas text-text-secondary border-border'
                  )}>
                    {t.status === 'IN_PROGRESS' ? 'در حال انجام' : 'باز'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-canvas rounded-2xl text-sm text-text-secondary border border-border font-medium">
            وظیفه‌ای برای امروز ثبت نشده است.
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-text-main px-1">توصیه‌ها و تحلیل‌های مدیریتی</h2>
          {recommendations.slice(0, 3).map(r => (
            <div key={r.id} className="rounded-2xl border-r-4 border-r-primary border border-border bg-surface p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-card transition-all duration-200">
              <strong className="block text-sm font-bold text-text-main">{r.title}</strong>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">{r.reason}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-text-secondary">{r.proposedAction}</span>
                {r.actionPayload?.targetTab && (
                  <button
                    onClick={() => navigate(`/${r.actionPayload.targetTab}`)}
                    className="min-h-[36px] shrink-0 cursor-pointer rounded-xl border border-primary/30 bg-primary-soft px-4 text-xs font-bold text-primary active:scale-95 transition-colors hover:bg-primary/10"
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
