import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowDownLeft, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { AppState } from '../types';
import { RBACService } from '../lib/rbac';
import { computeInsights } from '../lib/insights';
import { useCountUp } from '../hooks/useCountUp';
import { cn, formatAppDate } from '../lib/utils';
import { PageToolbar } from './ui/PageToolbar';
import { Avatar } from './ui/Avatar';
import { DemoDataPanel } from './DemoDataPanel';
import { DonutChart, LineChart, FunnelChart, AllocationBar, CashFlowChart } from './charts';
import { fCompact, fNum } from './charts/fmt';

interface Props { state: AppState; updateState: (u: (d: AppState) => AppState | void) => void }
const money = (n: number) => `${fCompact(Math.abs(n))} ریال`;

const Panel = ({ i = 0, title, aside, className, children }: { i?: number; title: string; aside?: React.ReactNode; className?: string; children: React.ReactNode }) => (
  <section className={cn('bg-surface border border-border rounded-3xl p-6 shadow-sm', className)} style={{ ['--i' as any]: i }}>
    <div className="mb-5 flex items-center justify-between gap-4 border-b border-border/60 pb-3">
      <h2 className="text-base font-extrabold text-text-main">{title}</h2>
      {aside}
    </div>
    {children}
  </section>
);

const Pill = ({ tone, children }: { tone: 'good' | 'bad' | 'warn' | 'mute'; children: React.ReactNode }) => (
  <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border',
    tone === 'good' && 'bg-success-soft text-success border-success-border', 
    tone === 'bad' && 'bg-danger-soft text-danger border-danger-border', 
    tone === 'warn' && 'bg-warning-soft text-warning border-warning-border', 
    tone === 'mute' && 'bg-canvas text-text-secondary border-border'
  )}>
    {children}
  </span>
);

function Kpi({ i, label, value, delta, hot, good }: { i: number; label: string; value: number; delta?: number | null; hot?: boolean; good?: boolean }) {
  const v = useCountUp(Math.abs(value));
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm transition-all hover:shadow-card hover:border-primary/30" style={{ ['--i' as any]: i }}>
      <div className="text-xs font-bold text-text-secondary">{label}</div>
      <div className={cn('mt-2 text-2xl font-black leading-tight tabular-nums', hot ? 'text-danger' : good ? 'text-success' : 'text-text-main')}>
        {value < 0 ? '−' : ''}{fCompact(v)}<span className="ms-1 text-[11px] font-medium text-text-secondary">ریال</span>
      </div>
      {delta != null && isFinite(delta) && (
        <div className={cn('mt-3 flex items-center gap-1 text-xs font-bold', delta >= 0 ? 'text-success' : 'text-danger')}>
          {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span className="tabular-nums">{fNum(Math.abs(Math.round(delta)))}٪</span> 
          <span className="text-text-secondary font-medium text-[10px]">نسبت به ۳۰ روز قبل</span>
        </div>
      )}
    </div>
  );
}

