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
  <section className={cn('glass anim-rise rounded-[40px] p-5', className)} style={{ ['--i' as any]: i }}>
    <div className="mb-4 flex items-center justify-between gap-3 px-1"><h2 className="text-sm font-extrabold text-ink">{title}</h2>{aside}</div>
    {children}
  </section>
);
const Pill = ({ tone, children }: { tone: 'good' | 'bad' | 'warn' | 'mute'; children: React.ReactNode }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold',
    tone === 'good' && 'bg-status-healthy/25 text-ink', tone === 'bad' && 'bg-coral text-white', tone === 'warn' && 'bg-status-warning/60 text-ink', tone === 'mute' && 'bg-ink/10 text-ink-soft')}>{children}</span>
);

function Kpi({ i, label, value, delta, hot, good }: { i: number; label: string; value: number; delta?: number | null; hot?: boolean; good?: boolean }) {
  const v = useCountUp(Math.abs(value));
  return (
    <div className="glass anim-rise relative overflow-hidden rounded-[28px] p-4" style={{ ['--i' as any]: i }}>
      <div className="text-[11px] font-medium text-ink-soft">{label}</div>
      <div className={cn('mt-1 text-[22px] font-extrabold leading-tight', hot ? 'text-coral' : good ? 'text-status-healthy' : 'text-ink')}>{value < 0 ? '−' : ''}{fCompact(v)}<span className="ms-1 text-[11px] font-medium text-ink-soft">ریال</span></div>
      {delta != null && isFinite(delta) && (
        <div className={cn('mt-1 flex items-center gap-1 text-[11px] font-bold', delta >= 0 ? 'text-status-healthy' : 'text-coral')}>
          {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{fNum(Math.abs(Math.round(delta)))}٪ نسبت به ۳۰ روز قبل
        </div>)}
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
      <div className="p-6" dir="rtl"><div className="glass mx-auto max-w-md rounded-[32px] p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 text-coral" /><h2 className="text-sm font-extrabold text-ink">دسترسی محدود</h2>
        <p className="mt-2 text-xs leading-6 text-ink-soft">مرکز فرماندهی شامل اطلاعات مالی و عملکرد پرسنل است و فقط برای نقش‌هایی با مجوز مشاهده امور مالی یا مدیریت کاربران فعال است.</p>
      </div></div>
    );
  }

  const net = ins.net30, plMax = Math.max(ins.sales30, ins.cogs30, ins.exp30, Math.abs(net), 1);
  const plRows = [
    { l: 'فروش (۳۰ روز)', v: ins.sales30, c: 'var(--color-chart-1)' }, { l: 'بهای تمام‌شده کالا', v: ins.cogs30, c: 'var(--color-chart-4)' },
    { l: 'سود ناخالص', v: ins.gross30, c: 'var(--color-chart-5)' }, { l: 'هزینه‌ها (حقوق، اجاره، حمل...)', v: ins.exp30, c: 'var(--color-chart-3)' },
    { l: net >= 0 ? 'سود خالص' : 'زیان خالص', v: Math.abs(net), c: net >= 0 ? 'var(--color-chart-5)' : 'var(--color-chart-2)' },
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
    <div className="space-y-5 p-4 sm:p-6" dir="rtl">
      <PageToolbar title="مرکز فرماندهی مدیریتی" subtitle="فروش، مطالبات، چک‌ها، نقدینگی، سود و زیان و عملکرد تیم — از داده‌های واقعی سامانه"
        actions={<DemoDataPanel state={state} updateState={updateState} canManage={canManage} />} />

      {!ins.hasData && (
        <div className="glass rounded-[32px] p-8 text-center text-xs leading-7 text-ink-soft">هنوز داده‌ای برای تحلیل ثبت نشده است. پس از ثبت پیش‌فاکتور، فاکتور، پرداخت و وظیفه، اینجا تصویر کامل شرکت را می‌بینید.</div>
      )}

      {/* هشدار نقدینگی */}
      <div className={cn('anim-rise relative overflow-hidden rounded-[32px] border p-5', danger ? 'border-coral/40 bg-coral/10' : 'border-status-healthy/40 bg-status-healthy/10')} style={{ ['--i' as any]: 0 }}>
        <div className="flex items-start gap-3">
          <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full text-white', danger ? 'anim-ring bg-coral' : 'bg-status-healthy')}>{danger ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}</span>
          <div className="min-w-0 text-xs leading-7 text-ink">
            <div className="text-sm font-extrabold">{danger ? `تا ۳ روز آینده حدود ${money(g3.gap)} کمبود نقدینگی داریم` : 'نقدینگی ۳ روز آینده از محل چک‌های دریافتی تأمین است'}</div>
            <div className="text-ink-soft">۳ روز آینده: خروجی {money(g3.outflow)} (چک پرداختی، فاکتور تأمین‌کننده، هزینه) در برابر ورودی قطعی {money(g3.inflow)} (چک‌های دریافتی).
              {g7.gap > 0 && <> تا ۷ روز آینده کمبود به {money(g7.gap)} می‌رسد.</>} <span className="opacity-80">موجودی حساب‌های بانکی در داده‌ها ثبت نشده و در این محاسبه نیست.</span></div>
          </div>
        </div>
      </div>

      {/* شاخص‌های اصلی */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi i={1} label="فروش ۳۰ روز اخیر" value={ins.sales30} delta={pct(ins.sales30, ins.salesPrev)} />
        <Kpi i={2} label="وصول ۳۰ روز اخیر" value={ins.collected30} delta={pct(ins.collected30, ins.collectedPrev)} />
        <Kpi i={3} label="مطالبات باز" value={ins.receivable} hot={ins.overdue > ins.receivable * 0.5} />
        <Kpi i={4} label={net >= 0 ? 'سود خالص ۳۰ روز' : 'زیان خالص ۳۰ روز'} value={net} good={net >= 0} hot={net < 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel i={5} title="نقدینگی ۱۴ روز آینده" aside={<div className="flex gap-3 text-[10px] text-ink-soft"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-chart-1" />ورودی</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-chart-2" />خروجی</span></div>}>
          <CashFlowChart days={ins.cashDays} />
        </Panel>
        <Panel i={6} title="سود و زیان (۳۰ روز)" aside={<Pill tone={net >= 0 ? 'good' : 'bad'}>{net >= 0 ? 'در سود' : 'در زیان'}</Pill>}>
          <div className="space-y-3">
            {plRows.map((r, k) => (
              <div key={r.l}>
                <div className="mb-1 flex justify-between text-[11px]"><span className="text-ink-soft">{r.l}</span><b className="font-mono text-ink">{money(r.v)}</b></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink/10"><i className="anim-grow-x block h-full rounded-full" style={{ width: `${Math.max((r.v / plMax) * 100, r.v ? 3 : 0)}%`, background: r.c, ['--i' as any]: k }} /></div>
              </div>))}
          </div>
          <div className="mt-4 border-t border-ink/10 pt-3"><div className="mb-1 text-[11px] text-ink-soft">روند سود/زیان خالص ۶ دوره ۳۰ روزه</div>
            <LineChart values={ins.trend.map(t => t.net)} labels={ins.trend.map(t => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short' }).format(t.date))} color={net >= 0 ? 'var(--color-chart-5)' : 'var(--color-chart-2)'} height={120} /></div>
        </Panel>
      </div>

      {/* عملکرد افراد */}
      <Panel i={7} title="عملکرد و سود/زیان هر فرد (۳۰ روز)" aside={<span className="text-[11px] text-ink-soft">سود ناخالص فروش منهای هزینه ماهانه فرد</span>}>
        {ins.people.length === 0 ? <p className="py-6 text-center text-xs text-ink-soft">فعالیتی از پرسنل ثبت نشده است.</p> : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {ins.people.map((p, k) => (
              <div key={p.id} className="anim-rise rounded-[28px] bg-card/70 p-4 shadow-soft" style={{ ['--i' as any]: k }}>
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} src={avatarOf(p.id)} size="lg" />
                  <div className="min-w-0 flex-1"><div className="truncate text-xs font-extrabold text-ink">{p.name}</div><div className="truncate text-[10px] text-ink-soft">{state.users.find(u => u.id === p.id)?.jobTitle || 'کاربر سامانه'}</div></div>
                  <Pill tone={p.verdict === 'PROFIT' ? 'good' : p.verdict === 'LOSS' ? 'bad' : 'mute'}>{p.verdict === 'PROFIT' ? 'سودده' : p.verdict === 'LOSS' ? 'زیان‌ده' : 'هزینه ثبت نشده'}</Pill>
                </div>
                <div className="mt-3"><AllocationBar segments={[{ label: 'تکمیل', value: p.tasksDone, color: 'var(--color-chart-5)' }, { label: 'باز', value: Math.max(p.tasksOpen - p.tasksOverdue, 0), color: 'var(--color-chart-1)' }, { label: 'معوق', value: p.tasksOverdue, color: 'var(--color-chart-2)' }]} caption={`وظایف: ${fNum(p.tasksDone)} تکمیل · ${fNum(p.tasksOpen - p.tasksOverdue)} باز · ${fNum(p.tasksOverdue)} معوق`} /></div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] text-ink-soft">
                  <div><b className="block text-sm text-ink">{fNum(p.visits)}</b>ویزیت</div><div><b className="block text-sm text-ink">{fNum(p.activities)}</b>فعالیت</div>
                  <div><b className="block text-sm text-ink">{fCompact(p.sales)}</b>فروش</div><div><b className="block text-sm text-ink">{fCompact(p.gross)}</b>سود ناخالص</div>
                </div>
                {p.net !== null && <div className={cn('mt-2 text-[11px] font-bold', p.net >= 0 ? 'text-status-healthy' : 'text-coral')}>{p.net >= 0 ? 'مازاد' : 'کسری'} نسبت به هزینه ماهانه: {money(p.net)}</div>}
              </div>))}
          </div>)}
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel i={8} title="چه کسی چه کاری کرد؟ (رویدادهای اخیر)">
          <ol className="relative space-y-3 border-s border-ink/10 ps-5">
            {ins.recent.length === 0 && <li className="text-xs text-ink-soft">رویدادی ثبت نشده است.</li>}
            {ins.recent.map((f, k) => (
              <li key={k} className="anim-rise relative flex items-start gap-2.5" style={{ ['--i' as any]: k }}>
                <span className="absolute -start-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-chart-1 ring-4 ring-card" />
                {f.actorId ? <Avatar name={ins.userName(f.actorId)} src={avatarOf(f.actorId)} size="sm" /> : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/10 text-ink-soft"><ArrowDownLeft size={14} /></span>}
                <div className="min-w-0 text-xs"><div className="text-ink"><b>{f.actorId ? ins.userName(f.actorId) : 'سیستم مالی'}</b> — {f.text}</div>
                  <div className="text-[10px] text-ink-soft">{formatAppDate(new Date(f.at).toISOString(), locale)} · {new Date(f.at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</div></div>
              </li>))}
          </ol>
        </Panel>
        <Panel i={9} title="نیازها و موانع امروز">
          <ul className="grid gap-2">
            {needs.map((n, k) => (
              <li key={n.l} className="anim-rise" style={{ ['--i' as any]: k }}>
                <button onClick={() => navigate(n.route)} className="flex w-full cursor-pointer items-center gap-3 rounded-full bg-card/70 p-2 pe-4 text-start shadow-soft transition hover:-translate-y-0.5">
                  <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full font-mono text-sm font-extrabold', n.v > 0 ? 'bg-coral text-white' : 'bg-status-healthy/30 text-ink')}>{n.v > 0 ? fNum(n.v) : '✓'}</span>
                  <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-ink">{n.l}</span><span className="block text-[10px] text-ink-soft">{n.v > 0 ? n.hint : 'مشکلی وجود ندارد'}</span></span>
                </button>
              </li>))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel i={10} title="کهنگی مطالبات">
          <DonutChart size={150} centerValue={fCompact(ins.receivable)} centerLabel="مطالبات باز" segments={ins.aging.map((a, k) => ({ label: a.label, value: a.value, color: ['var(--color-chart-1)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-2)', 'var(--color-danger)'][k] }))} />
          <div className="mt-4 border-t border-ink/10 pt-3"><div className="mb-2 text-[11px] font-bold text-ink-soft">بیشترین بدهکاران</div>
            <ul className="grid gap-1.5">{ins.topDebtors.map(d => (
              <li key={d.id}><button onClick={() => { updateState(s => { s.activeContextAccountId = d.id; }); navigate('/accounts'); }} className="flex w-full cursor-pointer items-center justify-between rounded-full px-3 py-1.5 text-xs transition hover:bg-ink/10"><span className="truncate text-ink">{d.name}</span><span className="font-mono text-ink-soft">{money(d.value)}{d.overdue > 0 && <b className="ms-2 text-coral">({money(d.overdue)} معوق)</b>}</span></button></li>))}</ul></div>
        </Panel>
        <Panel i={11} title="چک‌های دریافتی و پرداختی">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] bg-card/70 p-4"><div className="flex items-center gap-1 text-[11px] text-ink-soft"><ArrowDownLeft size={13} className="text-chart-1" />دریافتی در راه</div><div className="mt-1 text-lg font-extrabold text-ink">{money(ins.chequeStats.receivablePending)}</div><div className="text-[10px] text-coral">{ins.chequeStats.receivableBounced ? `برگشتی: ${money(ins.chequeStats.receivableBounced)}` : 'بدون برگشتی'}</div></div>
            <div className="rounded-[24px] bg-card/70 p-4"><div className="flex items-center gap-1 text-[11px] text-ink-soft"><ArrowUpRight size={13} className="text-coral" />پرداختی در راه</div><div className="mt-1 text-lg font-extrabold text-ink">{money(ins.chequeStats.payablePending)}</div><div className="text-[10px] text-coral">{ins.chequeStats.payableOverdue ? `سررسید گذشته: ${money(ins.chequeStats.payableOverdue)}` : 'بدون معوق'}</div></div>
          </div>
          <div className="mt-4 mb-2 text-[11px] font-bold text-ink-soft">نزدیک‌ترین سررسیدها</div>
          <ul className="grid gap-1.5">{ins.chequeStats.nextDue.length === 0 && <li className="text-xs text-ink-soft">چک سررسیدنشده‌ای ثبت نشده است.</li>}
            {ins.chequeStats.nextDue.map((c: any) => (
              <li key={c.id} className="flex items-center gap-2 rounded-full bg-card/70 px-3 py-2 text-xs shadow-soft">
                <span className={cn('grid h-7 w-7 place-items-center rounded-full text-white', c.dir === 'IN' ? 'bg-chart-1' : 'bg-coral')}>{c.dir === 'IN' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}</span>
                <span className="flex-1 truncate text-ink">{c.dir === 'IN' ? 'دریافت از' : 'پرداخت به'} {c.dir === 'IN' ? state.accounts.find(a => a.id === c.customerId)?.name : (state as any).suppliers?.find((s: any) => s.id === c.supplierId)?.name}</span>
                <b className="font-mono text-ink">{money(c.amount)}</b><span className="font-mono text-[10px] text-ink-soft">{formatAppDate(c.dueDate, locale)}</span>
              </li>))}</ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel i={12} title="وضعیت کالاها (۹۰ روز اخیر)">
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-xs">
            <thead><tr className="text-[11px] text-ink-soft">{['کالا', 'فروش', 'حاشیه سود', 'موجودی', 'پوشش', 'وضعیت'].map(h => <th key={h} className="px-2 pb-2 text-start font-medium">{h}</th>)}</tr></thead>
            <tbody>{ins.productStats.slice(0, 8).map(p => (
              <tr key={p.id} className="h-12 border-t border-ink/5"><td className="max-w-[190px] truncate px-2 font-bold text-ink">{p.name}</td><td className="px-2 font-mono text-ink">{fCompact(p.revenue)}</td>
                <td className="px-2"><span className={cn('font-bold', p.margin < 10 ? 'text-coral' : 'text-ink')}>{fNum(Math.round(p.margin))}٪</span></td>
                <td className="px-2 font-mono text-ink-soft">{p.stock === null ? '—' : fNum(p.stock)}</td><td className="px-2 font-mono text-ink-soft">{p.coverDays === null ? '—' : `${fNum(p.coverDays)} روز`}</td>
                <td className="px-2">{p.low ? <Pill tone="bad">کم‌موجودی</Pill> : <Pill tone="good">مناسب</Pill>}</td></tr>))}</tbody></table></div>
        </Panel>
        <Panel i={13} title="تأمین‌کنندگان">
          <ul className="grid gap-2">{ins.supplierStats.length === 0 && <li className="text-xs text-ink-soft">تأمین‌کننده‌ای ثبت نشده است.</li>}
            {ins.supplierStats.map(s => (
              <li key={s.id} className="rounded-[24px] bg-card/70 p-3 shadow-soft">
                <div className="flex items-center justify-between"><b className="truncate text-xs text-ink">{s.name}</b>{s.overdue > 0 ? <Pill tone="bad">معوق</Pill> : s.lowItems > 0 ? <Pill tone="warn">کالا کم است</Pill> : <Pill tone="good">عادی</Pill>}</div>
                <div className="mt-1.5 flex justify-between text-[10px] text-ink-soft"><span>بدهی باز: <b className="text-ink">{money(s.payable)}</b></span><span>سهم خرید: <b className="text-ink">{fNum(Math.round(s.share))}٪</b></span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10"><i className="anim-grow-x block h-full rounded-full bg-chart-1" style={{ width: `${Math.min(100, s.share)}%` }} /></div>
              </li>))}</ul>
        </Panel>
      </div>

      <Panel i={14} title="قیف فروش"><FunnelChart stages={ins.funnel} /></Panel>
    </div>
  );
}
