import React, { useState, useMemo } from 'react';
import { 
  Account, AppState, Quote, CustomerTask, Activity, 
  Opportunity, Case, CustomerNote, Priority 
} from '../types';
import { 
  ChevronRight, Phone, Wallet, FileText, 
  CheckSquare, Clock, Plus, Building2, User, 
  CheckCircle2, ShieldAlert, TrendingUp, History, MessageSquare, 
  ArrowUpRight, AlertTriangle, UserCheck, Activity as ActivityIcon
} from 'lucide-react';
import { formatCurrency, generateId, formatAppDate, cn, nextSequenceNumber } from '../lib/utils';
import { processTaskCollaborationEvents, processEntityMentions } from '../lib/collaboration';
import { Avatar } from './ui/Avatar';
import { EmptyState } from './ui/EmptyState';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { checkReceipt, buildReceiptPayment } from '../lib/receiptFlow';
import { SecureField } from './ui/SecureField';
import { RBACService } from '../lib/rbac';
import { getDefaultCreditLimit } from '../lib/orgPolicy';
import { calculateCustomerRiskScore, calculateDaysOverdue } from '../services/collectionEngine';
import { predictAccountChurn, generateChurnMitigationTask } from '../services/churnPredictionService';
import { DynamicFormRenderer } from './shared/DynamicFormRenderer';
import { getPersianStatusLabel } from '../lib/labels';
import { guard, requireActiveUser } from '../hooks/useCan';
import { 
  ACTIVITY_FORM_SCHEMA, 
  NOTE_FORM_SCHEMA, 
  createTaskFormSchema, 
  OPPORTUNITY_FORM_SCHEMA, 
  SERVICE_CASE_SCHEMA, 
  PAYMENT_RECEIPT_SCHEMA,
  CONTACT_FORM_SCHEMA
} from '../services/dynamicFormEngine';

interface Customer360Props {
  customer: Account;
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
  onBack: () => void;
  setActiveTab?: (tab: any) => void;
}

type TabKey = 'OVERVIEW' | 'ACTIVITIES_TASKS' | 'SALES_FINANCE' | 'CASES_AUDIT';

