import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeftRight, BadgeCheck, Boxes, ClipboardCheck, FileWarning, Gauge, Package, Plus, RefreshCw, ShieldCheck, ShoppingCart, Truck, Wallet } from 'lucide-react';
import { Card } from './ui/Card';
import { assessOrderRisk, calculateProfitability, buildOperationsMetrics, evaluateDispatchPlan, analyzeReturns } from '../lib/operationsEngine';
import { classifyInvoiceDistribution, evaluateOrderCpq } from '../lib/phase2Flow';
import { guard, requireActiveUser, useCan } from '../hooks/useCan';
import { InventoryTab, PurchasingTab, CreditTab, OperationsReportsTab } from './OperationsSupplementalTabs';
import { Button } from './ui/Button';
import { Badge, StatusBadge } from './ui/Badge';
import { Input } from './ui/Input';

interface Props { state: any; updateState: (updater: (draft: any) => void | Partial<any>) => void }
type Tab = 'overview' | 'orders' | 'dispatch' | 'returns' | 'policies' | 'inventory' | 'purchasing' | 'credit' | 'profitability' | 'reports' | 'reconciliation';
const TABS: Array<{id: Tab; label: string; icon: React.ElementType}> = [
  { id: 'overview', label: 'نمای کلی', icon: Gauge }, { id: 'orders', label: 'سفارش‌ها', icon: Package },
  { id: 'dispatch', label: 'پخش و ناوگان', icon: Truck }, { id: 'returns', label: 'برگشتی‌ها', icon: ArrowLeftRight },
  { id: 'policies', label: 'قوانین تجاری', icon: ShieldCheck }, { id: 'inventory', label: 'کالا و موجودی', icon: Boxes },
  { id: 'purchasing', label: 'خرید و تأمین', icon: ShoppingCart }, { id: 'credit', label: 'اعتبار مشتری', icon: ShieldCheck },
  { id: 'profitability', label: 'سودآوری', icon: Wallet }, { id: 'reports', label: 'گزارشات', icon: Gauge },
  { id: 'reconciliation', label: 'مغایرت‌ها', icon: ClipboardCheck },
];
const money = (n: number | null | undefined) => n == null ? 'نامشخص' : new Intl.NumberFormat('fa-IR').format(Math.round(n)) + ' ریال';
const shortMoney = (n: number) => new Intl.NumberFormat('fa-IR', { notation: 'compact', maximumFractionDigits: 1 }).format(n) + ' ریال';
const label = (s: string) => ({ DRAFT: 'پیش‌نویس', PENDING_APPROVAL: 'در انتظار تأیید', APPROVED: 'تأییدشده', RELEASED: 'آماده پخش', IN_TRANSIT: 'در مسیر', DELIVERED: 'تحویل‌شده', CANCELLED: 'لغوشده', OPEN: 'باز', INVESTIGATING: 'در حال بررسی', RESOLVED: 'رسیدگی‌شده', ACTIVE: 'فعال', BLOCKING: 'مسدودکننده', WARNING: 'هشدار', RETURNED: 'برگشتی', PARTIAL: 'تحویل ناقص' } as Record<string,string>)[s] || s;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

function audit(draft: any, action: string, entityType: string, entityId: string, details: string) {
  if (!Array.isArray(draft.auditLogs)) draft.auditLogs = [];
  draft.auditLogs.push({ id: nextId('audit'), action, entityType, entityId, details, actor: draft.currentUserId || 'unknown', createdAt: new Date().toISOString() });
  if (draft.auditLogs.length > 1000) draft.auditLogs = draft.auditLogs.slice(-1000);
}