export function CommandCenterWorkspace({ state, updateState }: Props) {
  const navigate = useNavigate();
  const rbac = useMemo(() => new RBACService(state), [state]);
  const allowed = rbac.hasPermission('finance.view') || rbac.hasPermission('users.manage');
  const ins = useMemo(() => computeInsights(state), [state]);
  const locale = state.settings?.locale;
  const avatarOf = (id?: string) => state.users?.find(u => u.id === id)?.avatar;
  const pct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);
  const canManage = rbac.hasPermission('settings.manage') || rbac.hasPermission('users.manage');

  if (!allowed) {
    return (
      <div className="p-6" dir="rtl">
        <div className="bg-surface border border-border mx-auto max-w-md rounded-3xl p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto mb-4 text-danger" size={32} />
          <h2 className="text-base font-extrabold text-text-main">دسترسی محدود</h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">مرکز فرماندهی شامل اطلاعات مالی و عملکرد پرسنل است و فقط برای نقش‌هایی با مجوز مشاهده امور مالی یا مدیریت کاربران فعال است.</p>
        </div>
      </div>
    );
  }

  const net = ins.net30, plMax = Math.max(ins.sales30, ins.cogs30, ins.exp30, Math.abs(net), 1);
  const plRows = [
    { l: 'فروش (۳۰ روز)', v: ins.sales30, c: 'var(--c-primary)' }, 
    { l: 'بهای تمام‌شده کالا', v: ins.cogs30, c: 'var(--c-navy)' },
    { l: 'سود ناخالص', v: ins.gross30, c: 'var(--c-accent)' }, 
    { l: 'هزینه‌ها (حقوق، اجاره، حمل...)', v: ins.exp30, c: 'var(--c-text-muted)' },
    { l: net >= 0 ? 'سود خالص' : 'زیان خالص', v: Math.abs(net), c: net >= 0 ? 'var(--c-success)' : 'var(--c-danger)' },
  ];
  
  const needs: { l: string; v: number; route: string; hint: string }[] = [
    { l: 'وظایف معوق', v: ins.needs.overdueTasks, route: '/tasks', hint: 'موعد گذشته و تکمیل نشده' },
    { l: 'مشتریان بدون ارتباط ۳۰ روزه', v: ins.needs.untouchedCustomers, route: '/accounts', hint: 'نیاز به ویزیت یا تماس' },
    { l: 'عبور از سقف اعتبار', v: ins.needs.overCredit, route: '/accounts', hint: 'مانده بیش از اعتبار مجاز' },
    { l: 'فرصت‌های گذشته از موعد', v: ins.needs.staleOpps, route: '/opportunities', hint: 'تاریخ بستن گذشته است' },
    { l: 'کالاهای کم‌موجودی', v: ins.needs.lowStock, route: '/reports', hint: 'موجودی کمتر از حداقل' },
    { l: 'چک‌های برگشتی دریافتی', v: ins.needs.bouncedCheques, route: '/finance', hint: 'نیازمند پیگیری حقوقی/مالی' },
  ];
  
  const g3 = ins.cash.h3, g7 = ins.cash.h7;
  const danger = g3.gap > 0;

  return (
    <div className="space-y-5 p-2 sm:p-4 pb-24" dir="rtl">
      <PageToolbar 
        title="مرکز فرماندهی مدیریتی" 
        subtitle="فروش، مطالبات، چک‌ها، نقدینگی، سود و زیان و عملکرد تیم — از داده‌های واقعی سامانه"
        actions={<DemoDataPanel state={state} updateState={updateState} canManage={canManage} />} 
      />

      {!ins.hasData && (
        <div className="bg-surface border border-border rounded-3xl p-10 text-center text-sm leading-relaxed text-text-secondary shadow-sm">
          هنوز داده‌ای برای تحلیل ثبت نشده است. پس از ثبت پیش‌فاکتور، فاکتور، پرداخت و وظیفه، اینجا تصویر کامل شرکت را می‌بینید.
        </div>
      )}

      {/* هشدار نقدینگی */}
      <div className={cn('relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-sm', danger ? 'border-danger-border bg-danger-soft' : 'border-success-border bg-success-soft')} style={{ ['--i' as any]: 0 }}>
        <div className="flex items-start gap-4">
          <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-sm', danger ? 'bg-danger' : 'bg-success')}>
            {danger ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
          </span>
          <div className="min-w-0 text-sm leading-relaxed text-text-main">
            <div className="text-base font-black mb-1">
              {danger ? `تا ۳ روز آینده حدود ${money(g3.gap)} کمبود نقدینگی داریم` : 'نقدینگی ۳ روز آینده از محل چک‌های دریافتی تأمین است'}
            </div>
            <div className="text-text-secondary">
              ۳ روز آینده: خروجی <strong className="tabular-nums">{money(g3.outflow)}</strong> (چک پرداختی، فاکتور تأمین‌کننده، هزینه) در برابر ورودی قطعی <strong className="tabular-nums">{money(g3.inflow)}</strong> (چک‌های دریافتی).
              {g7.gap > 0 && <> تا ۷ روز آینده کمبود به <strong className="text-danger tabular-nums">{money(g7.gap)}</strong> می‌رسد.</>} 
              <span className="opacity-80 block mt-1 text-xs">موجودی حساب‌های بانکی در داده‌ها ثبت نشده و در این محاسبه نیست.</span>
            </div>
          </div>
        </div>
      </div>

      {/* شاخص‌های اصلی */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi i={1} label="فروش ۳۰ روز اخیر" value={ins.sales30} delta={pct(ins.sales30, ins.salesPrev)} />
        <Kpi i={2} label="وصول ۳۰ روز اخیر" value={ins.collected30} delta={pct(ins.collected30, ins.collectedPrev)} />
        <Kpi i={3} label="مطالبات باز" value={ins.receivable} hot={ins.overdue > ins.receivable * 0.5} />
        <Kpi i={4} label={net >= 0 ? 'سود خالص ۳۰ روز' : 'زیان خالص ۳۰ روز'} value={net} good={net >= 0} hot={net < 0} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel i={5} title="نقدینگی ۱۴ روز آینده" aside={<div className="flex gap-4 text-xs font-bold text-text-secondary"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[var(--c-primary)]" />ورودی</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[var(--c-danger)]" />خروجی</span></div>}>
          <CashFlowChart days={ins.cashDays} />
        </Panel>
        <Panel i={6} title="سود و زیان (۳۰ روز)" aside={<Pill tone={net >= 0 ? 'good' : 'bad'}>{net >= 0 ? 'در سود' : 'در زیان'}</Pill>}>
          <div className="space-y-4">
            {plRows.map((r, k) => (
              <div key={r.l}>
                <div className="mb-1.5 flex justify-between text-xs font-bold"><span className="text-text-secondary">{r.l}</span><b className="font-mono text-text-main">{money(r.v)}</b></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-canvas border border-border/50"><i className="block h-full rounded-full" style={{ width: `${Math.max((r.v / plMax) * 100, r.v ? 3 : 0)}%`, background: r.c, ['--i' as any]: k }} /></div>
              </div>))}
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <div className="mb-2 text-xs font-bold text-text-secondary">روند سود/زیان خالص ۶ دوره ۳۰ روزه</div>
            <LineChart values={ins.trend.map(t => t.net)} labels={ins.trend.map(t => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short' }).format(t.date))} color={net >= 0 ? 'var(--c-success)' : 'var(--c-danger)'} height={120} />
          </div>
        </Panel>
      </div>

      {/* عملکرد افراد */}
      <Panel i={7} title="عملکرد و سود/زیان هر فرد (۳۰ روز)" aside={<span className="text-xs font-medium text-text-secondary">سود ناخالص فروش منهای هزینه ماهانه فرد</span>}>
        {ins.people.length === 0 ? <p className="py-8 text-center text-sm text-text-secondary bg-canvas rounded-2xl border border-dashed border-border">فعالیتی از پرسنل ثبت نشده است.</p> : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {ins.people.map((p, k) => (
              <div key={p.id} className="rounded-2xl bg-canvas border border-border p-5 shadow-sm" style={{ ['--i' as any]: k }}>
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} src={avatarOf(p.id)} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-text-main">{p.name}</div>
                    <div className="truncate text-xs text-text-secondary mt-0.5">{state.users.find(u => u.id === p.id)?.jobTitle || 'کاربر سامانه'}</div>
                  </div>
                  <Pill tone={p.verdict === 'PROFIT' ? 'good' : p.verdict === 'LOSS' ? 'bad' : 'mute'}>{p.verdict === 'PROFIT' ? 'سودده' : p.verdict === 'LOSS' ? 'زیان‌ده' : 'هزینه ثبت نشده'}</Pill>
                </div>
                <div className="mt-4">
                  <AllocationBar segments={[{ label: 'تکمیل', value: p.tasksDone, color: 'var(--c-success)' }, { label: 'باز', value: Math.max(p.tasksOpen - p.tasksOverdue, 0), color: 'var(--c-primary)' }, { label: 'معوق', value: p.tasksOverdue, color: 'var(--c-danger)' }]} caption={`وظایف: ${fNum(p.tasksDone)} تکمیل · ${fNum(p.tasksOpen - p.tasksOverdue)} باز · ${fNum(p.tasksOverdue)} معوق`} />
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3 text-center text-xs text-text-secondary">
                  <div className="bg-surface rounded-lg py-2 border border-border"><b className="block text-sm font-black text-text-main mb-0.5 tabular-nums">{fNum(p.visits)}</b>ویزیت</div>
                  <div className="bg-surface rounded-lg py-2 border border-border"><b className="block text-sm font-black text-text-main mb-0.5 tabular-nums">{fNum(p.activities)}</b>فعالیت</div>
                  <div className="bg-surface rounded-lg py-2 border border-border"><b className="block text-sm font-black text-text-main mb-0.5 tabular-nums">{fCompact(p.sales)}</b>فروش</div>
                  <div className="bg-surface rounded-lg py-2 border border-border"><b className="block text-sm font-black text-text-main mb-0.5 tabular-nums">{fCompact(p.gross)}</b>سود ناخالص</div>
                </div>
                {p.net !== null && (
                  <div className={cn('mt-3 text-xs font-bold text-center p-2 rounded-lg border', p.net >= 0 ? 'bg-success-soft text-success border-success-border' : 'bg-danger-soft text-danger border-danger-border')}>
                    {p.net >= 0 ? 'مازاد' : 'کسری'} نسبت به هزینه ماهانه: {money(p.net)}
                  </div>
                )}
              </div>))}
          </div>)}
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel i={8} title="چه کسی چه کاری کرد؟ (رویدادهای اخیر)">
          <ol className="relative space-y-4 border-s-2 border-border ps-5 ms-2">
            {ins.recent.length === 0 && <li className="text-sm text-text-secondary py-4">رویدادی ثبت نشده است.</li>}
            {ins.recent.map((f, k) => (
              <li key={k} className="relative flex items-start gap-3" style={{ ['--i' as any]: k }}>
                <span className="absolute -start-[29px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-surface" />
                {f.actorId ? <Avatar name={ins.userName(f.actorId)} src={avatarOf(f.actorId)} size="sm" /> : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-canvas border border-border text-text-secondary"><ArrowDownLeft size={14} /></span>}
                <div className="min-w-0 text-sm">
                  <div className="text-text-main"><b className="font-extrabold">{f.actorId ? ins.userName(f.actorId) : 'سیستم مالی'}</b> — {f.text}</div>
                  <div className="text-xs text-text-secondary mt-1 font-mono">{formatAppDate(new Date(f.at).toISOString(), locale)} · {new Date(f.at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </li>))}
          </ol>
        </Panel>
        
        <Panel i={9} title="نیازها و موانع امروز">
          <ul className="grid gap-3">
            {needs.map((n, k) => (
              <li key={n.l} style={{ ['--i' as any]: k }}>
                <button onClick={() => navigate(n.route)} className="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-canvas border border-border p-3 text-start hover:border-primary/40 hover:shadow-sm transition-all active:scale-[0.98]">
                  <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-xl font-mono text-base font-black', n.v > 0 ? 'bg-danger-soft text-danger border border-danger-border' : 'bg-success-soft text-success border border-success-border')}>{n.v > 0 ? fNum(n.v) : '✓'}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-text-main">{n.l}</span><span className="block text-xs text-text-secondary mt-0.5">{n.v > 0 ? n.hint : 'مشکلی وجود ندارد'}</span></span>
                </button>
              </li>))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel i={10} title="کهنگی مطالبات">
          <div className="py-4">
            <DonutChart size={180} centerValue={fCompact(ins.receivable)} centerLabel="مطالبات باز" segments={ins.aging.map((a, k) => ({ label: a.label, value: a.value, color: ['var(--c-success)', 'var(--c-primary)', 'var(--c-accent)', 'var(--c-warning)', 'var(--c-danger)'][k] }))} />
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <div className="mb-3 text-xs font-bold text-text-secondary">بیشترین بدهکاران</div>
            <ul className="grid gap-2">
              {ins.topDebtors.map(d => (
                <li key={d.id}>
                  <button onClick={() => { updateState(s => { s.activeContextAccountId = d.id; }); navigate('/accounts'); }} className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-canvas border border-transparent hover:border-border">
                    <span className="truncate font-bold text-text-main">{d.name}</span>
                    <span className="font-mono font-bold text-text-secondary">{money(d.value)}{d.overdue > 0 && <b className="ms-2 text-danger">({money(d.overdue)} معوق)</b>}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        
        <Panel i={11} title="چک‌های دریافتی و پرداختی">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-canvas border border-border p-5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary mb-2"><ArrowDownLeft size={16} className="text-success" />دریافتی در راه</div>
              <div className="text-xl font-black text-text-main tabular-nums">{money(ins.chequeStats.receivablePending)}</div>
              <div className="mt-2 text-[11px] font-bold text-danger bg-danger-soft px-2 py-1 rounded-lg inline-block border border-danger-border">{ins.chequeStats.receivableBounced ? `برگشتی: ${money(ins.chequeStats.receivableBounced)}` : 'بدون برگشتی'}</div>
            </div>
            <div className="rounded-2xl bg-canvas border border-border p-5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary mb-2"><ArrowUpRight size={16} className="text-warning" />پرداختی در راه</div>
              <div className="text-xl font-black text-text-main tabular-nums">{money(ins.chequeStats.payablePending)}</div>
              <div className="mt-2 text-[11px] font-bold text-danger bg-danger-soft px-2 py-1 rounded-lg inline-block border border-danger-border">{ins.chequeStats.payableOverdue ? `سررسید گذشته: ${money(ins.chequeStats.payableOverdue)}` : 'بدون معوق'}</div>
            </div>
          </div>
          <div className="mt-6 mb-3 text-xs font-bold text-text-secondary">نزدیک‌ترین سررسیدها</div>
          <ul className="grid gap-2">
            {ins.chequeStats.nextDue.length === 0 && <li className="text-sm text-text-secondary bg-canvas p-4 rounded-xl border border-dashed border-border text-center">چک سررسیدنشده‌ای ثبت نشده است.</li>}
            {ins.chequeStats.nextDue.map((c: any) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl bg-canvas border border-border px-3 py-2.5 text-sm shadow-sm">
                <span className={cn('grid h-8 w-8 place-items-center rounded-lg text-white shadow-sm shrink-0', c.dir === 'IN' ? 'bg-success' : 'bg-warning')}>
                  {c.dir === 'IN' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </span>
                <span className="flex-1 truncate font-bold text-text-main">{c.dir === 'IN' ? 'دریافت از' : 'پرداخت به'} {c.dir === 'IN' ? state.accounts.find(a => a.id === c.customerId)?.name : (state as any).suppliers?.find((s: any) => s.id === c.supplierId)?.name}</span>
                <div className="text-left">
                  <b className="font-mono text-text-main block">{money(c.amount)}</b>
                  <span className="font-mono text-[10px] text-text-secondary block mt-0.5">{formatAppDate(c.dueDate, locale)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel i={12} title="وضعیت کالاها (۹۰ روز اخیر)">
          <div className="overflow-x-auto rounded-xl border border-border bg-canvas">
            <table className="w-full min-w-[600px] text-sm text-right">
              <thead className="bg-surface border-b border-border">
                <tr className="text-xs text-text-secondary font-bold">
                  {['کالا', 'فروش', 'حاشیه سود', 'موجودی', 'پوشش', 'وضعیت'].map(h => <th key={h} className="p-3">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ins.productStats.slice(0, 8).map(p => (
                  <tr key={p.id} className="hover:bg-surface transition-colors">
                    <td className="max-w-[200px] truncate p-3 font-bold text-text-main">{p.name}</td>
                    <td className="p-3 font-mono font-bold text-text-main">{fCompact(p.revenue)}</td>
                    <td className="p-3"><span className={cn('font-bold font-mono px-2 py-1 rounded-lg border', p.margin < 10 ? 'bg-danger-soft text-danger border-danger-border' : 'bg-success-soft text-success border-success-border')}>{fNum(Math.round(p.margin))}٪</span></td>
                    <td className="p-3 font-mono text-text-secondary">{p.stock === null ? '—' : fNum(p.stock)}</td>
                    <td className="p-3 font-mono text-text-secondary">{p.coverDays === null ? '—' : `${fNum(p.coverDays)} روز`}</td>
                    <td className="p-3">{p.low ? <Pill tone="bad">کم‌موجودی</Pill> : <Pill tone="good">مناسب</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        
        <Panel i={13} title="تأمین‌کنندگان">
          <ul className="grid gap-3">
            {ins.supplierStats.length === 0 && <li className="text-sm text-text-secondary bg-canvas p-6 rounded-2xl border border-dashed border-border text-center">تأمین‌کننده‌ای ثبت نشده است.</li>}
            {ins.supplierStats.map(s => (
              <li key={s.id} className="rounded-2xl bg-canvas border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <b className="truncate text-sm font-bold text-text-main">{s.name}</b>
                  {s.overdue > 0 ? <Pill tone="bad">معوق</Pill> : s.lowItems > 0 ? <Pill tone="warn">کالا کم است</Pill> : <Pill tone="good">عادی</Pill>}
                </div>
                <div className="flex justify-between text-xs font-bold text-text-secondary mb-2">
                  <span>بدهی باز: <b className="text-text-main font-mono">{money(s.payable)}</b></span>
                  <span>سهم خرید: <b className="text-text-main font-mono">{fNum(Math.round(s.share))}٪</b></span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface border border-border/50">
                  <i className="block h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, s.share)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel i={14} title="قیف فروش">
        <div className="py-4">
          <FunnelChart stages={ins.funnel} colors={['var(--c-primary-soft)', 'var(--c-primary)', 'var(--c-accent)', 'var(--c-success)']} />
        </div>
      </Panel>
    </div>
  );
}