export function Customer360({ customer, state, onBack, updateState, setActiveTab }: Customer360Props) {
  const [activeSubTab, setActiveSubTab] = useState<TabKey>('OVERVIEW');
  const [activitiesFilter, setActivitiesFilter] = useState<'ALL' | 'ACTIVITIES' | 'NOTES' | 'TASKS'>('ALL');
  const [salesFilter, setSalesFilter] = useState<'ALL' | 'QUOTES' | 'OPPORTUNITIES' | 'PAYMENTS'>('ALL');
  const [casesFilter, setCasesFilter] = useState<'ALL' | 'CASES' | 'AUDIT'>('ALL');

  const [contactModal, setContactModal] = useState<null | { initial?: any }>(null);
  const canEditAccount = new RBACService(state).canActOnRecord('accounts', 'EDIT', { ownerId: (customer as any).ownerId, branchId: (customer as any).branchId, territoryId: (customer as any).territoryId, teamId: (customer as any).teamId });
  
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [receiptNotice, setReceiptNotice] = useState<string | null>(null);
  const [churnNotice, setChurnNotice] = useState<string | null>(null);

  const churnPrediction = useMemo(() => predictAccountChurn(customer, state), [customer, state]);

  const handleCreateRetentionTask = () => {
    if (!guard(state, updateState, 'tasks', 'CREATE', 'ایجاد وظیفه حفظ مشتری')) return;
    const currentUserId = state.currentUserId || 'user-admin';
    const newTask = generateChurnMitigationTask(customer, churnPrediction, currentUserId);
    updateState(draft => {
      if (!draft.tasks) draft.tasks = [];
      draft.tasks.unshift(newTask);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(),
        action: 'TASK_CREATED',
        entityType: 'TASK',
        entityId: newTask.id,
        details: `وظیفه پیشگیرانه حفظ مشتری برای «${customer.name}» (ریسک ریزش: ${churnPrediction.riskTierLabel}) ایجاد شد`,
        actor: draft.users?.find(u => u.id === currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });
    setChurnNotice(`وظیفه حفظ مشتری و پیگیری پیشگیرانه برای «${customer.name}» با موفقیت ثبت شد.`);
    setTimeout(() => setChurnNotice(null), 5000);
  };

  const accountQuotes = (state.quotes || []).filter(q =>
    (q.accountId === customer.id || q.customerId === customer.id) &&
    new RBACService(state).canActOnRecord('quotes', 'VIEW', { ownerId: q.ownerId, branchId: q.branchId, territoryId: q.territoryId, teamId: q.teamId, tenantId: q.tenantId })
  );
  const accountTasks = (state.tasks || []).filter(t => t.accountId === customer.id || t.customerId === customer.id);
  const accountActivities = (state.activities || []).filter(a => a.accountId === customer.id || a.customerId === customer.id);
  const accountNotes = (state.customerNotes || []).filter((n: any) => n.accountId === customer.id || n.customerId === customer.id);
  const accountPayments = (state.payments || []).filter(p => p.accountId === customer.id || p.customerId === customer.id);
  const accountOpportunities = (state.opportunities || []).filter(o => o.accountId === customer.id);
  const accountCases = (state.cases || []).filter((c: any) => c.accountId === customer.id);
  const accountAuditLogs = (state.auditLogs || []).filter(l => l.entityId === customer.id || (l.details && l.details.includes(customer.name)));
  
  const parentAccount = customer.parentAccountId ? state.accounts?.find(a => a.id === customer.parentAccountId) : null;
  const childAccounts = (state.accounts || []).filter(a => a.parentAccountId === customer.id);
  const route = customer.routeId ? (state.routes || []).find((r: any) => r.id === customer.routeId) : null;

  const totalQuotesValue = accountQuotes.reduce((acc, q) => acc + (q.totalAmount || 0), 0);
  const totalPaid = accountPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const currentBalance = Math.max(0, totalQuotesValue - totalPaid);

  const customerInvoices = (state.invoices || []).filter(i => (i.accountId === customer.id || i.customerId === customer.id) && i.status !== 'PAID');
  let customerOverdue = 0;
  let maxOverdueDays = 0;
  customerInvoices.forEach(inv => {
    const days = calculateDaysOverdue(inv.dueDate);
    if (days > 0) {
      const rem = inv.balance !== undefined ? inv.balance : (inv.totalAmount - (inv.paidAmount || 0));
      customerOverdue += rem;
      if (days > maxOverdueDays) maxOverdueDays = days;
    }
  });
  const bouncedChequesCount = (state.cheques || []).filter(c => (c as any).accountId === customer.id && (c.status === 'BOUNCED' || (c as any).status === 'RETURNED')).length;
  const customerRisk = calculateCustomerRiskScore(customer, customerOverdue, maxOverdueDays, bouncedChequesCount, getDefaultCreditLimit(state));

  const unifiedTimeline = useMemo(() => {
    const list: Array<{
      id: string; title: string; description?: string; date: string; type: string; icon: any; color: string;
    }> = [];

    accountQuotes.forEach(q => list.push({ id: `q_${q.id}`, title: `پیش‌فاکتور ${q.quoteNumber}`, description: `مبلغ: ${formatCurrency(q.totalAmount)} ریال | وضعیت: ${getPersianStatusLabel(q.status)}`, date: q.createdAt, type: 'QUOTE', icon: FileText, color: 'text-primary bg-primary-soft border-primary/20' }));
    accountActivities.forEach(a => list.push({ id: `act_${a.id}`, title: `فعالیت: ${a.title}`, description: a.description, date: a.dateTime, type: 'ACTIVITY', icon: ActivityIcon, color: 'text-cobalt bg-cobalt/10 border-cobalt/20' }));
    accountNotes.forEach((n: any) => list.push({ id: `note_${n.id}`, title: 'یادداشت مشتری', description: n.content, date: n.createdAt, type: 'NOTE', icon: MessageSquare, color: 'text-warning bg-warning-soft border-warning-border' }));
    accountTasks.forEach(t => list.push({ id: `tsk_${t.id}`, title: `وظیفه: ${t.title}`, description: `مهلت: ${formatAppDate(t.dueDate, state.settings?.locale)} | وضعیت: ${getPersianStatusLabel(t.status)}`, date: t.createdAt, type: 'TASK', icon: CheckSquare, color: 'text-success bg-success-soft border-success-border' }));
    accountPayments.forEach(p => list.push({ id: `pay_${p.id}`, title: `وصولی: ${formatCurrency(p.amount)} ریال`, description: `روش: ${p.method || 'واریز'} | وضعیت: ${getPersianStatusLabel(p.status)}`, date: p.date, type: 'PAYMENT', icon: Wallet, color: 'text-success bg-success-soft border-success-border' }));
    accountOpportunities.forEach(o => list.push({ id: `opp_${o.id}`, title: `فرصت: ${o.title}`, description: `مبلغ: ${formatCurrency(o.amount)} ریال | مرحله: ${getPersianStatusLabel(o.stage)}`, date: o.createdAt, type: 'OPPORTUNITY', icon: TrendingUp, color: 'text-accent bg-accent/10 border-accent/20' }));
    accountCases.forEach((c: any) => list.push({ id: `cs_${c.id}`, title: `پرونده: ${c.subject}`, description: `شماره: ${c.caseNumber} | وضعیت: ${getPersianStatusLabel(c.status)}`, date: c.createdAt, type: 'CASE', icon: ShieldAlert, color: 'text-danger bg-danger-soft border-danger-border' }));

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [accountQuotes, accountActivities, accountNotes, accountTasks, accountPayments, accountOpportunities, accountCases, state.settings?.locale]);

  // Handlers for dynamic forms...
  const handleDynamicActivitySubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'activities', 'CREATE', 'ثبت فعالیت')) return;
    if (!requireActiveUser(state, updateState, 'ثبت فعالیت')) return;
    const creator = state.users.find(user => user.id === state.currentUserId);
    const newAct: Activity = {
      id: generateId(), accountId: customer.id, customerId: customer.id, type: values.activityType || 'CALL',
      title: String(values.title).trim(), description: values.description?.trim(), mentions: [],
      dateTime: new Date().toISOString(), ownerId: state.currentUserId!,
      branchId: creator?.branchId, territoryId: creator?.territoryId, teamId: creator?.teamId, tenantId: creator?.tenantId
    } as any;
    updateState(draft => {
      if (!draft.activities) draft.activities = [];
      draft.activities.unshift(newAct);
    });
    setIsActivityModalOpen(false);
  };

  const handleDynamicNoteSubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'accounts', 'EDIT', 'ثبت یادداشت')) return;
    if (!requireActiveUser(state, updateState, 'ثبت یادداشت') || !canEditAccount) return;
    const creator = state.users.find(user => user.id === state.currentUserId);
    const newNote: CustomerNote = {
      id: generateId(), accountId: customer.id, content: String(values.content).trim(),
      authorId: state.currentUserId!, ownerId: state.currentUserId!, branchId: creator?.branchId, territoryId: creator?.territoryId, teamId: creator?.teamId, tenantId: creator?.tenantId,
      mentions: [], createdAt: new Date().toISOString()
    } as any;
    updateState(draft => {
      if (!draft.customerNotes) draft.customerNotes = [];
      draft.customerNotes.unshift(newNote);
      processEntityMentions(customer.name, 'یادداشت مشتری', newNote.mentions, state, draft, 'customers');
    });
    setIsNoteModalOpen(false);
  };

  const handleDynamicTaskSubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'tasks', 'CREATE', 'ایجاد وظیفه')) return;
    if (!requireActiveUser(state, updateState, 'ایجاد وظیفه')) return;
    const creator = state.users.find(user => user.id === state.currentUserId);
    const newTask: CustomerTask = {
      id: generateId(), accountId: customer.id, customerId: customer.id,
      title: String(values.title).trim(), description: String(values.description || '').trim(),
      dueDate: values.dueDate || new Date().toISOString().split('T')[0], status: 'OPEN', priority: values.priority || 'NORMAL',
      ownerId: state.currentUserId!, branchId: creator?.branchId, territoryId: creator?.territoryId, teamId: creator?.teamId, tenantId: creator?.tenantId,
      slaStatus: 'ON_TRACK', assigneeType: 'USER', assigneeId: values.assigneeId || state.currentUserId || '', mentions: [], createdAt: new Date().toISOString()
    };
    updateState(draft => {
      if (!draft.tasks) draft.tasks = [];
      draft.tasks.unshift(newTask);
      processTaskCollaborationEvents(newTask, state, draft, true);
    });
    setIsTaskModalOpen(false);
  };

  const handleDynamicOppSubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'opportunities', 'CREATE', 'ثبت فرصت')) return;
    if (!requireActiveUser(state, updateState, 'ثبت فرصت')) return;
    const creator = state.users.find(user => user.id === state.currentUserId);
    const newOpp: Opportunity = {
      id: generateId(), accountId: customer.id, title: String(values.title).trim(), amount: Number(values.amount) || 0,
      stage: values.stage || 'DISCOVERY', expectedCloseDate: values.expectedCloseDate,
      ownerId: state.currentUserId!, branchId: creator?.branchId, territoryId: creator?.territoryId, teamId: creator?.teamId, tenantId: creator?.tenantId,
      createdAt: new Date().toISOString()
    };
    updateState(draft => {
      if (!draft.opportunities) draft.opportunities = [];
      draft.opportunities.unshift(newOpp);
    });
    setIsOppModalOpen(false);
  };

  const handleDynamicCaseSubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'cases', 'CREATE', 'ثبت پرونده')) return;
    if (!state.currentUserId) return;
    const newCase: Case = {
      id: generateId(), caseNumber: `CS-${Date.now().toString().slice(-4)}`, accountId: customer.id,
      subject: String(values.subject).trim(), description: `${String(values.description || '').trim()}`,
      status: 'NEW', priority: values.priority || 'NORMAL', ownerId: state.currentUserId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    updateState(draft => {
      if (!draft.cases) draft.cases = [];
      draft.cases.unshift(newCase);
    });
    setIsCaseModalOpen(false);
  };

  const handleDynamicPaymentSubmit = (values: Record<string, any>) => {
    if (!new RBACService(state).canActOnRecord('payments', 'CREATE', { ownerId: (customer as any).ownerId, branchId: (customer as any).branchId, territoryId: (customer as any).territoryId, teamId: (customer as any).teamId })) {
      setReceiptNotice('دسترسی ثبت رسید پرداخت برای شما فعال نیست.'); setTimeout(() => setReceiptNotice(null), 5000); return;
    }
    const input = { accountId: customer.id, amount: Number(values.amount) || 0, method: values.method, reference: String(values.referenceNumber || values.sayadNumber || ''), bankName: values.bankName, date: values.date || undefined, submittedBy: state.currentUserId };
    const check = checkReceipt(state, input);
    if (!check.ok) { setReceiptNotice(check.errors.join(' ')); setTimeout(() => setReceiptNotice(null), 6000); return; }
    const newPayment = buildReceiptPayment(input, generateId(), new Date(), check.probableDuplicateOf);
    updateState(draft => {
      if (!draft.payments) draft.payments = [];
      if (newPayment.reference && draft.payments.some((x: any) => x.reference && x.reference.trim().toLowerCase() === newPayment.reference.trim().toLowerCase() && x.accountId === newPayment.accountId)) return;
      draft.payments.unshift(newPayment as any);
    });
    setIsPaymentModalOpen(false);
    setReceiptNotice(check.probableDuplicateOf ? 'رسید ثبت شد اما شبیه یک پرداخت قبلی است؛ نیازمند بررسی.' : 'رسید ثبت شد.');
    setTimeout(() => setReceiptNotice(null), 5000);
  };

  const handleDynamicContactSubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'accounts', 'EDIT', 'ثبت مخاطب')) return;
    if (!canEditAccount) return;
    const initial = contactModal?.initial;
    updateState(draft => {
      const target = draft.accounts.find(c => c.id === customer.id);
      if (!target) return draft;
      if (!target.contacts) target.contacts = [];
      const isPrimary = !!values.isPrimary || (!initial?.id && target.contacts.length === 0);
      if (isPrimary) target.contacts.forEach(c => { c.isPrimary = false; });
      const fields = { name: String(values.name || '').trim(), role: values.role || '', mobile: values.mobile || '', phone: String(values.landline || '').trim(), email: values.email || '', notes: values.notes || '', isPrimary };
      if (initial?.id) {
        const idx = target.contacts.findIndex(c => c.id === initial.id);
        if (idx >= 0) target.contacts[idx] = { ...target.contacts[idx], ...fields };
      } else {
        target.contacts.push({ id: generateId(), accountId: customer.id, ...fields });
      }
      return draft;
    });
    setContactModal(null);
  };

  const handleCreateNewQuote = () => {
    if (!guard(state, updateState, 'quotes', 'CREATE', 'صدور پیش‌فاکتور')) return;
    if (!requireActiveUser(state, updateState, 'صدور پیش‌فاکتور')) return;
    const newQuoteId = generateId();
    const creator = state.users.find(user => user.id === state.currentUserId);
    updateState(draft => {
      if (!draft.quotes) draft.quotes = [];
      draft.quotes.unshift({
        id: newQuoteId, quoteNumber: nextSequenceNumber('QT-', (state.quotes || []).map(x => x.quoteNumber), 1001),
        accountId: customer.id, ownerId: state.currentUserId!, branchId: creator?.branchId, territoryId: creator?.territoryId, teamId: creator?.teamId, tenantId: creator?.tenantId,
        status: 'DRAFT', lines: [], totalAmount: 0, marginPercent: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      } as any);
      draft.activeContextAccountId = customer.id;
    });
    if (setActiveTab) setActiveTab('quotes');
  };

  return (
    <div className="w-full space-y-5 px-2 py-2 sm:px-4 pb-32 font-sans" dir="rtl">
      {churnNotice && (
        <div className="p-3 bg-success-soft border border-success-border text-success text-sm rounded-2xl flex items-center gap-2 font-bold animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{churnNotice}</span>
        </div>
      )}

      {/* Persistent Customer Identity Header */}
      <div className="bg-surface border border-border rounded-3xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-xl bg-canvas hover:bg-border text-text-secondary hover:text-text-main transition-colors cursor-pointer border border-border">
              <ChevronRight size={20} />
            </button>
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary font-black text-2xl flex items-center justify-center border border-primary/20 shadow-sm">
                {customer.name ? customer.name.charAt(0) : 'م'}
              </div>
              <span className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-surface ${customer.status === 'ACTIVE' ? 'bg-success' : 'bg-text-muted'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight">{customer.name}</h1>
                <span className="font-mono bg-canvas px-2.5 py-1 rounded-lg text-xs font-bold text-text-secondary border border-border">
                  {customer.code || '-'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-text-secondary">
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="font-mono flex items-center gap-1 text-text-main hover:text-primary transition-colors">
                    <Phone size={14} className="text-primary" /> {customer.phone}
                  </a>
                )}
                {customer.nationalId && (
                  <span className="font-mono text-text-muted">شناسه: {customer.nationalId}</span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-56 p-3 rounded-2xl border border-border bg-canvas shrink-0">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-secondary font-bold">ریسک اعتباری:</span>
              <span className={`font-black font-mono ${
                customerRisk.level === 'CRITICAL' ? 'text-danger' :
                customerRisk.level === 'HIGH' ? 'text-warning' :
                customerRisk.level === 'MEDIUM' ? 'text-primary' : 'text-success'
              }`}>
                {customerRisk.score}٪ ({
                  customerRisk.level === 'CRITICAL' ? 'بحرانی' :
                  customerRisk.level === 'HIGH' ? 'پرریسک' :
                  customerRisk.level === 'MEDIUM' ? 'متوسط' : 'سالم'
                })
              </span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  customerRisk.level === 'CRITICAL' ? 'bg-danger' :
                  customerRisk.level === 'HIGH' ? 'bg-warning' :
                  customerRisk.level === 'MEDIUM' ? 'bg-primary' : 'bg-success'
                }`}
                style={{ width: `${Math.min(100, customerRisk.score)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-canvas rounded-2xl border border-border">
            <span className="text-xs text-text-secondary font-bold block mb-1">مانده بدهی تجاری</span>
            <SecureField state={state} entityType="Account" field="balance">
              {(mode) => (
                <strong className={`text-base font-mono font-black block ${currentBalance > 0 ? 'text-danger' : 'text-text-main'}`}>
                  {mode === 'SEE' ? '***' : formatCurrency(currentBalance)} <span className="text-xs font-normal text-text-secondary font-sans">ریال</span>
                </strong>
              )}
            </SecureField>
          </div>
          <div className="p-3 bg-canvas rounded-2xl border border-border">
            <span className="text-xs text-text-secondary font-bold block mb-1">سقف اعتبار مصوب</span>
            <SecureField state={state} entityType="Account" field="creditLimit">
              {(mode) => (
                <strong className="text-base font-mono font-black text-primary block">
                  {mode === 'SEE' ? 'محدود شده' : `${formatCurrency(customer.creditLimit || 0)}`} <span className="text-xs font-normal text-text-secondary font-sans">ریال</span>
                </strong>
              )}
            </SecureField>
          </div>
          <div className="p-3 bg-canvas rounded-2xl border border-border">
            <span className="text-xs text-text-secondary font-bold block mb-1">پیش‌فاکتورها</span>
            <strong className="text-base font-mono font-black text-text-main block">
              {accountQuotes.length} <span className="text-xs font-normal text-text-secondary font-sans">سند</span>
            </strong>
          </div>
          <div className="p-3 bg-canvas rounded-2xl border border-border">
            <span className="text-xs text-text-secondary font-bold block mb-1">وظایف باز</span>
            <strong className="text-base font-mono font-black text-text-main block">
              {accountTasks.filter(t => t.status !== 'COMPLETED').length} <span className="text-xs font-normal text-text-secondary font-sans">مورد</span>
            </strong>
          </div>
        </div>

        {/* Quick Action Dock */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center gap-2.5">
          <button onClick={handleCreateNewQuote} className="flex-1 min-w-[140px] py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer">
            <Plus size={16} /> صدور پیش‌فاکتور
          </button>
          {[
            { icon: ActivityIcon, label: 'فعالیت', color: 'text-primary', action: () => setIsActivityModalOpen(true) },
            { icon: MessageSquare, label: 'یادداشت', color: 'text-accent', action: () => setIsNoteModalOpen(true) },
            { icon: CheckSquare, label: 'تسک', color: 'text-success', action: () => setIsTaskModalOpen(true) },
            { icon: TrendingUp, label: 'فرصت', color: 'text-warning', action: () => setIsOppModalOpen(true) },
            { icon: Wallet, label: 'وصولی', color: 'text-success', action: () => setIsPaymentModalOpen(true) },
            { icon: ShieldAlert, label: 'تیکت', color: 'text-danger', action: () => setIsCaseModalOpen(true) }
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} className="py-2.5 px-3.5 bg-canvas hover:bg-border border border-border text-text-main rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs">
              <btn.icon size={16} className={btn.color} /> <span className="hidden sm:inline">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Tabs */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm p-1.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { id: 'OVERVIEW', label: 'خلاصه و شناسنامه', icon: Building2, count: (customer.contacts || []).length },
            { id: 'ACTIVITIES_TASKS', label: 'فعالیت و پیگیری', icon: ActivityIcon, count: accountActivities.length + accountNotes.length + accountTasks.length },
            { id: 'SALES_FINANCE', label: 'فروش و مالی', icon: FileText, count: accountQuotes.length + accountOpportunities.length + accountPayments.length },
            { id: 'CASES_AUDIT', label: 'پشتیبانی و ردپا', icon: ShieldAlert, count: accountCases.length + accountAuditLogs.length }
          ].map(t => {
            const isActive = activeSubTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id as TabKey)}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer select-none",
                  isActive ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-main hover:bg-canvas"
                )}
              >
                <Icon size={16} className={isActive ? "text-white" : "text-primary shrink-0"} />
                <span className="truncate">{t.label}</span>
                {t.count > 0 && (
                  <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-mono shrink-0", isActive ? "bg-white/20 text-white" : "bg-canvas text-text-secondary border border-border")}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="space-y-4">
        {activeSubTab === 'OVERVIEW' && (
          <div className="space-y-4">
            {/* Contextual Intelligence Panel (Churn) */}
            <div className={cn(
              "p-5 rounded-3xl border shadow-sm transition-all",
              churnPrediction.riskTier === 'CRITICAL' ? "bg-danger-soft border-danger-border" :
              churnPrediction.riskTier === 'HIGH' ? "bg-warning-soft border-warning-border" :
              churnPrediction.riskTier === 'MEDIUM' ? "bg-primary-soft border-primary/20" :
              "bg-surface border-border"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                    churnPrediction.riskTier === 'CRITICAL' ? "bg-danger text-white border-danger-border" :
                    churnPrediction.riskTier === 'HIGH' ? "bg-warning text-white border-warning-border" :
                    churnPrediction.riskTier === 'MEDIUM' ? "bg-primary text-white border-primary/20" :
                    "bg-success text-white border-success-border"
                  )}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-extrabold text-text-main">هوش تحلیلی پیش‌بینی ریزش (Churn Prediction)</h3>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-lg text-xs font-black font-mono border",
                        churnPrediction.riskTier === 'CRITICAL' ? "bg-danger-soft text-danger border-danger-border" :
                        churnPrediction.riskTier === 'HIGH' ? "bg-warning-soft text-warning border-warning-border" :
                        churnPrediction.riskTier === 'MEDIUM' ? "bg-primary-soft text-primary border-primary/20" :
                        "bg-success-soft text-success border-success-border"
                      )}>
                        {churnPrediction.riskTierLabel} — {churnPrediction.churnScore.toLocaleString('fa-IR')}٪
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">محاسبه مبتنی بر کهنگی سفارش، تعاملات اخیر، مطالبات معوق و تغییرات الگوی خرید</p>
                  </div>
                </div>
                <Button size="sm" variant={churnPrediction.riskTier === 'CRITICAL' ? 'danger' : 'primary'} onClick={handleCreateRetentionTask} icon={<Plus size={14} />}>
                  ثبت وظیفه پیشگیری از ریزش
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div className="p-4 rounded-2xl bg-canvas border border-border space-y-2">
                  <span className="font-bold text-text-main text-sm">عوامل محرک ریزش:</span>
                  <ul className="space-y-1.5 text-xs text-text-secondary list-disc pr-4">
                    {churnPrediction.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
                <div className="p-4 rounded-2xl bg-canvas border border-border space-y-2">
                  <span className="font-bold text-text-main text-sm">راهکارهای پیشنهادی (Next Best Action):</span>
                  <ul className="space-y-1.5 text-xs text-text-secondary list-disc pr-4">
                    {churnPrediction.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="bg-surface border border-border rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" /> مخاطبین رسمی حساب
                </h3>
                {canEditAccount && (
                  <Button size="sm" variant="outline" onClick={() => setContactModal({})} icon={<Plus size={14} />}>افزودن مخاطب</Button>
                )}
              </div>
              {(customer.contacts || []).length === 0 ? (
                <p className="text-sm text-text-secondary py-4 text-center bg-canvas rounded-2xl border border-dashed border-border">هنوز مخاطبی برای این حساب ثبت نشده است.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(customer.contacts || []).map(contact => (
                    <div key={contact.id} className="p-4 rounded-2xl border border-border bg-canvas flex items-center justify-between">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-text-main font-bold truncate">{contact.name}</strong>
                          {contact.isPrimary && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-soft text-primary border border-primary/20 shrink-0">مخاطب اصلی</span>}
                        </div>
                        <span className="text-text-secondary text-xs block">{contact.title || (contact as any).role || 'مسئول ارتباط'}</span>
                        {contact.email && <div className="text-text-secondary text-[11px] font-mono truncate">{contact.email}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {contact.phone && <a href={`tel:${contact.phone}`} className="p-2 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"><Phone size={16} /></a>}
                        {canEditAccount && <button onClick={() => setContactModal({ initial: contact })} className="text-xs font-bold text-text-secondary hover:text-primary px-3 py-2 rounded-lg hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer">ویرایش</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-surface border border-border rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> جریان زمانی تعاملات (Timeline)
              </h3>
              {unifiedTimeline.length > 0 ? (
                <div className="relative border-r-2 border-border mr-4 pr-6 space-y-4 pt-2">
                  {unifiedTimeline.slice(0, 8).map(ev => {
                    const Icon = ev.icon;
                    return (
                      <div key={ev.id} className="relative group">
                        <div className="absolute -right-[37px] top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface bg-canvas text-text-secondary shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                          <Icon size={14} />
                        </div>
                        <div className="p-4 bg-canvas border border-border rounded-2xl hover:border-primary/40 transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <strong className="text-sm font-bold text-text-main">{ev.title}</strong>
                            <span className="text-xs text-text-secondary font-mono">{formatAppDate(ev.date, state.settings?.locale)}</span>
                          </div>
                          {ev.description && <p className="text-sm text-text-secondary leading-relaxed">{ev.description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={<History className="w-10 h-10 text-text-secondary opacity-50" />} title="رویدادی ثبت نشده است" description="" />
              )}
            </div>
          </div>
        )}

        {/* Other tabs remain functionally identical but use new components (Card, Button, etc.) where applicable. For brevity in this full-file replacement, we map them to the new design tokens. */}
        {activeSubTab === 'ACTIVITIES_TASKS' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'ALL', label: 'همه موارد', count: accountActivities.length + accountNotes.length + accountTasks.length },
                { id: 'ACTIVITIES', label: 'فعالیت‌ها', count: accountActivities.length },
                { id: 'NOTES', label: 'یادداشت‌ها', count: accountNotes.length },
                { id: 'TASKS', label: 'تسک‌ها', count: accountTasks.length }
              ].map(f => (
                <button key={f.id} onClick={() => setActivitiesFilter(f.id as any)} className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap border", activitiesFilter === f.id ? "bg-primary-soft text-primary border-primary/30 shadow-sm" : "bg-surface text-text-secondary border-border hover:bg-canvas")}>
                  {f.label} <span className="font-mono text-xs">({f.count})</span>
                </button>
              ))}
            </div>
            {/* Activities List */}
            {(activitiesFilter === 'ALL' || activitiesFilter === 'ACTIVITIES') && accountActivities.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1"><h3 className="text-sm font-bold text-text-main flex items-center gap-2"><ActivityIcon size={16} className="text-primary" /> فعالیت‌ها</h3><Button size="sm" variant="outline" onClick={() => setIsActivityModalOpen(true)} icon={<Plus size={14}/>}>ثبت فعالیت</Button></div>
                {accountActivities.map(a => (
                  <div key={a.id} className="p-4 bg-surface border border-border rounded-2xl shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-primary-soft text-primary border border-primary/20">{a.type}</span>
                        <strong className="text-sm font-bold text-text-main">{a.title}</strong>
                      </div>
                      <span className="text-xs font-mono text-text-secondary">{formatAppDate(a.dateTime, state.settings?.locale)}</span>
                    </div>
                    {a.description && <p className="text-sm text-text-secondary leading-relaxed">{a.description}</p>}
                  </div>
                ))}
              </div>
            )}
            {/* Notes List */}
            {(activitiesFilter === 'ALL' || activitiesFilter === 'NOTES') && accountNotes.length > 0 && (
              <div className="space-y-3 mt-6">
                <div className="flex justify-between items-center px-1"><h3 className="text-sm font-bold text-text-main flex items-center gap-2"><MessageSquare size={16} className="text-accent" /> یادداشت‌ها</h3><Button size="sm" variant="outline" onClick={() => setIsNoteModalOpen(true)} icon={<Plus size={14}/>}>ثبت یادداشت</Button></div>
                {accountNotes.map((n: any) => {
                  const author = state.users?.find(u => u.id === n.authorId);
                  return (
                    <div key={n.id} className="p-4 bg-surface border border-border rounded-2xl shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-text-main flex items-center gap-1.5"><User size={14} className="text-text-secondary" />{author ? author.name : 'کاربر سیستم'}</span>
                        <span className="text-xs font-mono text-text-secondary">{formatAppDate(n.createdAt, state.settings?.locale)}</span>
                      </div>
                      <p className="text-sm text-text-main leading-relaxed bg-canvas p-3 rounded-xl border border-border">{n.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Tasks List */}
            {(activitiesFilter === 'ALL' || activitiesFilter === 'TASKS') && accountTasks.length > 0 && (
              <div className="space-y-3 mt-6">
                <div className="flex justify-between items-center px-1"><h3 className="text-sm font-bold text-text-main flex items-center gap-2"><CheckSquare size={16} className="text-success" /> وظایف</h3><Button size="sm" variant="outline" onClick={() => setIsTaskModalOpen(true)} icon={<Plus size={14}/>}>ایجاد تسک</Button></div>
                {accountTasks.map(t => (
                  <div key={t.id} className="p-4 flex justify-between items-center bg-surface border border-border rounded-2xl shadow-sm">
                    <div>
                      <h4 className="text-sm font-bold text-text-main">{t.title}</h4>
                      {t.description && <p className="text-xs text-text-secondary mt-1">{t.description}</p>}
                      <div className="text-xs text-text-secondary mt-2 font-mono flex items-center gap-1.5"><Clock size={14} /> مهلت: {formatAppDate(t.dueDate, state.settings?.locale)}</div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-canvas text-text-secondary border border-border">{getPersianStatusLabel(t.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'SALES_FINANCE' && (
          <div className="space-y-4">
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'ALL', label: 'همه موارد', count: accountQuotes.length + accountOpportunities.length + accountPayments.length },
                { id: 'QUOTES', label: 'پیش‌فاکتورها', count: accountQuotes.length },
                { id: 'OPPORTUNITIES', label: 'فرصت‌های فروش', count: accountOpportunities.length },
                { id: 'PAYMENTS', label: 'وصولی و دریافت', count: accountPayments.length }
              ].map(f => (
                <button key={f.id} onClick={() => setSalesFilter(f.id as any)} className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap border", salesFilter === f.id ? "bg-primary-soft text-primary border-primary/30 shadow-sm" : "bg-surface text-text-secondary border-border hover:bg-canvas")}>
                  {f.label} <span className="font-mono text-xs">({f.count})</span>
                </button>
              ))}
            </div>
            {/* Quotes */}
            {(salesFilter === 'ALL' || salesFilter === 'QUOTES') && accountQuotes.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1"><h3 className="text-sm font-bold text-text-main flex items-center gap-2"><FileText size={16} className="text-primary" /> پیش‌فاکتورها</h3><Button size="sm" variant="primary" onClick={handleCreateNewQuote} icon={<Plus size={14}/>}>صدور پیش‌فاکتور</Button></div>
                {accountQuotes.map(q => (
                  <div key={q.id} className="p-4 flex justify-between items-center bg-surface border border-border rounded-2xl shadow-sm hover:border-primary/40 transition-colors">
                    <div>
                      <strong className="text-sm font-bold text-text-main font-mono">{q.quoteNumber}</strong>
                      <div className="text-xs text-text-secondary mt-1 font-mono">{formatAppDate(q.createdAt, state.settings?.locale)} | اقلام: {q.lines?.length || 0}</div>
                    </div>
                    <div className="text-left font-mono">
                      <strong className="text-sm font-bold text-text-main block">{formatCurrency(q.totalAmount)} ریال</strong>
                      <span className="text-[10px] text-text-secondary block mt-0.5">مارجین: {q.marginPercent}٪</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Opportunities */}
            {(salesFilter === 'ALL' || salesFilter === 'OPPORTUNITIES') && accountOpportunities.length > 0 && (
              <div className="space-y-3 mt-6">
                <div className="flex justify-between items-center px-1"><h3 className="text-sm font-bold text-text-main flex items-center gap-2"><TrendingUp size={16} className="text-accent" /> فرصت‌ها</h3><Button size="sm" variant="outline" onClick={() => setIsOppModalOpen(true)} icon={<Plus size={14}/>}>ثبت فرصت</Button></div>
                {accountOpportunities.map(opp => (
                  <div key={opp.id} className="p-4 flex justify-between items-center bg-surface border border-border rounded-2xl shadow-sm">
                    <div>
                      <strong className="text-sm font-bold text-text-main">{opp.title}</strong>
                      <div className="text-xs text-text-secondary mt-1 font-mono">{formatCurrency(opp.amount)} ریال</div>
                    </div>
                    <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary-soft text-primary border border-primary/20">{getPersianStatusLabel(opp.stage)}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Payments */}
            {(salesFilter === 'ALL' || salesFilter === 'PAYMENTS') && accountPayments.length > 0 && (
              <div className="space-y-3 mt-6">
                <div className="flex justify-between items-center px-1"><h3 className="text-sm font-bold text-text-main flex items-center gap-2"><Wallet size={16} className="text-success" /> وصولی‌ها</h3><Button size="sm" variant="outline" onClick={() => setIsPaymentModalOpen(true)} icon={<Plus size={14}/>}>ثبت وصولی</Button></div>
                {accountPayments.map(p => (
                  <div key={p.id} className="p-4 flex justify-between items-center text-sm bg-surface border border-border rounded-2xl shadow-sm">
                    <div>
                      <span className="font-bold text-text-main">{p.method || 'واریز نقدی'}</span>
                      <span className="text-text-secondary font-mono block text-xs mt-1">{formatAppDate(p.date, state.settings?.locale)}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="font-bold text-success block">{formatCurrency(p.amount)} ریال</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'CASES_AUDIT' && (
          <div className="space-y-4">
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'ALL', label: 'همه موارد', count: accountCases.length + accountAuditLogs.length },
                { id: 'CASES', label: 'تیکت‌های پشتیبانی', count: accountCases.length },
                { id: 'AUDIT', label: 'ردپا و تاریخچه سیستمی', count: accountAuditLogs.length }
              ].map(f => (
                <button key={f.id} onClick={() => setCasesFilter(f.id as any)} className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap border", casesFilter === f.id ? "bg-primary-soft text-primary border-primary/30 shadow-sm" : "bg-surface text-text-secondary border-border hover:bg-canvas")}>
                  {f.label} <span className="font-mono text-xs">({f.count})</span>
                </button>
              ))}
            </div>
            {/* Cases */}
            {(casesFilter === 'ALL' || casesFilter === 'CASES') && accountCases.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1"><h3 className="text-sm font-bold text-text-main flex items-center gap-2"><ShieldAlert size={16} className="text-danger" /> تیکت‌ها</h3><Button size="sm" variant="outline" onClick={() => setIsCaseModalOpen(true)} icon={<Plus size={14}/>}>ثبت تیکت</Button></div>
                {accountCases.map((c: any) => (
                  <div key={c.id} className="p-4 flex justify-between items-center bg-surface border border-border rounded-2xl shadow-sm">
                    <div>
                      <h4 className="text-sm font-bold text-text-main">{c.subject}</h4>
                      <span className="text-xs text-text-secondary font-mono mt-1 block">شماره: {c.caseNumber}</span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-canvas text-text-secondary border border-border">{getPersianStatusLabel(c.status)}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Audit Logs */}
            {(casesFilter === 'ALL' || casesFilter === 'AUDIT') && accountAuditLogs.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-sm font-bold text-text-main flex items-center gap-2 px-1"><History size={16} className="text-text-secondary" /> تاریخچه سیستمی</h3>
                {accountAuditLogs.map(l => (
                  <div key={l.id} className="p-3 text-sm space-y-1.5 bg-surface border border-border rounded-xl shadow-sm">
                    <div className="flex justify-between text-text-secondary font-mono text-xs">
                      <span className="font-bold text-text-main">{l.action}</span>
                      <span>{formatAppDate(l.createdAt, state.settings?.locale)}</span>
                    </div>
                    <p className="text-text-main text-xs leading-relaxed">{l.details}</p>
                    <span className="text-[10px] text-text-secondary block">مجری: {l.actor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {receiptNotice && <div role="status" className="fixed inset-x-4 top-4 z-[60] mx-auto max-w-md rounded-2xl border border-border bg-surface p-4 text-sm font-bold text-text-main shadow-modal">{receiptNotice}</div>}

      {/* Modals */}
      {isActivityModalOpen && (
        <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} title="ثبت فعالیت و تعامل با مشتری">
          <DynamicFormRenderer schema={ACTIVITY_FORM_SCHEMA} initialValues={{ activityType: 'CALL', outcome: 'FOLLOW_UP', visitLocationType: 'STORE' }} onSubmit={handleDynamicActivitySubmit} onCancel={() => setIsActivityModalOpen(false)} submitLabel="ثبت فعالیت" />
        </Modal>
      )}
      {isNoteModalOpen && (
        <Modal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} title="ثبت سابقه و یادداشت مشتری">
          <DynamicFormRenderer schema={NOTE_FORM_SCHEMA} initialValues={{ category: 'GENERAL', isImportant: false }} onSubmit={handleDynamicNoteSubmit} onCancel={() => setIsNoteModalOpen(false)} submitLabel="ذخیره یادداشت" />
        </Modal>
      )}
      {isTaskModalOpen && (
        <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="تعریف وظیفه پیگیری">
          <DynamicFormRenderer schema={createTaskFormSchema(state.users || [])} initialValues={{ priority: 'NORMAL', dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], assigneeId: state.currentUserId || state.users?.[0]?.id || '', taskCategory: 'FOLLOW_UP' }} onSubmit={handleDynamicTaskSubmit} onCancel={() => setIsTaskModalOpen(false)} submitLabel="ایجاد وظیفه" />
        </Modal>
      )}
      {isOppModalOpen && (
        <Modal isOpen={isOppModalOpen} onClose={() => setIsOppModalOpen(false)} title="ثبت فرصت تجاری جدید">
          <DynamicFormRenderer schema={OPPORTUNITY_FORM_SCHEMA} initialValues={{ stage: 'DISCOVERY', probability: '50', expectedCloseDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0] }} onSubmit={handleDynamicOppSubmit} onCancel={() => setIsOppModalOpen(false)} submitLabel="ثبت فرصت" />
        </Modal>
      )}
      {isCaseModalOpen && (
        <Modal isOpen={isCaseModalOpen} onClose={() => setIsCaseModalOpen(false)} title="ثبت پرونده خدمات و پشتیبانی">
          <DynamicFormRenderer schema={SERVICE_CASE_SCHEMA} initialValues={{ priority: 'NORMAL', caseType: 'LOGISTICS', slaHours: '24' }} onSubmit={handleDynamicCaseSubmit} onCancel={() => setIsCaseModalOpen(false)} submitLabel="ثبت تیکت" />
        </Modal>
      )}
      {isPaymentModalOpen && (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="ثبت سند وصولی">
          <DynamicFormRenderer schema={PAYMENT_RECEIPT_SCHEMA} initialValues={{ method: 'TRANSFER', date: new Date().toISOString().split('T')[0] }} onSubmit={handleDynamicPaymentSubmit} onCancel={() => setIsPaymentModalOpen(false)} submitLabel="ثبت وصولی" />
        </Modal>
      )}
      {contactModal && (
        <Modal isOpen onClose={() => setContactModal(null)} title={contactModal.initial ? 'ویرایش مخاطب' : 'افزودن مخاطب'}>
          <DynamicFormRenderer schema={CONTACT_FORM_SCHEMA} initialValues={contactModal.initial ? { ...contactModal.initial, landline: contactModal.initial.phone || '' } : { isPrimary: !customer.contacts?.length }} onSubmit={handleDynamicContactSubmit} onCancel={() => setContactModal(null)} submitLabel="ثبت مخاطب" />
        </Modal>
      )}
    </div>
  );
}