export function OperationsControlWorkspace({ state, updateState }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [dispatchName, setDispatchName] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('');
  const [distributionOutputNumber, setDistributionOutputNumber] = useState('');
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnReasonCode, setReturnReasonCode] = useState('CUSTOMER_REJECTED');
  const [returnDueDate, setReturnDueDate] = useState('');
  const [returnAssignee, setReturnAssignee] = useState('');
  const [policyName, setPolicyName] = useState('');
  const [policyType, setPolicyType] = useState('NO_CREDIT');
  const [policyScope, setPolicyScope] = useState('CUSTOMER');
  const [policyValue, setPolicyValue] = useState('');

  const { can, canOn } = useCan(state, updateState);
  const ordersAll: any[] = state.salesOrders || [];
  const orders: any[] = ordersAll.filter(o => { const rec = { ownerId: o.ownerId, branchId: o.branchId, territoryId: o.territoryId, teamId: o.teamId, tenantId: o.tenantId }; return can('quotes','VIEW') ? canOn('quotes','VIEW',rec) : canOn('finance','VIEW',rec); });
  const dispatchPlansAll: any[] = state.dispatchPlans || [];
  const dispatchPlans: any[] = dispatchPlansAll.filter(p => { const rec = { ownerId: p.createdBy, branchId: p.branchId, territoryId: p.territoryId, teamId: p.teamId, tenantId: p.tenantId }; return can('internal','VIEW') ? canOn('internal','VIEW',rec) : canOn('finance','VIEW',rec); });
  const returnsAll: any[] = state.salesReturns || [];
  const returns: any[] = returnsAll.filter(r => can('finance', 'VIEW') || orders.some(o => o.id === r.orderId));
  const policies: any[] = state.commercialPolicies || [];
  const casesAll: any[] = state.reconciliationCases || [];
  const cases: any[] = casesAll.filter(c => can('finance', 'VIEW') || c.assignedTo === state.currentUserId || orders.some(o => o.id === c.relatedEntityId));
  const customersAll: any[] = state.accounts || state.customers || [];
  const customers: any[] = customersAll.filter(c => { const rec = { ownerId: c.ownerId, branchId: c.branchId, territoryId: c.territoryId, teamId: c.teamId, tenantId: c.tenantId }; return can('accounts','VIEW') ? canOn('accounts','VIEW',rec) : canOn('finance','VIEW',rec); });
  const products: any[] = state.externalProducts || [];
  const invoicesAll: any[] = state.invoices || [];
  const invoices: any[] = can('finance', 'VIEW') ? invoicesAll.filter(i => { const c=customersAll.find(x=>x.id===i.customerId); return !!c && canOn('finance','VIEW',{ownerId:c.ownerId,branchId:c.branchId,territoryId:c.territoryId,teamId:c.teamId,tenantId:c.tenantId}); }) : invoicesAll.filter(i => customers.some(c => c.id === i.customerId));
  const payments: any[] = can('finance', 'VIEW') ? (state.payments || []).filter(p=>{const c=customersAll.find(x=>x.id===p.customerId);return !!c&&canOn('finance','VIEW',{ownerId:c.ownerId,branchId:c.branchId,territoryId:c.territoryId,teamId:c.teamId,tenantId:c.tenantId});}) : [];  
  const currentUser = state.users?.find((u: any) => u.id === state.currentUserId);
  const visibleTabs = TABS.filter(t => {
    if (t.id === 'policies') return can('settings', 'VIEW');
    if (t.id === 'purchasing') return can('internal', 'EDIT');
    if (t.id === 'credit' || t.id === 'returns') return can('finance', 'VIEW');
    if (t.id === 'dispatch') return can('internal', 'VIEW');
    if (t.id === 'inventory' || t.id === 'orders') return can('quotes', 'VIEW') || can('finance', 'VIEW');
    if (t.id === 'profitability') return can('finance', 'VIEW') || can('internal', 'VIEW');
    if (t.id === 'reports') return can('reports', 'VIEW');
    if (t.id === 'reconciliation') return can('cases', 'VIEW') || can('finance', 'VIEW');
    return true;
  });
  const filteredOrders = useMemo(() => orders.filter(o => `${o.orderNumber} ${customers.find(c => c.id === o.customerId)?.name || ''} ${o.status}`.toLowerCase().includes(search.toLowerCase())), [orders, customers, search]);
  const totalOrderValue = orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const totalReturns = returns.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const activeOrders = orders.filter(o => o.status !== 'CANCELLED');
  const costCoverage = activeOrders.length ? activeOrders.filter(o => o.costKnown === true).length / activeOrders.length : 0;
  const openCases = cases.filter(c => c.status !== 'RESOLVED').length;
  const activeDispatch = dispatchPlans.filter(p => !['DELIVERED','CANCELLED'].includes(p.status)).length;
  const profitability = calculateProfitability({ invoices, returns, payments, orders, dispatchPlans, expenses: state.expenses || [] });
  const metrics = buildOperationsMetrics({ orders, invoices, returns, dispatchPlans, payments });
  const actualNetSales = profitability.netSales;

  const changeOrderStatus = (order: any, status: string) => {
    const action = ['APPROVED','CANCELLED'].includes(status) ? 'APPROVE' : 'EDIT';
    if (!guard(state, updateState, 'quotes', action, 'تغییر وضعیت سفارش')) return;
    if (status === 'APPROVED') {
      const cpq = evaluateOrderCpq(order, products);
      if (!cpq.ok) { updateState(draft => { draft.notifications = [...(draft.notifications || []), { id: nextId('notif'), title: 'تأیید سفارش متوقف شد؛ کنترل CPQ ناموفق', message: cpq.reasons.join('؛ '), type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'operations_control', entityId: order.id }]; audit(draft, 'CPQ_VALIDATION_BLOCKED', 'SalesOrder', order.id, cpq.reasons.join('; ')); }); return; }
      const customer = customers.find(c => c.id === order.customerId);
      const blockingSignals = assessOrderRisk({ order, customer, orders, policies, invoices, returns }).filter(signal => signal.blocking);
      if (blockingSignals.length) {
        updateState(draft => { draft.notifications = [...(draft.notifications || []), { id: nextId('notif'), title: 'تأیید سفارش مسدود شد', message: blockingSignals.map(x => `${x.title}: ${x.reason}`).join('؛ '), type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'operations_control', entityId: order.id }]; audit(draft, 'APPROVAL_BLOCKED', 'SalesOrder', order.id, blockingSignals.map(x => x.code).join(', ')); });
        return;
      }
    }
    updateState(draft => {
    const target = (draft.salesOrders || []).find((o: any) => o.id === order.id);
    if (!target) return;
    const previous = target.status; target.status = status; target.updatedAt = new Date().toISOString();
    if (status === 'APPROVED') { target.cpqSnapshot = evaluateOrderCpq(target, products); target.cpqEvaluatedAt = target.cpqSnapshot.evaluatedAt; target.cpqStatus = target.cpqSnapshot.ok ? 'EVALUATED' : 'BLOCKED'; }
    audit(draft, 'STATUS_CHANGED', 'SalesOrder', target.id, `وضعیت از ${previous} به ${status} تغییر کرد؛ محیط آزمایشی محلی`);
    if (status === 'PENDING_APPROVAL') {
      draft.notifications = [...(draft.notifications || []), { id: nextId('notif'), title: 'سفارش نیازمند تأیید', message: `سفارش ${target.orderNumber} برای بررسی ارسال شد.`, type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'operations_control', entityId: target.id }];
    }
    });
  };

  const createOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guard(state, updateState, 'quotes', 'CREATE', 'ثبت سفارش آزمایشی') || !requireActiveUser(state, updateState, 'ثبت سفارش آزمایشی')) return;
    const customer = customers.find(c => c.id === customerId);
    const product = products.find(p => p.id === productId);
    const qty = Number(quantity);
    if (!customer || !product || !Number.isFinite(qty) || qty <= 0) return;
    const price = Number(product.unitPrice ?? product.basePrice ?? 0);
    if (!Number.isFinite(price) || price <= 0) return;
    const cost = Number(product.costPrice);
    const weightKg = Number.isFinite(Number(product.weightKgPerUnit)) && Number(product.weightKgPerUnit) > 0 ? qty * Number(product.weightKgPerUnit) : null;
    const order = { id: nextId('ord'), orderNumber: `TEST-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4,'0')}`, customerId, ownerId: currentUser?.id, status: 'DRAFT', currency: 'IRR', totalAmount: qty * price, costAmount: Number.isFinite(cost) && cost > 0 ? qty * cost : null, costKnown: Number.isFinite(cost) && cost > 0, weightKg, weightSource: weightKg === null ? 'UNKNOWN' : 'TEST_SEED_ESTIMATE', zone: customer.zone || customer.territoryId || null, lines: [{ id: nextId('line'), productId, productName: product.name, productGroupId: product.category, quantity: qty, unitPrice: price, costPrice: Number.isFinite(cost) && cost > 0 ? cost : null, lineTotal: qty * price, weightKg }], notes: orderNote, source: 'LOCAL_TEST', externalReference: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), branchId: currentUser?.branchId, tenantId: currentUser?.tenantId };
    updateState(draft => { draft.salesOrders = [...(draft.salesOrders || []), order]; audit(draft, 'CREATED', 'SalesOrder', order.id, 'سفارش آزمایشی محلی ایجاد شد؛ هیچ سفارش ERP ارسال نشده است'); });
    setQuantity(''); setOrderNote(''); setTab('orders');
  };

  const createDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guard(state, updateState, 'internal', 'EDIT', 'ایجاد برنامه پخش') || !requireActiveUser(state, updateState, 'ایجاد برنامه پخش')) return;
    const capacity = Number(vehicleCapacity);
    if (!dispatchName.trim() || !Number.isFinite(capacity) || capacity <= 0) return;
    const plan = { id: nextId('dispatch'), planNumber: `DP-TEST-${dispatchPlans.length + 1}`, name: dispatchName.trim(), vehicleLabel: dispatchName.trim(), capacityKg: capacity, plannedWeightKg: null, zone: 'UNASSIGNED', orderIds: [], invoiceIds: [], distributionOutputNumber: distributionOutputNumber.trim() || null, status: 'DRAFT', source: 'LOCAL_TEST', createdBy: currentUser?.id, createdAt: new Date().toISOString() };
    updateState(draft => { draft.dispatchPlans = [...(draft.dispatchPlans || []), plan]; audit(draft, 'CREATED', 'DispatchPlan', plan.id, 'برنامه پخش آزمایشی ایجاد شد؛ تخصیص خودرو یا ارسال واقعی انجام نشده است'); });
    setDispatchName(''); setVehicleCapacity(''); setDistributionOutputNumber('');
  };

  const assignOrderToDispatch = (plan: any, order: any) => {
    if (!guard(state, updateState, 'internal', 'EDIT', 'تخصیص سفارش به برنامه پخش')) return;
    const customer = customers.find(c => c.id === order.customerId);
    const blockingSignals = assessOrderRisk({ order, customer, orders, policies, invoices, returns }).filter(signal => signal.blocking);
    if (blockingSignals.length) { updateState(draft => { draft.notifications = [...(draft.notifications || []), { id: nextId('notif'), title: 'تخصیص به پخش مسدود شد', message: blockingSignals.map(x => `${x.title}: ${x.reason}`).join('؛ '), type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'operations_control', entityId: order.id }]; audit(draft, 'DISPATCH_BLOCKED', 'SalesOrder', order.id, blockingSignals.map(x => x.code).join(', ')); }); return; }
    updateState(draft => {
    const p = (draft.dispatchPlans || []).find((x: any) => x.id === plan.id);
    const o = (draft.salesOrders || []).find((x: any) => x.id === order.id);
    if (!p || !o || (p.orderIds || []).includes(o.id)) return;
    p.orderIds = [...(p.orderIds || []), o.id]; const weight = Number(o.weightKg); p.plannedWeightKg = Number.isFinite(weight) && weight > 0 ? (Number.isFinite(Number(p.plannedWeightKg)) ? Number(p.plannedWeightKg) + weight : weight) : null;
    o.dispatchPlanId = p.id; o.status = 'RELEASED';
    audit(draft, 'ORDER_ASSIGNED', 'DispatchPlan', p.id, `سفارش ${o.orderNumber} به برنامه آزمایشی ${p.planNumber} تخصیص یافت`);
    });
  };

  const assignInvoiceToDispatch = (plan: any, invoice: any) => {
    if (!guard(state, updateState, 'internal', 'EDIT', 'اتصال فاکتور به برنامه پخش')) return;
    if (!String(plan.distributionOutputNumber || '').trim()) {
      updateState(draft => { draft.notifications = [...(draft.notifications || []), { id: nextId('notif'), title: 'شماره خروجی توزیع لازم است', message: 'تا وقتی شماره خروجی معتبر ثبت نشده، اتصال فاکتور به برنامه به معنی ورود قطعی به پخش نیست.', type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'operations_control', entityId: plan.id }]; });
      return;
    }
    const alreadyAssigned = dispatchPlans.some(p => p.id !== plan.id && (p.invoiceIds || []).includes(invoice.id) && String(p.distributionOutputNumber || '').trim());
    if (alreadyAssigned) {
      updateState(draft => { draft.notifications = [...(draft.notifications || []), { id: nextId('notif'), title: 'فاکتور قبلاً به پخش متصل است', message: 'فاکتور ' + (invoice.invoiceNumber || invoice.id) + ' در برنامه دیگری با شماره خروجی ثبت شده است.', type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'operations_control', entityId: invoice.id }]; });
      return;
    }
    updateState(draft => {
      const p = (draft.dispatchPlans || []).find((x: any) => x.id === plan.id);
      const i = (draft.invoices || []).find((x: any) => x.id === invoice.id);
      if (!p || !i) return;
      p.invoiceIds = [...new Set([...(p.invoiceIds || []), i.id])];
      audit(draft, 'INVOICE_LINKED_TO_DISPATCH', 'DispatchPlan', p.id, 'فاکتور ' + (i.invoiceNumber || i.id) + ' به برنامه متصل شد؛ خروجی توزیع ' + p.distributionOutputNumber + '؛ وضعیت ERP تغییر نکرد');
    });
  };

  const createReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guard(state, updateState, 'finance', 'CREATE', 'ثبت برگشتی و پرونده مالی') || !requireActiveUser(state, updateState, 'ثبت برگشتی')) return;
    const order = orders.find(o => o.id === returnOrderId);
    const amount = Number(returnAmount);
    if (!order || !Number.isFinite(amount) || amount <= 0 || !returnReason.trim() || !returnDueDate || !returnAssignee) return;
    const ret = { id: nextId('ret'), returnNumber: `RET-TEST-${returns.length + 1}`, orderId: order.id, invoiceId: null, customerId: order.customerId, amount, reason: returnReason.trim(), reasonCode: returnReasonCode, status: 'OPEN', source: 'LOCAL_TEST', financialDocumentConfirmed: false, createdBy: currentUser?.id, createdAt: new Date().toISOString() };
    updateState(draft => { draft.salesReturns = [...(draft.salesReturns || []), ret]; draft.reconciliationCases = [...(draft.reconciliationCases || []), { id: nextId('case'), caseNumber: `REC-TEST-${(draft.reconciliationCases || []).length + 1}`, type: 'RETURN_REVIEW', title: `بررسی برگشت ${ret.returnNumber}`, relatedEntityType: 'SalesReturn', relatedEntityId: ret.id, reason: 'برگشت ثبت شده اما سند مالی معتبر هنوز متصل نشده است.', status: 'OPEN', severity: 'MEDIUM', assignedTo: returnAssignee, dueDate: returnDueDate, createdAt: new Date().toISOString() }]; draft.tasks = [...(draft.tasks || []), { id: nextId('task'), title: `بررسی برگشتی ${ret.returnNumber}`, description: `بررسی علت «${ret.reason}» و اتصال سند مالی معتبر؛ مانده را بدون سند تغییر ندهید.`, relatedEntityType: 'SalesReturn', relatedEntityId: ret.id, accountId: ret.customerId, customerId: ret.customerId, status: 'PENDING', priority: 'HIGH', dueDate: returnDueDate, assigneeType: 'USER', assigneeId: returnAssignee, assignedTo: returnAssignee, createdAt: new Date().toISOString(), source: 'LOCAL_TEST' }]; audit(draft, 'CREATED', 'SalesReturn', ret.id, 'برگشت آزمایشی ثبت شد؛ مانده مالی تغییر نکرده است؛ تسک و مهلت رسیدگی ایجاد شد'); });
    setReturnOrderId(''); setReturnAmount(''); setReturnReason(''); setReturnReasonCode('CUSTOMER_REJECTED'); setReturnDueDate(''); setReturnAssignee(''); setTab('returns');
  };

  const createPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guard(state, updateState, 'settings', 'EDIT', 'تعریف سیاست تجاری') || !requireActiveUser(state, updateState, 'تعریف سیاست تجاری')) return;
    if (!policyName.trim()) return;
    const policy = { id: nextId('policy'), name: policyName.trim(), type: policyType, scope: policyScope, value: policyValue.trim() || null, enabled: true, enforcement: 'CRM_TEST_ONLY', createdBy: currentUser?.id, createdAt: new Date().toISOString() };
    updateState(draft => { draft.commercialPolicies = [...(draft.commercialPolicies || []), policy]; audit(draft, 'CREATED', 'CommercialPolicy', policy.id, 'قانون آزمایشی محلی تعریف شد؛ به ERP متصل نیست'); });
    setPolicyName(''); setPolicyValue('');
  };

  const setPolicyEnabled = (policy: any, enabled: boolean) => {
    if (!guard(state, updateState, 'settings', 'EDIT', 'تغییر وضعیت سیاست تجاری')) return;
    updateState(draft => {
    const p = (draft.commercialPolicies || []).find((x: any) => x.id === policy.id); if (!p) return;
    p.enabled = enabled; p.updatedAt = new Date().toISOString(); audit(draft, enabled ? 'ENABLED' : 'DISABLED', 'CommercialPolicy', p.id, `قانون ${enabled ? 'فعال' : 'غیرفعال'} شد`);
    });
  };

  const resolveCase = (item: any) => {
    if (!guard(state, updateState, 'cases', 'EDIT', 'رسیدگی به مغایرت')) return;
    updateState(draft => {
    const c = (draft.reconciliationCases || []).find((x: any) => x.id === item.id); if (!c) return;
    c.status = 'RESOLVED'; c.resolution = 'در محیط آزمایشی بررسی و تعیین تکلیف شد؛ تأیید مالی واقعی ثبت نشده است'; c.resolvedAt = new Date().toISOString();
    audit(draft, 'RESOLVED', 'ReconciliationCase', c.id, c.resolution);
    });
  };

  const TabIcon = TABS.find(t => t.id === tab)?.icon || Activity;
  return <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-32 font-premium" dir="rtl">
    <div className="relative overflow-hidden rounded-[28px] border border-border bg-white p-5 shadow-card md:p-7">
      <div className="pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="warning" dot>محیط آزمایشی محلی</Badge><Badge variant="neutral">ذخیره در IndexedDB</Badge></div><h1 className="text-xl font-black text-text-main md:text-2xl">مرکز عملیات فروش و پخش</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-text-secondary">سفارش، مذاکره، کنترل قوانین، برنامه پخش، برگشتی، تطبیق و سودآوری در یک فضای کاری. تغییرات این نسخه فقط در داده آزمایشی CRM ذخیره می‌شوند و هیچ عملیات ERP یا حسابداری واقعی اجرا نمی‌شود.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" icon={<RefreshCw size={15}/>} onClick={() => setTab('reconciliation')}>بررسی مغایرت‌ها ({openCases})</Button><Button icon={<Plus size={15}/>} onClick={() => setTab('orders')}>ثبت سفارش آزمایشی</Button></div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[{label:'مجموع سفارش‌های غیرلغوشده',value:shortMoney(totalOrderValue),hint:`${orders.filter(o=>o.status!=='CANCELLED').length.toLocaleString('fa-IR')} سفارش`,icon:Package},{label:'برگشت ثبت‌شده',value:shortMoney(totalReturns),hint:'بدون تغییر خودکار مانده مالی',icon:ArrowLeftRight},{label:'برنامه‌های پخش باز',value:activeDispatch.toLocaleString('fa-IR'),hint:'برنامه‌ریزی؛ نه ارسال قطعی',icon:Truck},{label:'پوشش بهای تمام‌شده',value:`${Math.round(costCoverage*100).toLocaleString('fa-IR')}٪`,hint:'سفارش‌های دارای بهای معتبر',icon:Wallet}].map(k=><Card key={k.label} className="min-w-0"><div className="flex items-start justify-between gap-2"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/8 text-primary"><k.icon size={19}/></span><span className="text-[10px] font-medium text-text-secondary">{k.hint}</span></div><div className="mt-4 truncate text-lg font-black text-text-main">{k.value}</div><div className="mt-1 text-xs text-text-secondary">{k.label}</div></Card>)}
    </div>
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-white p-2 shadow-subtle">
      {visibleTabs.map(t=>{const Icon=t.icon; return <button key={t.id} onClick={()=>setTab(t.id)} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${tab===t.id?'bg-primary text-white shadow-subtle':'text-text-secondary hover:bg-canvas hover:text-text-main'}`}><Icon size={15}/>{t.label}</button>})}
    </div>

    {tab==='overview' && <div className="grid gap-4 xl:grid-cols-2">
      <Card><div className="mb-4 flex items-center justify-between"><h2 className="font-black text-text-main">نیازمند توجه</h2><Badge variant={openCases?'warning':'success'}>{openCases?`${openCases.toLocaleString('fa-IR')} مورد باز`:'بدون مورد باز'}</Badge></div>{cases.filter(c=>c.status!=='RESOLVED').slice(0,5).map(c=><div key={c.id} className="mb-2 flex items-start gap-3 rounded-2xl border border-border p-3"><span className="mt-0.5 text-warning"><AlertTriangle size={17}/></span><div className="min-w-0 flex-1"><div className="text-xs font-bold text-text-main">{c.title}</div><div className="mt-1 text-[11px] leading-5 text-text-secondary">{c.reason}</div></div><Button size="sm" variant="outline" onClick={()=>setTab('reconciliation')}>بررسی</Button></div>)}{!cases.filter(c=>c.status!=='RESOLVED').length&&<p className="text-sm text-text-secondary">مغایرت بازی ثبت نشده است.</p>}</Card>
      <Card><div className="mb-4 flex items-center justify-between"><h2 className="font-black text-text-main">آخرین سفارش‌ها</h2><Button variant="ghost" size="sm" onClick={()=>setTab('orders')}>مشاهده همه</Button></div>{orders.slice(-5).reverse().map(o=><div key={o.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0"><div className="min-w-0 flex-1"><div className="text-xs font-bold text-text-main">{o.orderNumber} · {customers.find(c=>c.id===o.customerId)?.name || 'مشتری نامشخص'}</div><div className="mt-1 text-[11px] text-text-secondary">{money(o.totalAmount)}</div></div><StatusBadge status={o.status} label={label(o.status)}/></div>)}</Card>
      <Card className="xl:col-span-2"><div className="mb-3 flex items-center gap-2"><Activity className="text-primary" size={18}/><h2 className="font-black text-text-main">مرزبندی منبع داده</h2></div><div className="grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-canvas p-3"><b className="text-xs text-text-main">داده آزمایشی</b><p className="mt-1 text-xs leading-6 text-text-secondary">قابل ایجاد، ویرایش و حذف در فضای محلی؛ با نشان TEST و ثبت ممیزی.</p></div><div className="rounded-2xl bg-canvas p-3"><b className="text-xs text-text-main">داده مالی مرجع</b><p className="mt-1 text-xs leading-6 text-text-secondary">فاکتور و پرداخت موجود فقط برای گزارش نمایشی استفاده می‌شوند؛ برگشت آزمایشی مانده را تغییر نمی‌دهد.</p></div><div className="rounded-2xl bg-canvas p-3"><b className="text-xs text-text-main">ERP / بک‌اند</b><p className="mt-1 text-xs leading-6 text-text-secondary">در این فاز غیرفعال است؛ هیچ ارسال، همگام‌سازی یا موفقیت خارجی ادعا نمی‌شود.</p></div></div></Card>
    </div>}

    {tab==='orders' && <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
      <Card><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-black text-text-main">مرکز سفارش‌ها</h2><Input aria-label="جستجوی سفارش" placeholder="جستجو در شماره سفارش یا مشتری..." value={search} onChange={e=>setSearch(e.target.value)} className="max-w-xs"/></div><div className="space-y-2">{filteredOrders.map(o=><div key={o.id} className="rounded-2xl border border-border p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-xs font-black text-text-main">{o.orderNumber}</div><div className="mt-1 text-xs text-text-secondary">{customers.find(c=>c.id===o.customerId)?.name || 'مشتری نامشخص'}</div></div><StatusBadge status={o.status} label={label(o.status)}/></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div><span className="text-sm font-black text-text-main">{money(o.totalAmount)}</span><div className="mt-1 text-[10px] text-text-secondary">{o.costKnown?`سود برآوردی: ${money(Number(o.totalAmount)-Number(o.costAmount))}`:'سود قابل محاسبه نیست؛ بهای معتبر نداریم'}</div>{assessOrderRisk({order:o,customer:customers.find(c=>c.id===o.customerId),orders,policies,invoices,returns}).slice(0,2).map(signal=><div key={signal.code} className={`mt-1 text-[10px] ${signal.level==='HIGH'?'text-danger':signal.level==='MEDIUM'?'text-warning':'text-text-secondary'}`}>• {signal.title}: {signal.reason}</div>)}</div><div className="flex flex-wrap gap-1.5">{o.status==='DRAFT'&&<Button size="sm" onClick={()=>changeOrderStatus(o,'PENDING_APPROVAL')}>ارسال برای تأیید</Button>}{o.status==='PENDING_APPROVAL'&&<><Button size="sm" variant="success" onClick={()=>changeOrderStatus(o,'APPROVED')}>تأیید آزمایشی</Button><Button size="sm" variant="danger" onClick={()=>changeOrderStatus(o,'CANCELLED')}>رد/لغو</Button></>}{['APPROVED','RELEASED'].includes(o.status)&&<Button size="sm" variant="outline" onClick={()=>setTab('dispatch')}>برنامه پخش</Button>}</div></div></div>)}{!filteredOrders.length&&<p className="py-8 text-center text-sm text-text-secondary">سفارشی پیدا نشد.</p>}</div></Card>
      <Card><h2 className="mb-4 font-black text-text-main">ثبت سفارش آزمایشی</h2><form className="space-y-3" onSubmit={createOrder}><div><label className="mb-1 block text-xs font-bold text-text-main">مشتری</label><select required value={customerId} onChange={e=>setCustomerId(e.target.value)} className="min-h-11 w-full rounded-2xl border border-border bg-white p-3 text-xs"><option value="">انتخاب مشتری</option>{customers.filter(c=>c.status!=='INACTIVE').map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className="mb-1 block text-xs font-bold text-text-main">کالا</label><select required value={productId} onChange={e=>setProductId(e.target.value)} className="min-h-11 w-full rounded-2xl border border-border bg-white p-3 text-xs"><option value="">انتخاب کالا از کاتالوگ seed</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {money(Number(p.unitPrice??p.basePrice??0))}</option>)}</select></div><Input label="تعداد" inputMode="decimal" type="number" min="0.001" step="any" required value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="تعداد موردنیاز"/><Input label="یادداشت مذاکره (اختیاری)" value={orderNote} onChange={e=>setOrderNote(e.target.value)} placeholder="دلیل تغییر یا نکته مذاکره"/><div className="rounded-xl bg-warning-soft p-3 text-[11px] leading-5 text-warning">قیمت از رکورد محصول seed خوانده می‌شود. این فرم سفارش ERP ایجاد یا تغییر نمی‌دهد.</div><Button className="w-full" type="submit" icon={<Plus size={15}/>} disabled={!customerId||!productId||Number(quantity)<=0}>ثبت در دیتابیس آزمایشی</Button></form></Card>
    </div>}

    {tab==='dispatch' && <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"><Card><div className="mb-4 flex items-center justify-between"><h2 className="font-black text-text-main">برنامه‌های پخش</h2><Badge variant="neutral">آزمایشی · بدون GPS یا ارسال واقعی</Badge></div><div className="space-y-3">{dispatchPlans.map(p=><div key={p.id} className="rounded-2xl border border-border p-4"><div className="flex flex-wrap justify-between gap-2"><div><b className="text-sm text-text-main">{p.planNumber} · {p.name}</b><div className="mt-1 text-xs text-text-secondary">ظرفیت: {Number(p.capacityKg||0).toLocaleString('fa-IR')} کیلوگرم · بار ثبت‌شده: {p.plannedWeightKg==null?'نامشخص':Number(p.plannedWeightKg).toLocaleString('fa-IR')} کیلوگرم</div></div><StatusBadge status={p.status} label={label(p.status)}/></div><div className="mt-3 text-xs text-text-secondary">سفارش‌های تخصیص‌یافته: {(p.orderIds||[]).length.toLocaleString('fa-IR')} · فاکتورهای متصل: {(p.invoiceIds||[]).length.toLocaleString('fa-IR')} · خروجی توزیع: {p.distributionOutputNumber || 'ثبت نشده'} · بهره‌برداری: {evaluateDispatchPlan(p, orders).capacityUtilizationPercent===null?'نامشخص':`${evaluateDispatchPlan(p, orders).capacityUtilizationPercent.toLocaleString('fa-IR',{maximumFractionDigits:1})}٪`}</div>{invoices.filter(i=>classifyInvoiceDistribution(i, dispatchPlans)==='NOT_YET_IN_DISTRIBUTION' && !(p.invoiceIds||[]).includes(i.id)).slice(0,4).map(i=><Button key={i.id} size="sm" variant="outline" onClick={()=>assignInvoiceToDispatch(p,i)}>اتصال فاکتور {i.invoiceNumber || i.id}</Button>)}{evaluateDispatchPlan(p, orders).signals.map(signal=><div key={signal.code} className={`mt-2 text-[10px] ${signal.level==='HIGH'?'text-danger':signal.level==='MEDIUM'?'text-warning':'text-text-secondary'}`}>• {signal.title}: {signal.reason}</div>)}<div className="mt-3 flex flex-wrap gap-2">{orders.filter(o=>['APPROVED','RELEASED'].includes(o.status)&&!(p.orderIds||[]).includes(o.id)).slice(0,4).map(o=><Button key={o.id} size="sm" variant="outline" onClick={()=>assignOrderToDispatch(p,o)}>تخصیص {o.orderNumber}</Button>)}{p.status!=='DELIVERED'&&<Button size="sm" variant="ghost" onClick={()=>{if(!guard(state, updateState, 'internal', 'EDIT', 'ثبت تحویل آزمایشی')) return; updateState(draft=>{const x=(draft.dispatchPlans||[]).find((z:any)=>z.id===p.id);if(x){x.status='DELIVERED';x.completedAt=new Date().toISOString();audit(draft,'STATUS_CHANGED','DispatchPlan',x.id,'وضعیت تحویل فقط برای سناریوی آزمایشی تغییر کرد');}});}}>علامت‌گذاری تحویل آزمایشی</Button>}</div></div>)}{!dispatchPlans.length&&<p className="py-8 text-center text-sm text-text-secondary">برنامه پخشی ثبت نشده است.</p>}</div></Card><Card><h2 className="mb-4 font-black text-text-main">برنامه جدید</h2><form className="space-y-3" onSubmit={createDispatch}><Input label="عنوان خودرو/مسیر" required value={dispatchName} onChange={e=>setDispatchName(e.target.value)} placeholder="مثلاً مسیر آزمایشی شمال"/><Input label="ظرفیت وزنی (کیلوگرم)" type="number" min="1" required value={vehicleCapacity} onChange={e=>setVehicleCapacity(e.target.value)} placeholder="ظرفیت مجاز"/><Input label="شماره خروجی توزیع (در صورت صدور)" value={distributionOutputNumber} onChange={e=>setDistributionOutputNumber(e.target.value)} placeholder="شماره واقعی ثبت‌شده؛ خالی یعنی ورود به پخش تأیید نیست"/><div className="rounded-xl bg-canvas p-3 text-[11px] leading-5 text-text-secondary">وزن سفارش تا وقتی وزن واقعی اقلام از منبع معتبر نیامده باشد، صفر/نامشخص می‌ماند؛ ظرفیت وزنی به‌تنهایی تأیید بارگیری نیست.</div><Button className="w-full" type="submit" icon={<Truck size={15}/>} disabled={!dispatchName.trim()||Number(vehicleCapacity)<=0}>ایجاد برنامه آزمایشی</Button></form></Card></div>}

    {tab==='returns' && <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,1fr)]"><Card><h2 className="mb-4 font-black text-text-main">ثبت‌های برگشتی</h2><div className="space-y-2">{returns.map(r=><div key={r.id} className="rounded-2xl border border-border p-3"><div className="flex flex-wrap justify-between gap-2"><b className="text-xs text-text-main">{r.returnNumber} · {customers.find(c=>c.id===r.customerId)?.name||'مشتری نامشخص'}</b><StatusBadge status={r.status} label={label(r.status)}/></div><div className="mt-2 text-sm font-black text-text-main">{money(r.amount)}</div><p className="mt-1 text-xs leading-5 text-text-secondary">علت: {r.reason} <span className="text-text-secondary">({r.reasonCode||'UNKNOWN'})</span></p><div className="mt-2 text-[10px] text-warning">سند مالی مرجع: {r.financialDocumentConfirmed?'تأیید شده':'متصل نیست — مانده تغییر نکرده'}</div></div>)}{!returns.length&&<p className="py-8 text-center text-sm text-text-secondary">برگشتی ثبت نشده است.</p>}</div></Card><Card><h2 className="mb-4 font-black text-text-main">ثبت برگشتی آزمایشی</h2><form className="space-y-3" onSubmit={createReturn}><div><label className="mb-1 block text-xs font-bold text-text-main">سفارش مرتبط</label><select required value={returnOrderId} onChange={e=>setReturnOrderId(e.target.value)} className="min-h-11 w-full rounded-2xl border border-border bg-white p-3 text-xs"><option value="">انتخاب سفارش</option>{orders.filter(o=>o.status!=='CANCELLED').map(o=><option key={o.id} value={o.id}>{o.orderNumber} · {money(o.totalAmount)}</option>)}</select></div><Input label="مبلغ مورد بررسی" type="number" min="1" required value={returnAmount} onChange={e=>setReturnAmount(e.target.value)} placeholder="مبلغ ریالی"/><div><label className="mb-1 block text-xs font-bold text-text-main">دسته‌بندی علت</label><select required value={returnReasonCode} onChange={e=>setReturnReasonCode(e.target.value)} className="min-h-11 w-full rounded-2xl border border-border bg-white p-3 text-xs"><option value="CUSTOMER_REJECTED">عدم پذیرش مشتری</option><option value="QUALITY">کیفیت کالا</option><option value="DAMAGE">آسیب حین حمل</option><option value="ORDER_ERROR">اشتباه سفارش‌گیری</option><option value="LOADING_MISMATCH">مغایرت بارگیری</option><option value="CREDIT_POLICY">محدودیت اعتباری</option><option value="OTHER">سایر / نامشخص</option></select></div><Input label="شرح علت" required value={returnReason} onChange={e=>setReturnReason(e.target.value)} placeholder="شواهد و توضیحات علت برگشت..."/><Input label="مهلت رسیدگی" type="date" required value={returnDueDate} onChange={e=>setReturnDueDate(e.target.value)}/><div><label className="mb-1 block text-xs font-bold text-text-main">مسئول رسیدگی</label><select required value={returnAssignee} onChange={e=>setReturnAssignee(e.target.value)} className="min-h-11 w-full rounded-2xl border border-border bg-white p-3 text-xs"><option value="">انتخاب مسئول</option>{(state.users||[]).filter((u:any)=>u.isActive!==false&&u.active!==false).map((u:any)=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div><div className="rounded-xl bg-danger-soft p-3 text-[11px] leading-5 text-danger">ثبت برگشتی به‌تنهایی سند بستانکاری یا تغییر مانده نیست. پرونده تطبیق برای بررسی ایجاد می‌شود.</div><Button className="w-full" type="submit" icon={<ArrowLeftRight size={15}/>} disabled={!returnOrderId||Number(returnAmount)<=0||!returnReason.trim()||!returnDueDate||!returnAssignee}>ثبت برگشتی و پرونده بررسی</Button></form></Card></div>}

    {tab==='policies' && <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,1fr)]"><Card><h2 className="mb-4 font-black text-text-main">سیاست‌های تجاری تعریف‌شده</h2><div className="space-y-2">{policies.map(p=><div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3"><div className="min-w-0 flex-1"><div className="text-xs font-black text-text-main">{p.name}</div><div className="mt-1 text-[11px] text-text-secondary">{({NO_CREDIT:'ممنوعیت مانده',CREDIT_LIMIT:'سقف اعتبار',MIN_MARGIN:'حداقل حاشیه سود',MAX_DISCOUNT:'سقف تخفیف',ZONE:'محدوده توزیع'} as any)[p.type]||p.type} · دامنه: {p.scope} · مقدار: {p.value||'نیازمند تعریف'}</div><div className="mt-1"><Badge variant="warning">فقط سیاست محلی آزمایشی</Badge></div></div><Button size="sm" variant={p.enabled?'outline':'success'} onClick={()=>setPolicyEnabled(p,!p.enabled)}>{p.enabled?'غیرفعال‌کردن':'فعال‌کردن'}</Button></div>)}{!policies.length&&<p className="py-8 text-center text-sm text-text-secondary">قانونی تعریف نشده است.</p>}</div></Card><Card><h2 className="mb-4 font-black text-text-main">تعریف قانون جدید</h2><form className="space-y-3" onSubmit={createPolicy}><Input label="نام قانون" required value={policyName} onChange={e=>setPolicyName(e.target.value)} placeholder="مثلاً ممنوعیت مانده برای گروه کالا"/><div><label className="mb-1 block text-xs font-bold text-text-main">نوع قانون</label><select value={policyType} onChange={e=>setPolicyType(e.target.value)} className="min-h-11 w-full rounded-2xl border border-border bg-white p-3 text-xs"><option value="NO_CREDIT">ممنوعیت فروش با مانده</option><option value="CREDIT_LIMIT">سقف اعتبار</option><option value="MIN_MARGIN">حداقل حاشیه سود</option><option value="MAX_DISCOUNT">سقف تخفیف</option><option value="ZONE">محدودیت زون</option></select></div><div><label className="mb-1 block text-xs font-bold text-text-main">دامنه</label><select value={policyScope} onChange={e=>setPolicyScope(e.target.value)} className="min-h-11 w-full rounded-2xl border border-border bg-white p-3 text-xs"><option value="COMPANY">کل شرکت</option><option value="CUSTOMER">مشتری</option><option value="PRODUCT">کالا</option><option value="PRODUCT_GROUP">گروه کالا</option><option value="ZONE">زون</option></select></div><Input label="مقدار/شناسه هدف (در صورت نیاز)" value={policyValue} onChange={e=>setPolicyValue(e.target.value)} placeholder="مثلاً درصد، مبلغ یا شناسه"/><div className="rounded-xl bg-warning-soft p-3 text-[11px] leading-5 text-warning">این فرم قانون را ذخیره و ممیزی می‌کند؛ هنوز در سمت سرور یا ERP مانع تراکنش واقعی نمی‌شود. تا تکمیل موتور اجرایی، آن را سیاست عملیاتی فعال تلقی نکن.</div><Button className="w-full" type="submit" icon={<ShieldCheck size={15}/>} disabled={!policyName.trim()}>ذخیره قانون آزمایشی</Button></form></Card></div>}

    {tab==='inventory' && <InventoryTab state={state} />}
    {tab==='purchasing' && <PurchasingTab state={state} updateState={updateState} />}
    {tab==='credit' && <CreditTab state={state} />}
    {tab==='reports' && <OperationsReportsTab state={state} />}

    {tab==='profitability' && <div className="space-y-4"><Card><div className="mb-3 flex items-center gap-2"><Wallet size={18} className="text-primary"/><h2 className="font-black text-text-main">تفکیک فروش، برگشت، سود و وصول</h2></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{[{title:'فاکتورهای موجود در seed',value:money(profitability.invoiceGross),desc:'مجموع فاکتورهای موجود؛ وضعیت آزمایشی'},{title:'برگشت تأییدشده مالی',value:money(profitability.confirmedReturns),desc:`برگشت در انتظار سند: ${money(profitability.unconfirmedReturns)}`},{title:'فروش خالص پس از سند معتبر',value:money(actualNetSales),desc:'فقط برگشتی دارای سند مالی تأییدشده کسر شده است'},{title:'وجه پرداخت ثبت‌شده و تسویه‌شده',value:money(profitability.clearedPayments),desc:'بر اساس وضعیت پرداخت seed؛ نیازمند تطبیق منبع مرجع'}].map(k=><div key={k.title} className="rounded-2xl bg-canvas p-4"><div className="text-xs font-bold text-text-secondary">{k.title}</div><div className="mt-3 text-lg font-black text-text-main">{k.value}</div><div className="mt-2 text-[10px] leading-5 text-text-secondary">{k.desc}</div></div>)}</div></Card><Card><h3 className="mb-3 font-black text-text-main">پوشش سودآوری سفارش‌ها</h3><div className="space-y-3">{orders.map(o=>{const margin=o.costKnown&&Number(o.totalAmount)>0?((Number(o.totalAmount)-Number(o.costAmount))/Number(o.totalAmount))*100:null;return <div key={o.id} className="grid gap-2 rounded-2xl border border-border p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:items-center"><div><div className="text-xs font-black text-text-main">{o.orderNumber}</div><div className="mt-1 text-[10px] text-text-secondary">{customers.find(c=>c.id===o.customerId)?.name||'مشتری نامشخص'}</div></div><div><div className="text-[10px] text-text-secondary">مبلغ</div><div className="mt-1 text-xs font-bold text-text-main">{money(o.totalAmount)}</div></div><div><div className="text-[10px] text-text-secondary">هزینه معتبر</div><div className="mt-1 text-xs font-bold text-text-main">{o.costKnown?money(o.costAmount):'نامشخص'}</div></div><div><div className="text-[10px] text-text-secondary">حاشیه سود برآوردی</div><div className={`mt-1 text-xs font-black ${margin===null?'text-warning':margin<10?'text-danger':'text-success'}`}>{margin===null?'قابل محاسبه نیست':`${margin.toLocaleString('fa-IR',{maximumFractionDigits:1})}٪`}</div></div></div>})}</div><div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-canvas p-3"><div className="text-[11px] text-text-secondary">سود ناخالص برآوردی سفارش‌های دارای بهای معتبر</div><div className="mt-1 font-black text-text-main">{money(profitability.estimatedGrossProfit)}</div></div><div className="rounded-2xl bg-canvas p-3"><div className="text-[11px] text-text-secondary">پوشش بهای تمام‌شده</div><div className="mt-1 font-black text-text-main">{profitability.costCoveragePercent===null?'نامشخص':`${profitability.costCoveragePercent.toLocaleString('fa-IR',{maximumFractionDigits:1})}٪`}</div></div><div className="rounded-2xl bg-canvas p-3"><div className="text-[11px] text-text-secondary">سود عملیاتی پخش</div><div className="mt-1 font-black text-warning">{profitability.operationalProfit===null?'غیرقابل محاسبه':money(profitability.operationalProfit)}</div></div></div><p className="mt-3 text-[11px] leading-6 text-text-secondary">مجموعه شاخص‌ها: {metrics.orderCount.toLocaleString('fa-IR')} سفارش، {metrics.approvedOrders.toLocaleString('fa-IR')} سفارش تأیید/آزادشده. سود عملیاتی فقط زمانی نمایش عددی می‌گیرد که هزینه‌های پخش معتبر و مرتبط موجود باشند.</p></Card></div>}

    {tab==='reconciliation' && <Card><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-black text-text-main">مرکز تطبیق و رسیدگی به مغایرت</h2><Badge variant="warning">{openCases.toLocaleString('fa-IR')} مورد باز</Badge></div><div className="space-y-3">{cases.map(c=><div key={c.id} className="rounded-2xl border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-xs font-black text-text-main">{c.caseNumber} · {c.title}</div><div className="mt-1 text-xs leading-6 text-text-secondary">{c.reason}</div></div><StatusBadge status={c.status} label={label(c.status)}/></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-2"><Badge variant={c.severity==='HIGH'?'danger':'warning'}>شدت: {c.severity||'نامشخص'}</Badge><Badge variant="neutral">مسئول: {state.users?.find((u:any)=>u.id===c.assignedTo)?.name||'تعیین نشده'}</Badge></div>{c.status!=='RESOLVED'&&<Button size="sm" variant="success" icon={<BadgeCheck size={14}/>} onClick={()=>resolveCase(c)}>ثبت رسیدگی آزمایشی</Button>}</div>{c.resolution&&<div className="mt-3 rounded-xl bg-success-soft p-3 text-[11px] leading-5 text-success">{c.resolution}</div>}</div>)}{!cases.length&&<div className="py-10 text-center text-sm text-text-secondary">مغایرتی برای بررسی وجود ندارد.</div>}</div></Card>}
    <div className="flex items-start gap-2 rounded-2xl border border-border bg-white/70 p-3 text-[11px] leading-6 text-text-secondary"><FileWarning size={16} className="mt-1 shrink-0 text-warning"/><p>این مرکز نسخهٔ اول عملیاتی آزمایشی است. تمام تغییرات در State محلی برنامه و ممیزی محلی ذخیره می‌شوند؛ نقش‌ها و مجوزهای رابط موجود همچنان باید قبل از پذیرش نهایی در سطح داده و سمت سرور نیز اعمال شوند. ارسال ERP، صدور فاکتور رسمی، تغییر مانده، GPS، بارنامه و تأیید مالی واقعی در این نسخه فعال نیستند.</p></div>
  </div>;
}
