import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIAdvisorService } from '../services/aiAdvisorService';
import { AppState } from '../types';
import { Card } from './ui/Card';
import { FileText, Hourglass, MessageSquare, MessageCircle, Calendar, Filter } from 'lucide-react';
import { formatAppDate } from '../lib/utils';
import { DonutChart, GaugeChart, FunnelChart } from './charts';
import { PageToolbar } from './ui/PageToolbar';
import { Button } from './ui/Button';
import { OPPORTUNITY_STAGES } from '../config/pipeline';
import { activeRecords } from '../lib/recordLifecycle';

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm" className="glass shadow-subtle rounded-3xl cursor-pointer hover:shadow-card hover:border-primary/40 transition-all p-5" onClick={() => navigate('/tasks')}>
          <div className="w-10 h-10 rounded-2xl bg-ink/[.06] flex items-center justify-center text-ink-soft mb-3 ">
            <FileText size={18} />
          </div>
          <div className="text-xs font-extrabold text-ink leading-tight">وظایف من</div>
          <div className="text-[10px] text-ink-soft mt-1 font-mono font-medium">{recentTasksCount} وظیفه</div>
        </Card>

        <Card padding="sm" className="glass shadow-subtle rounded-3xl cursor-pointer hover:shadow-card hover:border-primary/40 transition-all p-5" onClick={() => navigate('/opportunities')}>
          <div className="w-10 h-10 rounded-2xl bg-ink/[.06] flex items-center justify-center text-ink-soft mb-3 ">
            <Hourglass size={18} />
          </div>
          <div className="text-xs font-extrabold text-ink leading-tight">فرصت‌های باز</div>
          <div className="text-[10px] text-ink-soft mt-1 font-mono font-medium">{dueProjectsCount} پروژه</div>
        </Card>

        <Card padding="sm" className="glass shadow-subtle rounded-3xl cursor-pointer hover:shadow-card hover:border-primary/40 transition-all p-5" onClick={() => navigate('/groups')}>
          <div className="w-10 h-10 rounded-2xl bg-ink/[.06] flex items-center justify-center text-ink-soft mb-3 ">
            <MessageSquare size={18} />
          </div>
          <div className="text-xs font-extrabold text-ink leading-tight">پیام‌ها</div>
          <div className="text-[10px] text-ink-soft mt-1 font-mono font-medium">{discussionsCount} پیام</div>
        </Card>

        <Card padding="sm" className="glass shadow-subtle rounded-3xl cursor-pointer hover:shadow-card hover:border-primary/40 transition-all p-5" onClick={() => navigate('/accounts')}>
          <div className="w-10 h-10 rounded-2xl bg-ink/[.06] flex items-center justify-center text-ink-soft mb-3 ">
            <MessageCircle size={18} />
          </div>
          <div className="text-xs font-extrabold text-ink leading-tight">یادداشت‌ها</div>
          <div className="text-[10px] text-ink-soft mt-1 font-mono font-medium">{commentsCount} مورد</div>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-extrabold text-ink-soft uppercase tracking-wider">شاخص‌های بهره‌وری</h2>
          <div className="relative">
            <select 
              value={filterPeriod} 
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="glass rounded-xl px-3 py-1.5 text-[11px] font-bold text-ink outline-none cursor-pointer shadow-subtle"
            >
              <option value="هفتگی">هفتگی ˅</option>
              <option value="ماهانه">ماهانه ˅</option>
              <option value="فصلی">فصلی ˅</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card padding="lg" className="glass rounded-[28px] p-6 lg:col-span-2">
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
          <Card padding="lg" className="glass flex flex-col items-center justify-center rounded-[28px] p-6">
            <h3 className="mb-2 self-start text-xs font-extrabold text-ink">نرخ تکمیل</h3>
            <GaugeChart value={doneTasks} max={myTasks.length} display={`${Math.round(myTasks.length ? (doneTasks / myTasks.length) * 100 : 0).toLocaleString('fa-IR')}٪`} label={`${doneTasks.toLocaleString('fa-IR')} از ${myTasks.length.toLocaleString('fa-IR')} وظیفه`} color="var(--color-chart-5)" />
          </Card>
        </div>
        {oppStages.some(x => x.value > 0) && (
          <Card padding="lg" className="glass rounded-[28px] p-6">
            <h3 className="mb-4 text-xs font-extrabold text-ink">فرصت‌های فروش به تفکیک مرحله</h3>
            <FunnelChart stages={oppStages} />
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-extrabold text-ink-soft uppercase tracking-wider">وظایف امروز</h2>
          <button className="text-xs font-bold text-primary hover:underline cursor-pointer transition-all" onClick={() => navigate('/tasks')}>
            مشاهده همه
          </button>
        </div>

        {todayTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {todayTasks.map(t => (
              <Card key={t.id} padding="md" className="glass rounded-3xl shadow-subtle flex flex-col justify-between gap-4 cursor-pointer hover:border-primary/50 hover:shadow-card transition-all p-5" onClick={() => navigate('/tasks')}>
                <div>
                  <h3 className="text-xs font-extrabold text-ink leading-snug line-clamp-2">{t.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-ink-soft mt-3 font-medium">
                    <span className="flex items-center gap-1 font-mono"><Calendar size={12}/> {formatAppDate(t.dueDate, state.settings?.locale)}</span>
                  </div>
                </div>
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-xl bg-ink/[.06] text-[10px] font-bold text-ink-soft ">
                    {t.status === 'IN_PROGRESS' ? 'در حال انجام' : 'باز'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-surface rounded-3xl shadow-subtle text-xs text-ink-soft border border-border/80 font-medium">
            وظیفه‌ای برای امروز ثبت نشده است.
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-ink">پیشنهادهای هوشمند</h2>
          {recommendations.slice(0, 3).map(r => (
            <div key={r.id} className="rounded-3xl border border-border/80 bg-surface p-4 shadow-subtle">
              <strong className="block text-xs font-bold text-ink">{r.title}</strong>
              <p className="mt-1 text-[11px] leading-6 text-ink-soft">{r.reason}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-ink-soft">{r.proposedAction}</span>
                {r.actionPayload?.targetTab && <button onClick={() => navigate(`/${r.actionPayload.targetTab}`)} className="min-h-[36px] shrink-0 cursor-pointer rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary">مشاهده</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
