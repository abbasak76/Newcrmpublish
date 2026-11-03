import type { AppState } from '../types';

/** موتور تحلیل مدیریتی: همه شاخص‌ها فقط از داده‌های واقعی state محاسبه می‌شوند (هیچ مقدار ثابتی نیست). */
const DAY = 86400000;
const num = (x: any) => (typeof x === 'number' && isFinite(x) ? x : 0);
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const t = (s?: string) => (s ? new Date(s).getTime() : NaN);
const isWon = (s: string) => s === 'ACCEPTED' || s === 'APPROVED';

export interface PersonStat {
  id: string; name: string; tasksDone: number; tasksOpen: number; tasksOverdue: number; visits: number; activities: number;
  sales: number; gross: number; cost: number | null; net: number | null; verdict: 'PROFIT' | 'LOSS' | 'UNKNOWN';
}
export interface FeedItem { at: number; actorId?: string; text: string; kind: 'task' | 'activity' | 'payment' | 'quote' | 'visit' }
export interface CashDay { date: string; inflow: number; outflow: number }

export function computeInsights(state: AppState, now: Date = new Date()) {
  const nowMs = now.getTime(), todayISO = now.toISOString().split('T')[0];
  const within = (ms: number, from: number, to: number) => ms >= nowMs - from * DAY && ms < nowMs - to * DAY;
  const quotes = state.quotes || [], invoices = state.invoices || [], payments = state.payments || [], cheques = state.cheques || [];
  const tasks = state.tasks || [], activities = state.activities || [], visits = state.visits || [];
  const expenses: any[] = (state as any).expenses || [], bills: any[] = (state as any).supplierBills || [], suppliers: any[] = (state as any).suppliers || [];
  const users = state.users || [], products = state.externalProducts || [], accounts = state.accounts || [], opps = state.opportunities || [];
  const userName = (id?: string) => users.find(u => u.id === id)?.name || 'نامشخص';

  const lineCost = (q: any) => sum((q.lines || []).map((l: any) => num(l.costPrice) * num(l.quantity)));
  const wonIn = (from: number, to: number) => quotes.filter(q => isWon(q.status) && within(t(q.createdAt), from, to));

  /* فروش، وصول، سود و زیان */
  const won30 = wonIn(30, 0), wonPrev = wonIn(60, 30);
  const sales30 = sum(won30.map(q => num(q.totalAmount))), salesPrev = sum(wonPrev.map(q => num(q.totalAmount)));
  const cogs30 = sum(won30.map(lineCost)), gross30 = sales30 - cogs30;
  const expIn = (from: number, to: number) => sum(expenses.filter(e => within(t(e.date), from, to)).map(e => num(e.amount)));
  const exp30 = expIn(30, 0), net30 = gross30 - exp30;
  const collected30 = sum(payments.filter(p => p.status === 'CLEARED' && within(t(p.date), 30, 0)).map(p => num(p.amount)));
  const collectedPrev = sum(payments.filter(p => p.status === 'CLEARED' && within(t(p.date), 60, 30)).map(p => num(p.amount)));
  const trend = Array.from({ length: 6 }, (_, k) => {
    const from = 30 * (5 - k + 1), to = 30 * (5 - k);
    const rev = sum(wonIn(from, to).map(q => num(q.totalAmount))), cg = sum(wonIn(from, to).map(lineCost));
    return { date: new Date(nowMs - (from - 15) * DAY), revenue: rev, net: rev - cg - expIn(from, to) };
  });

  /* مطالبات و کهنگی */
  const open = invoices.filter(i => num(i.balance) > 0);
  const receivable = sum(open.map(i => i.balance)), overdueList = open.filter(i => i.dueDate && i.dueDate < todayISO);
  const overdue = sum(overdueList.map(i => i.balance));
  const bucket = (a: number, b: number) => sum(overdueList.filter(i => { const d = (nowMs - t(i.dueDate)) / DAY; return d > a && d <= b; }).map(i => i.balance));
  const aging = [
    { label: 'هنوز سررسید نشده', value: receivable - overdue }, { label: '۱ تا ۳۰ روز', value: bucket(0, 30) },
    { label: '۳۱ تا ۶۰ روز', value: bucket(30, 60) }, { label: '۶۱ تا ۹۰ روز', value: bucket(60, 90) }, { label: 'بیش از ۹۰ روز', value: bucket(90, 1e9) },
  ];
  const debtorMap = new Map<string, number>();
  open.forEach(i => debtorMap.set(i.customerId, (debtorMap.get(i.customerId) || 0) + i.balance));
  const topDebtors = [...debtorMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, v]) => ({ id, name: accounts.find(a => a.id === id)?.name || id, value: v, overdue: sum(overdueList.filter(i => i.customerId === id).map(i => i.balance)) }));

  /* چک‌ها */
  const live = (c: any) => c.status !== 'CLEARED' && c.status !== 'BOUNCED';
  const rec = cheques.filter(c => (c.direction || 'RECEIVABLE') === 'RECEIVABLE'), pay = cheques.filter(c => c.direction === 'PAYABLE');
  const dueIn = (list: any[], days: number) => sum(list.filter(c => live(c) && c.dueDate && c.dueDate <= new Date(nowMs + days * DAY).toISOString().split('T')[0]).map(c => num(c.amount)));
  const chequeStats = {
    receivablePending: sum(rec.filter(live).map(c => num(c.amount))), receivableBounced: sum(rec.filter(c => c.status === 'BOUNCED').map(c => num(c.amount))),
    payablePending: sum(pay.filter(live).map(c => num(c.amount))), payableOverdue: sum(pay.filter(c => live(c) && c.dueDate && c.dueDate < todayISO).map(c => num(c.amount))),
    counts: { rec: rec.length, pay: pay.length },
    nextDue: [...rec.map(c => ({ ...c, dir: 'IN' })), ...pay.map(c => ({ ...c, dir: 'OUT' }))].filter(c => live(c) && c.dueDate && c.dueDate >= todayISO).sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || ''))).slice(0, 6),
  };

  /* پیش‌بینی نقدینگی ۱۴ روز آینده (بدون احتساب موجودی بانکی؛ چون در داده‌ها ثبت نشده) */
  const cashDays: CashDay[] = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(nowMs + i * DAY).toISOString().split('T')[0];
    const first = i === 0;
    const hit = (d?: string) => !!d && (first ? d <= date : d === date);
    const inflow = sum(rec.filter(c => live(c) && hit(c.dueDate)).map(c => num(c.amount)));
    const chqBillIds = new Set(pay.map(c => c.billId));
    const outflow = sum(pay.filter(c => live(c) && hit(c.dueDate)).map(c => num(c.amount)))
      + sum(bills.filter(b => b.status !== 'PAID' && !chqBillIds.has(b.id) && hit(b.dueDate)).map(b => num(b.amount) - num(b.paidAmount)))
      + sum(expenses.filter(e => e.status === 'DUE' && hit(e.dueDate)).map(e => num(e.amount)));
    return { date, inflow, outflow };
  });
  const horizon = (n: number) => { const s = cashDays.slice(0, n); const i = sum(s.map(d => d.inflow)), o = sum(s.map(d => d.outflow)); return { inflow: i, outflow: o, gap: Math.max(0, o - i) }; };
  const cash = { h3: horizon(3), h7: horizon(7), h14: horizon(14) };

  /* عملکرد افراد */
  const people: PersonStat[] = users.map(u => {
    const myTasks = tasks.filter(x => (x.assigneeId || x.assignedTo) === u.id);
    const mySales = won30.filter(q => (q.createdBy || q.ownerId) === u.id);
    const sales = sum(mySales.map(q => num(q.totalAmount))), gross = sales - sum(mySales.map(lineCost));
    const cost = typeof u.monthlyCost === 'number' ? u.monthlyCost : null;
    const net = cost === null ? null : gross - cost;
    return {
      id: u.id, name: u.name,
      tasksDone: myTasks.filter(x => x.status === 'COMPLETED' && within(t(x.completedAt || x.createdAt), 30, 0)).length,
      tasksOpen: myTasks.filter(x => x.status !== 'COMPLETED').length,
      tasksOverdue: myTasks.filter(x => x.status !== 'COMPLETED' && x.dueDate && x.dueDate < todayISO).length,
      visits: visits.filter(v => v.repId === u.id && v.status === 'COMPLETED' && within(t(v.checkInAt || v.plannedAt), 30, 0)).length,
      activities: activities.filter(a => a.ownerId === u.id && within(t(a.dateTime), 30, 0)).length,
      sales, gross, cost, net, verdict: (net === null ? 'UNKNOWN' : net >= 0 ? 'PROFIT' : 'LOSS') as PersonStat['verdict'],
    };
  }).filter(p => p.tasksDone + p.tasksOpen + p.visits + p.activities + p.sales > 0).sort((a, b) => b.gross - a.gross || b.tasksDone - a.tasksDone);

  /* رویدادهای اخیر: چه کسی چه کاری کرد */
  const feed: FeedItem[] = [];
  tasks.filter(x => x.status === 'COMPLETED' && x.completedAt).forEach(x => feed.push({ at: t(x.completedAt), actorId: x.completedBy || x.assigneeId, text: `وظیفه «${x.title}» را تکمیل کرد`, kind: 'task' }));
  activities.filter(a => t(a.dateTime) <= nowMs).forEach(a => feed.push({ at: t(a.dateTime), actorId: a.ownerId, text: a.title, kind: 'activity' }));
  visits.filter(v => v.status === 'COMPLETED' && v.checkInAt).forEach(v => feed.push({ at: t(v.checkInAt), actorId: v.repId, text: `ویزیت ${accounts.find(a => a.id === v.accountId)?.name || ''} انجام شد`, kind: 'visit' }));
  payments.filter(p => p.status === 'CLEARED').forEach(p => feed.push({ at: t(p.date), text: `دریافت ${num(p.amount).toLocaleString('fa-IR')} ریال از ${accounts.find(a => a.id === p.accountId)?.name || ''}`, kind: 'payment' }));
  quotes.forEach(q => feed.push({ at: t(q.createdAt), actorId: q.createdBy || q.ownerId, text: `پیش‌فاکتور ${q.quoteNumber} صادر شد`, kind: 'quote' }));
  const recent = feed.filter(f => isFinite(f.at) && f.at <= nowMs).sort((a, b) => b.at - a.at).slice(0, 14);

  /* کالا و تأمین‌کننده */
  const won90 = quotes.filter(q => isWon(q.status) && within(t(q.createdAt), 90, 0));
  const productStats = products.map(p => {
    const lines = won90.flatMap(q => (q.lines || []).filter((l: any) => l.productId === p.id));
    const qty = sum(lines.map((l: any) => num(l.quantity))), revenue = sum(lines.map((l: any) => num(l.lineTotal)));
    const cost = sum(lines.map((l: any) => num(l.costPrice) * num(l.quantity)));
    const stock = typeof p.stock === 'number' ? p.stock : null, perDay = qty / 90;
    return { id: p.id, name: p.name, category: p.category, supplierId: p.supplierId, qty, revenue, margin: revenue ? ((revenue - cost) / revenue) * 100 : 0, stock, minStock: p.minStock ?? null,
      coverDays: stock !== null && perDay > 0 ? Math.round(stock / perDay) : null, low: stock !== null && p.minStock != null && stock <= p.minStock };
  }).sort((a, b) => b.revenue - a.revenue);
  const totalCost = sum(productStats.map(p => p.revenue * (1 - p.margin / 100))) || 1;
  const supplierStats = suppliers.map(s => {
    const mine = bills.filter(b => b.supplierId === s.id), unpaid = mine.filter(b => b.status !== 'PAID');
    const cost = sum(productStats.filter(p => p.supplierId === s.id).map(p => p.revenue * (1 - p.margin / 100)));
    return { id: s.id, name: s.name, payable: sum(unpaid.map(b => num(b.amount) - num(b.paidAmount))), overdue: sum(unpaid.filter(b => b.dueDate < todayISO).map(b => num(b.amount) - num(b.paidAmount))), share: (cost / totalCost) * 100, lowItems: productStats.filter(p => p.supplierId === s.id && p.low).length, nextDue: unpaid.map(b => b.dueDate).sort()[0] as string | undefined };
  }).sort((a, b) => b.payable - a.payable);

  /* نیازها و موانع */
  const lastTouch = new Map<string, number>();
  [...activities.map(a => [a.accountId, t(a.dateTime)] as const), ...visits.filter(v => v.status === 'COMPLETED').map(v => [v.accountId, t(v.checkInAt || v.plannedAt)] as const)].forEach(([id, ms]) => { if (id && isFinite(ms)) lastTouch.set(id, Math.max(lastTouch.get(id) || 0, ms)); });
  const needs = {
    overdueTasks: tasks.filter(x => x.status !== 'COMPLETED' && x.dueDate && x.dueDate < todayISO).length,
    untouchedCustomers: accounts.filter(a => (a.status || 'ACTIVE') === 'ACTIVE' && (lastTouch.get(a.id) || 0) < nowMs - 30 * DAY).length,
    overCredit: accounts.filter(a => num(a.creditLimit) > 0 && num(a.balance) > num(a.creditLimit)).length,
    staleOpps: opps.filter(o => o.stage !== 'WON' && o.stage !== 'LOST' && o.expectedCloseDate && o.expectedCloseDate < todayISO).length,
    lowStock: productStats.filter(p => p.low).length,
    bouncedCheques: rec.filter(c => c.status === 'BOUNCED').length,
  };
  const funnel = [
    { label: 'سرنخ‌ها', value: ((state as any).leads || []).length }, { label: 'فرصت‌های باز', value: opps.filter(o => o.stage !== 'WON' && o.stage !== 'LOST').length },
    { label: 'پیش‌فاکتور فعال', value: quotes.filter(q => q.status === 'SENT' || q.status === 'PENDING_APPROVAL').length }, { label: 'فروش قطعی', value: quotes.filter(q => isWon(q.status)).length },
  ];

  return { sales30, salesPrev, collected30, collectedPrev, receivable, overdue, aging, topDebtors, cogs30, gross30, exp30, net30, trend, chequeStats, cashDays, cash, people, recent, productStats, supplierStats, needs, funnel, userName, hasData: quotes.length + invoices.length + tasks.length > 0 };
}
export type Insights = ReturnType<typeof computeInsights>;
