import { guard, requireActiveUser } from '../hooks/useCan';
import React, { useState, useMemo } from 'react';
import { 
  Account, AppState, Quote, ID, CustomerTask, Activity, 
  Opportunity, Case, CustomerPayment, CustomerNote, Mention, Priority, OpportunityStage 
} from '../types';
import { 
  ChevronRight, Phone, MapPin, Wallet, FileText, 
  CheckSquare, Clock, Plus, Building2, User, Send, 
  CheckCircle2, ShieldAlert, TrendingUp, History, MessageSquare, 
  Users, GitBranch, ArrowUpRight, AlertTriangle, UserCheck, Calendar, Activity as ActivityIcon
} from 'lucide-react';
import { 
  formatCurrency, generateId, formatAppDate, 
  cleanNumericInput, formatInputCurrency, parsePersianNumber, nextSequenceNumber, cn } from '../lib/utils';
import { processTaskCollaborationEvents, processEntityMentions } from '../lib/collaboration';
import { Card } from './ui/Card';
import { Avatar } from './ui/Avatar';
import { EmptyState } from './ui/EmptyState';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { checkReceipt, buildReceiptPayment } from '../lib/receiptFlow';
import { Input } from './ui/Input';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { SecureField } from './ui/SecureField';
import { RBACService } from '../lib/rbac';
import { getDefaultCreditLimit } from '../lib/orgPolicy';
import { calculateCustomerRiskScore, calculateDaysOverdue } from '../services/collectionEngine';
import { predictAccountChurn, generateChurnMitigationTask } from '../services/churnPredictionService';
import { DynamicFormRenderer } from './shared/DynamicFormRenderer';
import { getPersianStatusLabel } from '../lib/labels';
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

type TabKey = 
  | 'OVERVIEW' 
  | 'TIMELINE' 
  | 'ACTIVITIES' 
  | 'NOTES' 
  | 'QUOTES' 
  | 'OPPORTUNITIES' 
  | 'TASKS' 
  | 'CASES' 
  | 'FINANCE' 
  | 'AUDIT';

export function Customer360({ customer, state, onBack, updateState, setActiveTab }: Customer360Props) {
  const [activeSubTab, setActiveSubTab] = useState<TabKey>('OVERVIEW');

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
      id: string;
      title: string;
      description?: string;
      date: string;
      type: 'QUOTE' | 'TASK' | 'ACTIVITY' | 'NOTE' | 'PAYMENT' | 'OPPORTUNITY' | 'CASE' | 'AUDIT';
      icon: any;
      color: string;
    }> = [];

    accountQuotes.forEach(q => {
      list.push({
        id: `q_${q.id}`,
        title: `پیش‌فاکتور ${q.quoteNumber}`,
        description: `مبلغ: ${formatCurrency(q.totalAmount)} ریال | وضعیت: ${getPersianStatusLabel(q.status)}`,
        date: q.createdAt,
        type: 'QUOTE',
        icon: FileText,
        color: 'text-primary bg-primary/10'
      });
    });

    accountActivities.forEach(a => {
      list.push({
        id: `act_${a.id}`,
        title: `فعالیت: ${a.title}`,
        description: a.description,
        date: a.dateTime,
        type: 'ACTIVITY',
        icon: ActivityIcon,
        color: 'text-info bg-info-soft'
      });
    });

    accountNotes.forEach((n: any) => {
      list.push({
        id: `note_${n.id}`,
        title: 'ثبت سابقه و یادداشت مشتری',
        description: n.content,
        date: n.createdAt,
        type: 'NOTE',
        icon: MessageSquare,
        color: 'text-warning bg-warning-soft'
      });
    });

    accountTasks.forEach(t => {
      list.push({
        id: `tsk_${t.id}`,
        title: `وظیفه: ${t.title}`,
        description: `مهلت: ${formatAppDate(t.dueDate, state.settings?.locale)} | وضعیت: ${getPersianStatusLabel(t.status)}`,
        date: t.createdAt,
        type: 'TASK',
        icon: CheckSquare,
        color: 'text-success bg-success-soft'
      });
    });

    accountPayments.forEach(p => {
      list.push({
        id: `pay_${p.id}`,
        title: `وصولی و تسویه: ${formatCurrency(p.amount)} ریال`,
        description: `شیوه پرداخت: ${p.method || 'واریز بانکی'} | وضعیت: ${getPersianStatusLabel(p.status)}`,
        date: p.date,
        type: 'PAYMENT',
        icon: Wallet,
        color: 'text-success bg-success-soft'
      });
    });

    accountOpportunities.forEach(o => {
      list.push({
        id: `opp_${o.id}`,
        title: `فرصت تجاری: ${o.title}`,
        description: `مبلغ: ${formatCurrency(o.amount)} ریال | مرحله: ${getPersianStatusLabel(o.stage)}`,
        date: o.createdAt,
        type: 'OPPORTUNITY',
        icon: TrendingUp,
        color: 'text-primary bg-primary/10'
      });
    });

    accountCases.forEach((c: any) => {
      list.push({
        id: `cs_${c.id}`,
        title: `پرونده خدمات: ${c.subject}`,
        description: `شماره: ${c.caseNumber} | اولویت: ${getPersianStatusLabel(c.priority)} | وضعیت: ${getPersianStatusLabel(c.status)}`,
        date: c.createdAt,
        type: 'CASE',
        icon: ShieldAlert,
        color: 'text-danger bg-danger-soft'
      });
    });

    accountAuditLogs.forEach(l => {
      list.push({
        id: `log_${l.id}`,
        title: `عملیات سیستمی: ${l.action}`,
        description: `${l.details} توسط ${l.actor}`,
        date: l.createdAt,
        type: 'AUDIT',
        icon: History,
        color: 'text-text-secondary bg-canvas'
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    accountQuotes, accountActivities, accountNotes, accountTasks, 
    accountPayments, accountOpportunities, accountCases, accountAuditLogs, state.settings?.locale
  ]);

  const resolveMentions = (selectedIds: string[]): Mention[] => {
    return selectedIds.map(id => {
      const u = state.users?.find(x => x.id === id);
      if (u) return { id, type: 'USER', display: `@${u.name}` };
      const g = (state.groups || []).find(x => x.id === id);
      if (g) return { id, type: 'GROUP', display: `@${g.name}` };
      return { id, type: 'CUSTOMER', display: '@مشتری' };
    });
  };

  const handleDynamicActivitySubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'activities', 'CREATE', 'ثبت فعالیت')) return;
    if (!requireActiveUser(state, updateState, 'ثبت فعالیت')) return;
    if (!new RBACService(state).canActOnRecord('activities', 'CREATE', { ownerId: (customer as any).ownerId, branchId: (customer as any).branchId, territoryId: (customer as any).territoryId, teamId: (customer as any).teamId, tenantId: (customer as any).tenantId })) return;
    const creator = state.users.find(user => user.id === state.currentUserId);
    const actType = values.activityType || 'CALL';
    const descriptionParts = [
      values.description?.trim(),
      values.visitLocationType ? `[محل ویزیت: ${values.visitLocationType === 'STORE' ? 'فروشگاه' : values.visitLocationType === 'OFFICE' ? 'دفتر مرکزی' : 'انبار'}]` : null,
      values.outcome ? `[نتیجه: ${values.outcome}]` : null
    ].filter(Boolean);

    const newAct: Activity = {
      id: generateId(),
      accountId: customer.id,
      customerId: customer.id,
      type: actType,
      title: String(values.title).trim(),
      description: descriptionParts.join(' - '),
      mentions: [],
      dateTime: new Date().toISOString(),
      ownerId: state.currentUserId!,
      branchId: creator?.branchId, territoryId: creator?.territoryId, teamId: creator?.teamId, tenantId: creator?.tenantId
    } as any;

    updateState(draft => {
      if (!draft.activities) draft.activities = [];
      draft.activities.unshift(newAct);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(),
        action: 'ACTIVITY_LOGGED',
        entityType: 'ACTIVITY',
        entityId: newAct.id,
        details: `فعالیت ${newAct.type} با عنوان "${newAct.title}" برای حساب ${customer.name} از طریق موتور فرم‌های پویا ثبت شد`,
        actor: state.users?.find(u => u.id === state.currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });

    setIsActivityModalOpen(false);
  };

  const handleDynamicNoteSubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'accounts', 'EDIT', 'ثبت یادداشت')) return;
    if (!requireActiveUser(state, updateState, 'ثبت یادداشت') || !canEditAccount) return;
    const creator = state.users.find(user => user.id === state.currentUserId);
    const newNote: CustomerNote = {
      id: generateId(),
      accountId: customer.id,
      content: String(values.content).trim(),
      authorId: state.currentUserId!,
      ownerId: state.currentUserId!, branchId: creator?.branchId, territoryId: creator?.territoryId, teamId: creator?.teamId, tenantId: creator?.tenantId,
      mentions: [],
      createdAt: new Date().toISOString()
    } as any;

    updateState(draft => {
      if (!draft.customerNotes) draft.customerNotes = [];
      draft.customerNotes.unshift(newNote);
      processEntityMentions(customer.name, 'یادداشت مشتری', newNote.mentions, state, draft, 'customers');
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(),
        action: 'NOTE_ADDED',
        entityType: 'CUSTOMER_NOTE',
        entityId: newNote.id,
        details: `سابقه جدید [${values.category || 'عمومی'}]${values.isImportant ? ' [پین شده]' : ''} برای حساب ${customer.name} ثبت شد`,
        actor: state.users?.find(u => u.id === state.currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });

    setIsNoteModalOpen(false);
  };

  const handleDynamicTaskSubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'tasks', 'CREATE', 'ایجاد وظیفه')) return;
    if (!requireActiveUser(state, updateState, 'ایجاد وظیفه')) return;
    if (!new RBACService(state).canActOnRecord('tasks', 'CREATE', { ownerId: (customer as any).ownerId, branchId: (customer as any).branchId, territoryId: (customer as any).territoryId, teamId: (customer as any).teamId, tenantId: (customer as any).tenantId })) return;
    const creator = state.users.find(user => user.id === state.currentUserId);
    const newTask: CustomerTask = {
      id: generateId(),
      accountId: customer.id,
      customerId: customer.id,
      title: String(values.title).trim(),
      description: String(values.description || '').trim(),
      dueDate: values.dueDate || new Date().toISOString().split('T')[0],
      status: 'OPEN',
      priority: values.priority || 'NORMAL',
      ownerId: state.currentUserId!, branchId: creator?.branchId, territoryId: creator?.territoryId, teamId: creator?.teamId, tenantId: creator?.tenantId,
      slaStatus: 'ON_TRACK',
      assigneeType: 'USER',
      assigneeId: values.assigneeId || state.currentUserId || '',
      mentions: [],
      createdAt: new Date().toISOString()
    };

    updateState(draft => {
      if (!draft.tasks) draft.tasks = [];
      draft.tasks.unshift(newTask);
      processTaskCollaborationEvents(newTask, state, draft, true);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(),
        action: 'TASK_CREATED',
        entityType: 'TASK',
        entityId: newTask.id,
        details: `وظیفه "${newTask.title}" [${values.taskCategory || 'پیگیری'}] برای حساب ${customer.name} از طریق موتور فرم‌های پویا ثبت شد`,
        actor: state.users?.find(u => u.id === state.currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });

    setIsTaskModalOpen(false);
  };

  const handleDynamicOppSubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'opportunities', 'CREATE', 'ثبت فرصت')) return;
    if (!requireActiveUser(state, updateState, 'ثبت فرصت')) return;
    if (!new RBACService(state).canActOnRecord('opportunities', 'CREATE', { ownerId: (customer as any).ownerId, branchId: (customer as any).branchId, territoryId: (customer as any).territoryId, teamId: (customer as any).teamId, tenantId: (customer as any).tenantId })) return;
    const amt = Number(values.amount) || 0;
    const creator = state.users.find(user => user.id === state.currentUserId);
    const newOpp: Opportunity = {
      id: generateId(),
      accountId: customer.id,
      title: String(values.title).trim(),
      amount: amt,
      stage: values.stage || 'DISCOVERY',
      expectedCloseDate: values.expectedCloseDate,
      ownerId: state.currentUserId!,
      branchId: creator?.branchId, territoryId: creator?.territoryId, teamId: creator?.teamId, tenantId: creator?.tenantId,
      createdAt: new Date().toISOString()
    };

    updateState(draft => {
      if (!draft.opportunities) draft.opportunities = [];
      draft.opportunities.unshift(newOpp);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(),
        action: 'OPPORTUNITY_CREATED',
        entityType: 'OPPORTUNITY',
        entityId: newOpp.id,
        details: `فرصت تجاری "${newOpp.title}" به ارزش ${amt.toLocaleString('fa-IR')} ریال ثبت شد`,
        actor: state.users?.find(u => u.id === state.currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });

    setIsOppModalOpen(false);
  };

  const handleDynamicCaseSubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'cases', 'CREATE', 'ثبت پرونده')) return;
    if (!state.currentUserId) return;
    const newCase: Case = {
      id: generateId(),
      caseNumber: `CS-${Date.now().toString().slice(-4)}`,
      accountId: customer.id,
      subject: String(values.subject).trim(),
      description: `${String(values.description || '').trim()} [دسته‌بندی: ${values.caseType || 'عمومی'}] [مهلت SLA: ${values.slaHours || 24} ساعت]`.trim(),
      status: 'NEW',
      priority: values.priority || 'NORMAL',
      ownerId: state.currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateState(draft => {
      if (!draft.cases) draft.cases = [];
      draft.cases.unshift(newCase);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(),
        action: 'CASE_CREATED',
        entityType: 'CASE',
        entityId: newCase.id,
        details: `پرونده خدمات ${newCase.caseNumber} با موضوع "${newCase.subject}" ثبت شد`,
        actor: state.users?.find(u => u.id === state.currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });

    setIsCaseModalOpen(false);
  };

  const handleDynamicPaymentSubmit = (values: Record<string, any>) => {
    // مسیر واحد ثبت رسید: همان receiptFlow صفحه مالی (اعتبارسنجی، ضدتکرار، وضعیت «در انتظار بررسی»)؛
    // مانده‌ی مشتری فقط پس از تأیید و تخصیص حسابدار تغییر می‌کند.
    if (!new RBACService(state).canActOnRecord('payments', 'CREATE', { ownerId: (customer as any).ownerId, branchId: (customer as any).branchId, territoryId: (customer as any).territoryId, teamId: (customer as any).teamId })) {
      setReceiptNotice('دسترسی ثبت رسید پرداخت برای شما فعال نیست.'); setTimeout(() => setReceiptNotice(null), 5000); return;
    }
    const input = {
      accountId: customer.id, amount: Number(values.amount) || 0, method: values.method,
      reference: String(values.referenceNumber || values.sayadNumber || ''), bankName: values.bankName,
      date: values.date || undefined, submittedBy: state.currentUserId
    };
    const check = checkReceipt(state, input);
    if (!check.ok) { setReceiptNotice(check.errors.join(' ')); setTimeout(() => setReceiptNotice(null), 6000); return; }
    const newPayment = buildReceiptPayment(input, generateId(), new Date(), check.probableDuplicateOf);
    updateState(draft => {
      if (!draft.payments) draft.payments = [];
      if (newPayment.reference && draft.payments.some((x: any) => x.reference && x.reference.trim().toLowerCase() === newPayment.reference.trim().toLowerCase() && x.accountId === newPayment.accountId)) return;
      draft.payments.unshift(newPayment as any);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(), action: 'PAYMENT_RECEIPT_SUBMITTED', entityType: 'PAYMENT', entityId: newPayment.id,
        details: `رسید پرداخت به مبلغ ${newPayment.amount.toLocaleString('fa-IR')} ریال ثبت و برای بررسی حسابداری ارسال شد`,
        actor: draft.users?.find(u => u.id === draft.currentUserId)?.name || 'System', createdAt: new Date().toISOString()
      } as any);
    });
    setIsPaymentModalOpen(false);
    setReceiptNotice(check.probableDuplicateOf ? 'رسید ثبت شد اما شبیه یک پرداخت قبلی است؛ برای بررسی حسابدار در وضعیت «مغایرت» قرار گرفت.' : 'رسید ثبت شد و در انتظار بررسی حسابداری است.');
    setTimeout(() => setReceiptNotice(null), 5000);
  };

  const handleDynamicContactSubmit = (values: Record<string, any>) => {
    if (!guard(state, updateState, 'accounts', 'EDIT', 'ثبت مخاطب')) return;
    if (!canEditAccount) return;
    const initial = contactModal?.initial;
    const phoneField = String(values.landline || '').trim();
    updateState(draft => {
      const target = draft.accounts.find(c => c.id === customer.id);
      if (!target) return draft;
      if (!target.contacts) target.contacts = [];
      const isPrimary = !!values.isPrimary || (!initial?.id && target.contacts.length === 0);
      if (isPrimary) target.contacts.forEach(c => { c.isPrimary = false; });
      const fields = {
        name: String(values.name || '').trim(), role: values.role || '', mobile: values.mobile || '',
        phone: phoneField, email: values.email || '', notes: values.notes || '', isPrimary
      };
      const actor = draft.users?.find(u => u.id === draft.currentUserId)?.name || 'System';
      if (initial?.id) {
        const idx = target.contacts.findIndex(c => c.id === initial.id);
        if (idx >= 0) target.contacts[idx] = { ...target.contacts[idx], ...fields };
      } else {
        const id = generateId();
        target.contacts.push({ id, accountId: customer.id, ...fields });
        if (!draft.timelineEvents) draft.timelineEvents = [];
        draft.timelineEvents.push({
          id: generateId(), customerId: customer.id, type: 'STATUS_CHANGE', title: 'مخاطب جدید افزوده شد',
          description: `${fields.name}${fields.role ? ` (${fields.role})` : ''}`, dateTime: new Date().toISOString(), relatedEntityId: id
        } as any);
      }
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(), action: initial?.id ? 'CONTACT_UPDATED' : 'CONTACT_CREATED', entityType: 'ACCOUNT', entityId: customer.id,
        details: `${initial?.id ? 'ویرایش' : 'افزودن'} مخاطب «${fields.name}»`, actor, createdAt: new Date().toISOString()
      } as any);
      return draft;
    });
    setContactModal(null);
  };

  const handleCreateNewQuote = () => {
    if (!guard(state, updateState, 'quotes', 'CREATE', 'صدور پیش‌فاکتور')) return;
    if (!requireActiveUser(state, updateState, 'صدور پیش‌فاکتور')) return;
    if (!new RBACService(state).canActOnRecord('accounts', 'VIEW', { ownerId: (customer as any).ownerId, branchId: (customer as any).branchId, territoryId: (customer as any).territoryId, teamId: (customer as any).teamId, tenantId: (customer as any).tenantId })) {
      updateState(draft => { if (!draft.notifications) draft.notifications = []; draft.notifications.push({ id: generateId(), title: 'دسترسی به حساب مجاز نیست', message: 'برای صدور پیش‌فاکتور روی این حساب، مجوز مشاهده و محدوده سازمانی معتبر لازم است.', type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'quotes', entityId: customer.id }); });
      return;
    }
    const newQuoteNumber = nextSequenceNumber('QT-', (state.quotes || []).map(x => x.quoteNumber), 1001);
    const newQuoteId = generateId();
    const creator = state.users.find(user => user.id === state.currentUserId);
    updateState(draft => {
      if (!draft.quotes) draft.quotes = [];
      draft.quotes.unshift({
        id: newQuoteId,
        quoteNumber: newQuoteNumber,
        accountId: customer.id,
        ownerId: state.currentUserId!,
        branchId: creator?.branchId,
        territoryId: creator?.territoryId,
        teamId: creator?.teamId,
        tenantId: creator?.tenantId,
        status: 'DRAFT',
        lines: [],
        totalAmount: 0,
        marginPercent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({ id: generateId(), action: 'QUOTE_CREATED', entityType: 'QUOTE', entityId: newQuoteId, details: `پیش‌نویس پیش‌فاکتور ${newQuoteNumber} از پرونده مشتری ایجاد شد.`, actor: draft.users?.find(user => user.id === draft.currentUserId)?.name || 'System', createdAt: new Date().toISOString() } as any);
      draft.activeContextAccountId = customer.id;
    });
    if (setActiveTab) setActiveTab('quotes');
  };

  return (
    <div className="w-full space-y-4 pb-12">
      {churnNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-2xl flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{churnNotice}</span>
        </div>
      )}

      {/* نوار ناوبری اختصاصی بالای صفحه با فاصله استاندارد از هدر معلق */}
      <div className="flex items-center justify-between gap-2 pt-1 pb-1">
        <button 
          type="button"
          onClick={onBack} 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:text-primary bg-surface/90 hover:bg-surface border border-border px-3.5 py-2 rounded-xl shadow-xs transition-all hover:border-primary/40 cursor-pointer active:scale-95"
        >
          <ChevronRight size={16} className="text-primary" />
          <span>بازگشت به لیست حساب‌ها</span>
        </button>

        <div className="flex items-center gap-2">
          {customer.hierarchyLevel && (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              سطح: {customer.hierarchyLevel}
            </span>
          )}
          <span className={`px-2.5 py-1 text-xs font-bold rounded-xl border ${
            customer.status === 'ACTIVE' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
              : 'bg-canvas text-ink-soft border-border'
          }`}>
            {customer.status === 'ACTIVE' ? 'حساب فعال' : customer.status}
          </span>
        </div>
      </div>

      {/* کارت اصلی پروفایل ۳۶۰ مشتری با طراحی لوکس */}
      <div className="bg-surface/95 border border-border rounded-2xl p-4 sm:p-5 shadow-xs backdrop-blur-sm space-y-4">
        {/* اطلاعات هویت مشتری و تماس */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <Avatar name={customer.name} size="lg" className="ring-2 ring-primary/20 shadow-xs" />
              <span className={`absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full border-2 border-surface ${customer.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-ink tracking-tight">{customer.name}</h1>
                <span className="font-mono bg-canvas px-2 py-0.5 rounded-md text-[11px] font-bold text-ink-soft border border-border/60">
                  {customer.code || '-'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-ink-soft">
                {customer.phone && (
                  <a 
                    href={`tel:${customer.phone}`} 
                    className="font-mono flex items-center gap-1 text-ink hover:text-primary transition"
                  >
                    <Phone size={12} className="text-primary" /> {customer.phone}
                  </a>
                )}
                {route && (
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <GitBranch size={12} /> مسیر: {route.name}
                  </span>
                )}
                {customer.nationalId && (
                  <span className="font-mono text-ink-soft/80">
                    شناسه: {customer.nationalId}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ریسک و سلامت حساب اعتباری */}
          <div className="w-full sm:w-48 p-2.5 rounded-xl border border-border/70 bg-canvas/70 shrink-0">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-ink-soft font-bold">ریسک اعتباری و سلامت:</span>
              <span className={`font-black font-mono ${
                customerRisk.level === 'CRITICAL' ? 'text-red-600' :
                customerRisk.level === 'HIGH' ? 'text-amber-600' :
                customerRisk.level === 'MEDIUM' ? 'text-blue-600' : 'text-emerald-600'
              }`}>
                {customerRisk.score}٪ ({
                  customerRisk.level === 'CRITICAL' ? 'بحرانی' :
                  customerRisk.level === 'HIGH' ? 'پرریسک' :
                  customerRisk.level === 'MEDIUM' ? 'متوسط' : 'کم‌ریسک'
                })
              </span>
            </div>
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  customerRisk.level === 'CRITICAL' ? 'bg-red-500' :
                  customerRisk.level === 'HIGH' ? 'bg-amber-500' :
                  customerRisk.level === 'MEDIUM' ? 'bg-blue-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, customerRisk.score)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ۴ شاخص مالی و عملیاتی کلیدی مشتری */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="p-2.5 bg-canvas rounded-xl border border-border/60">
            <span className="text-[10px] text-ink-soft font-bold block">مانده بدهی تجاری</span>
            <SecureField state={state} entityType="Account" field="balance">
              {(mode) => (
                <strong className={`text-sm font-mono font-black block mt-0.5 ${currentBalance > 0 ? 'text-danger' : 'text-ink'}`}>
                  {mode === 'SEE' ? '***' : formatCurrency(currentBalance)} <span className="text-[10px] font-normal text-ink-soft">ریال</span>
                </strong>
              )}
            </SecureField>
          </div>

          <div className="p-2.5 bg-canvas rounded-xl border border-border/60">
            <span className="text-[10px] text-ink-soft font-bold block">سقف اعتبار مصوب</span>
            <SecureField state={state} entityType="Account" field="creditLimit">
              {(mode) => (
                <strong className="text-sm font-mono font-black text-primary block mt-0.5">
                  {mode === 'SEE' ? 'محدود شده' : `${formatCurrency(customer.creditLimit || 0)}`} <span className="text-[10px] font-normal text-ink-soft">ریال</span>
                </strong>
              )}
            </SecureField>
          </div>

          <div className="p-2.5 bg-canvas rounded-xl border border-border/60">
            <span className="text-[10px] text-ink-soft font-bold block">پیش‌فاکتورها</span>
            <strong className="text-sm font-mono font-black text-ink block mt-0.5">
              {accountQuotes.length} فقره <span className="text-[10px] font-normal text-ink-soft font-sans">({formatCurrency(totalQuotesValue)})</span>
            </strong>
          </div>

          <div className="p-2.5 bg-canvas rounded-xl border border-border/60">
            <span className="text-[10px] text-ink-soft font-bold block">پیگیری‌ها و تسک‌ها</span>
            <strong className="text-sm font-mono font-black text-ink block mt-0.5">
              {accountTasks.filter(t => t.status !== 'COMPLETED').length} <span className="text-[10px] font-normal text-ink-soft font-sans">تسک باز</span>
            </strong>
          </div>
        </div>

        {/* حساب مادر یا هلدینگ بالادستی در صورت وجود */}
        {parentAccount && (
          <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-xl text-xs flex justify-between items-center text-primary">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-primary" />
              حساب مادر / دفتر مرکزی: <strong>{parentAccount.name}</strong>
            </span>
            <button 
              onClick={() => updateState(d => { d.activeContextAccountId = parentAccount.id; })}
              className="font-bold text-primary hover:text-primary-hover flex items-center gap-0.5 cursor-pointer"
            >
              مشاهده حساب مادر <ArrowUpRight size={13} />
            </button>
          </div>
        )}

        {/* نوار عملیات سریع ۳۶۰ با طراحی شیک و دسته‌بندی‌شده */}
        <div className="pt-2 border-t border-border flex flex-wrap items-center gap-2">
          {/* دکمه برجسته صدور پیش‌فاکتور */}
          <button
            type="button"
            onClick={handleCreateNewQuote}
            className="flex-1 min-w-[140px] py-2 px-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>صدور پیش‌فاکتور (CPQ)</span>
          </button>

          {/* اکشن‌های دایره‌ای/کپسولی شیک با آیکون */}
          <button
            type="button"
            onClick={() => setIsActivityModalOpen(true)}
            className="py-2 px-3 bg-surface hover:bg-canvas border border-border text-ink rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="ثبت فعالیت و تماس"
          >
            <ActivityIcon size={14} className="text-primary" />
            <span>ثبت فعالیت</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNoteModalOpen(true)}
            className="py-2 px-3 bg-surface hover:bg-canvas border border-border text-ink rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="ثبت سابقه و یادداشت"
          >
            <MessageSquare size={14} className="text-indigo-600" />
            <span>یادداشت</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTaskModalOpen(true)}
            className="py-2 px-3 bg-surface hover:bg-canvas border border-border text-ink rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="تعریف وظیفه پیگیری"
          >
            <CheckSquare size={14} className="text-emerald-600" />
            <span>تسک پیگیری</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOppModalOpen(true)}
            className="py-2 px-3 bg-surface hover:bg-canvas border border-border text-ink rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="ثبت فرصت فروش جدید"
          >
            <TrendingUp size={14} className="text-amber-600" />
            <span>فرصت جدید</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="py-2 px-3 bg-surface hover:bg-canvas border border-border text-ink rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="ثبت وجه یا وصولی"
          >
            <Wallet size={14} className="text-success" />
            <span>ثبت وصولی</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCaseModalOpen(true)}
            className="py-2 px-3 bg-surface hover:bg-canvas border border-border text-ink rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="ثبت تیکت پشتیبانی"
          >
            <ShieldAlert size={14} className="text-rose-600" />
            <span>تیکت</span>
          </button>
        </div>
      </div>

      {/* نوار تب‌های فرعی پرونده ۳۶۰ به سبک تب‌های قطعه‌بندی‌شده مدرن با آیکون و شمارنده */}
      <div className="shrink-0 p-1.5 bg-surface border border-border rounded-2xl overflow-x-auto no-scrollbar shadow-xs">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'OVERVIEW', label: 'اطلاعات پایه', icon: Building2 },
            { id: 'TIMELINE', label: 'تایم‌لاین', count: unifiedTimeline.length, icon: History },
            { id: 'ACTIVITIES', label: 'فعالیت‌ها', count: accountActivities.length, icon: ActivityIcon },
            { id: 'NOTES', label: 'یادداشت‌ها', count: accountNotes.length, icon: MessageSquare },
            { id: 'QUOTES', label: 'پیش‌فاکتورها', count: accountQuotes.length, icon: FileText },
            { id: 'OPPORTUNITIES', label: 'فرصت‌ها', count: accountOpportunities.length, icon: TrendingUp },
            { id: 'TASKS', label: 'وظایف', count: accountTasks.length, icon: CheckSquare },
            { id: 'CASES', label: 'پشتیبانی', count: accountCases.length, icon: ShieldAlert },
            { id: 'FINANCE', label: 'مالی', count: accountPayments.length, icon: Wallet },
            { id: 'AUDIT', label: 'ردپا', count: accountAuditLogs.length, icon: Clock }
          ].map(t => {
            const isActive = activeSubTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveSubTab(t.id as TabKey)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                  isActive 
                    ? "bg-primary text-white shadow-xs font-black" 
                    : "text-ink-soft hover:text-ink hover:bg-canvas"
                )}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-primary"} />
                <span>{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                    isActive ? "bg-white/25 text-white font-black" : "bg-canvas text-ink-soft border border-border/50"
                  )}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full space-y-4">
        {activeSubTab === 'OVERVIEW' && (
          <div className="space-y-4">
            {/* تحلیل پیش‌بینی ریسک ریزش مشتری (Customer Churn Prediction) */}
            <Card padding="md" className={cn(
              "space-y-3.5 border transition-all",
              churnPrediction.riskTier === 'CRITICAL' ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800" :
              churnPrediction.riskTier === 'HIGH' ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" :
              churnPrediction.riskTier === 'MEDIUM' ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" :
              "bg-surface border-border"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    churnPrediction.riskTier === 'CRITICAL' ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300" :
                    churnPrediction.riskTier === 'HIGH' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300" :
                    churnPrediction.riskTier === 'MEDIUM' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300" :
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                  )}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-ink">هوش تحلیلی پیش‌بینی ریزش مشتری (Churn Prediction)</h3>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono border",
                        churnPrediction.riskTier === 'CRITICAL' ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300" :
                        churnPrediction.riskTier === 'HIGH' ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300" :
                        churnPrediction.riskTier === 'MEDIUM' ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300" :
                        "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300"
                      )}>
                        {churnPrediction.riskTierLabel} — {churnPrediction.churnScore.toLocaleString('fa-IR')}٪
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-soft mt-0.5">
                      محاسبه مبتنی بر کهنگی سفارش، تعاملات اخیر، مطالبات معوق و تغییرات الگوی خرید
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={churnPrediction.riskTier === 'CRITICAL' ? 'danger' : 'primary'}
                  onClick={handleCreateRetentionTask}
                  icon={<Plus size={13} />}
                >
                  ثبت وظیفه پیشگیری از ریزش
                </Button>
              </div>

              {/* دلایل و راهکارهای تحلیلی */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-surface/90 border border-border/80 space-y-1.5">
                  <span className="font-bold text-ink block text-[11px]">عوامل محرک ریزش و نشانه‌ها:</span>
                  <ul className="space-y-1 text-ink-soft text-[11px] pr-3 list-disc">
                    {churnPrediction.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-surface/90 border border-border/80 space-y-1.5">
                  <span className="font-bold text-ink block text-[11px]">راهکارهای پیشنهادی حفظ حساب:</span>
                  <ul className="space-y-1 text-ink-soft text-[11px] pr-3 list-disc">
                    {churnPrediction.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            <Card padding="md" className="space-y-3.5 bg-surface border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" /> مخاطبین رسمی حساب (Contacts)
                </h3>
                {canEditAccount && (
                  <Button size="sm" variant="outline" onClick={() => setContactModal({})} icon={<Plus size={13} />}>
                    افزودن مخاطب
                  </Button>
                )}
              </div>

              {(customer.contacts || []).length === 0 ? (
                <p className="text-xs text-ink-soft py-2">هنوز مخاطبی برای این حساب ثبت نشده است.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(customer.contacts || []).map(contact => (
                    <div key={contact.id} className="p-3 rounded-xl border border-border/80 bg-canvas/60 hover:bg-canvas transition flex items-center justify-between text-xs">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-ink font-bold truncate">{contact.name}</strong>
                          {contact.isPrimary && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-primary/10 text-primary border border-primary/20 shrink-0">
                              مخاطب اصلی
                            </span>
                          )}
                        </div>
                        <span className="text-ink-soft text-[11px] block">{contact.title || (contact as any).role || 'مسئول ارتباط'}</span>
                        {contact.email && <div className="text-ink-soft text-[10px] font-mono truncate">{contact.email}</div>}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {contact.phone && (
                          <a 
                            href={`tel:${contact.phone}`}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition cursor-pointer"
                            title={`تماس با ${contact.name}`}
                          >
                            <Phone size={14} />
                          </a>
                        )}
                        {canEditAccount && (
                          <button 
                            type="button"
                            onClick={() => setContactModal({ initial: contact })} 
                            className="text-xs font-bold text-ink-soft hover:text-primary px-2 py-1 rounded-lg hover:bg-surface border border-transparent hover:border-border transition cursor-pointer"
                          >
                            ویرایش
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card padding="md" className="space-y-3 bg-surface border border-border">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-primary" /> ساختار سازمانی و شعب (Hierarchy)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-canvas rounded-xl border border-border/60">
                  <span className="text-ink-soft block text-[11px] font-medium">حساب مادر / دفتر مرکزی:</span>
                  <span className="font-bold text-ink mt-1 block">
                    {parentAccount ? parentAccount.name : 'این حساب در راس سلسله‌مراتب قرار دارد (Headquarter)'}
                  </span>
                </div>
                <div className="p-3 bg-canvas rounded-xl border border-border/60">
                  <span className="text-ink-soft block text-[11px] font-medium">شعب و زیرمجموعه‌ها:</span>
                  <span className="font-bold text-ink mt-1 block">
                    {childAccounts.length > 0 ? `${childAccounts.length} شعبه / فروشگاه ثبت‌شده` : 'فاقد زیرمجموعه'}
                  </span>
                </div>
              </div>

              {childAccounts.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <span className="text-[11px] font-bold text-ink-soft block">فهرست شعب تابعه:</span>
                  <div className="space-y-1">
                    {childAccounts.map(child => (
                      <div key={child.id} className="p-2.5 border border-border rounded-xl flex justify-between items-center text-xs bg-surface hover:bg-canvas transition">
                        <span className="font-bold text-ink">{child.name} <span className="font-mono text-ink-soft font-normal">({child.code || '-'})</span></span>
                        <button 
                          type="button"
                          onClick={() => updateState(d => { d.activeContextAccountId = child.id; })}
                          className="text-primary hover:text-primary-dark font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <span>ورود به پرونده ۳۶۰</span>
                          <ArrowUpRight size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card padding="md" className="space-y-3 bg-surface border border-border">
              <h3 className="text-sm font-bold text-ink">مشخصات حقوقی و مالیاتی</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-canvas rounded-xl border border-border/60">
                  <span className="text-ink-soft block text-[11px] font-medium">شناسه / کد ملی:</span>
                  <span className="font-mono font-bold text-ink mt-1 block">{customer.nationalId || '-'}</span>
                </div>
                <div className="p-3 bg-canvas rounded-xl border border-border/60">
                  <span className="text-ink-soft block text-[11px] font-medium">آدرس کامل ثبت‌شده:</span>
                  <span className="font-medium text-ink mt-1 block">{customer.address || '-'}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeSubTab === 'TIMELINE' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-ink-soft px-1">جریان زمانی یکپارچه رویدادهای مشتری</h3>
            {unifiedTimeline.length > 0 ? (
              <div className="relative border-r-2 border-primary/20 mr-3 pr-4 space-y-3">
                {unifiedTimeline.map(ev => {
                  const Icon = ev.icon;
                  return (
                    <div key={ev.id} className="relative group">
                      <div className="absolute -right-[25px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-surface bg-primary text-white shadow-xs">
                        <Icon size={12} />
                      </div>
                      <div className="p-3.5 bg-surface border border-border rounded-2xl hover:border-primary/40 transition-all shadow-xs">
                        <div className="flex justify-between items-start">
                          <strong className="text-xs font-bold text-ink">{ev.title}</strong>
                          <span className="text-[10px] text-ink-soft font-mono">
                            {formatAppDate(ev.date, state.settings?.locale)}
                          </span>
                        </div>
                        {ev.description && (
                          <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">{ev.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<History className="w-8 h-8 text-ink-soft opacity-50" />} title="رویدادی ثبت نشده است" description="" />
            )}
          </div>
        )}

        {activeSubTab === 'ACTIVITIES' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-ink-soft">فعالیت‌های ثبت‌شده ({accountActivities.length})</h3>
              <Button size="sm" variant="primary" onClick={() => setIsActivityModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                ثبت فعالیت جدید
              </Button>
            </div>
            {accountActivities.length > 0 ? (
              accountActivities.map(a => (
                <Card key={a.id} padding="md" className="space-y-2 bg-surface border border-border">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {a.type}
                      </span>
                      <strong className="text-sm font-bold text-ink">{a.title}</strong>
                    </div>
                    <span className="text-[11px] font-mono text-ink-soft">
                      {formatAppDate(a.dateTime, state.settings?.locale)}
                    </span>
                  </div>
                  {a.description && <p className="text-xs text-ink-soft leading-relaxed">{a.description}</p>}
                  {a.mentions && a.mentions.length > 0 && (
                    <div className="flex gap-1 pt-1">
                      {a.mentions.map((m: any) => (
                        <span key={m.id} className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                          {m.display}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <EmptyState icon={<ActivityIcon className="w-8 h-8 text-ink-soft opacity-50" />} title="فعالیتی یافت نشد" description="اولین ویزیت، تماس یا جلسه را ثبت کنید." />
            )}
          </div>
        )}

        {activeSubTab === 'NOTES' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-ink-soft">سوابق و یادداشت‌های استراتژیک ({accountNotes.length})</h3>
              <Button size="sm" variant="primary" onClick={() => setIsNoteModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                ثبت سابقه جدید
              </Button>
            </div>
            {accountNotes.length > 0 ? (
              accountNotes.map((n: any) => {
                const author = state.users?.find(u => u.id === n.authorId);
                return (
                  <Card key={n.id} padding="md" className="space-y-2 bg-surface border border-border">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-ink flex items-center gap-1.5">
                        <User size={13} className="text-ink-soft" />
                        {author ? author.name : 'کاربر سیستم'}
                      </span>
                      <span className="text-[10px] font-mono text-ink-soft">
                        {formatAppDate(n.createdAt, state.settings?.locale)}
                      </span>
                    </div>
                    <p className="text-xs text-ink leading-relaxed bg-canvas/60 p-3 rounded-xl border border-border/70">
                      {n.content}
                    </p>
                    {n.mentions && n.mentions.length > 0 && (
                      <div className="flex gap-1">
                        {n.mentions.map((m: any) => (
                          <span key={m.id} className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                            {m.display}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              <EmptyState icon={<MessageSquare className="w-8 h-8 text-ink-soft opacity-50" />} title="هیچ یادداشتی ثبت نشده است" description="سابقه و جزئیات مذاکرات قبلی را اینجا یادداشت کنید." />
            )}
          </div>
        )}

        {activeSubTab === 'QUOTES' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-ink-soft">پیش‌فاکتورها و پیشنهادهای CPQ ({accountQuotes.length})</h3>
              <Button size="sm" variant="primary" onClick={handleCreateNewQuote} icon={<Plus className="w-3.5 h-3.5" />}>
                صدور پیش‌فاکتور جدید
              </Button>
            </div>
            {accountQuotes.length > 0 ? (
              accountQuotes.map(q => (
                <Card key={q.id} padding="md" className="flex justify-between items-center bg-surface border border-border hover:border-primary/40 transition">
                  <div>
                    <strong className="text-sm font-bold text-ink font-mono">{q.quoteNumber}</strong>
                    <div className="text-xs text-ink-soft mt-1 font-mono">
                      {formatAppDate(q.createdAt, state.settings?.locale)} | اقلام: {q.lines?.length || 0}
                    </div>
                  </div>
                  <div className="text-left flex items-center gap-3">
                    <div>
                      <strong className="text-sm font-bold text-ink font-mono block">{formatCurrency(q.totalAmount)} ریال</strong>
                      <span className="text-[10px] text-ink-soft font-mono block">مارجین: {q.marginPercent}٪</span>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-canvas text-ink-soft border border-border/60">{getPersianStatusLabel(q.status)}</span>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState icon={<FileText className="w-8 h-8 text-ink-soft opacity-50" />} title="پیش‌فاکتوری ثبت نشده است" description="" />
            )}
          </div>
        )}

        {activeSubTab === 'OPPORTUNITIES' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-ink-soft">فرصت‌های تجاری و پروپوزال‌ها ({accountOpportunities.length})</h3>
              <Button size="sm" variant="primary" onClick={() => setIsOppModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                ثبت فرصت تجاری
              </Button>
            </div>
            {accountOpportunities.length > 0 ? (
              accountOpportunities.map(opp => (
                <Card key={opp.id} padding="md" className="flex justify-between items-center bg-surface border border-border hover:border-primary/40 transition">
                  <div>
                    <strong className="text-sm font-bold text-ink">{opp.title}</strong>
                    <div className="text-xs text-ink-soft mt-1 flex items-center gap-2">
                      <span className="font-mono">{formatCurrency(opp.amount)} ریال</span>
                      <span>•</span>
                      <span>بستن احتمالی: {formatAppDate(opp.expectedCloseDate, state.settings?.locale)}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary border border-primary/20">
                    {getPersianStatusLabel(opp.stage)}
                  </span>
                </Card>
              ))
            ) : (
              <EmptyState icon={<TrendingUp className="w-8 h-8 text-ink-soft opacity-50" />} title="فرصت تجاری ثبت نشده است" description="" />
            )}
          </div>
        )}

        {activeSubTab === 'TASKS' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-ink-soft">وظایف و پیگیری‌ها ({accountTasks.length})</h3>
              <Button size="sm" variant="primary" onClick={() => setIsTaskModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                تعریف وظیفه جدید
              </Button>
            </div>
            {accountTasks.length > 0 ? (
              accountTasks.map(t => {
                let assigneeName = 'ناشناس';
                if (t.assigneeType === 'GROUP') {
                  assigneeName = state.groups?.find(g => g.id === t.assigneeId)?.name || 'گروه نامشخص';
                } else {
                  assigneeName = state.users?.find(u => u.id === t.assigneeId)?.name || 'کارشناس نامشخص';
                }

                return (
                  <Card key={t.id} padding="md" className="flex justify-between items-center bg-surface border border-border hover:border-primary/40 transition">
                    <div>
                      <h4 className="text-sm font-bold text-ink">{t.title}</h4>
                      {t.description && <p className="text-xs text-ink-soft mt-0.5">{t.description}</p>}
                      <div className="text-xs text-ink-soft mt-1 flex flex-wrap gap-2">
                        <span className="font-mono flex items-center gap-1">
                          <Clock size={12} /> {formatAppDate(t.dueDate, state.settings?.locale)}
                        </span>
                        <span>•</span>
                        <span className="text-primary font-medium">
                          مسئول: {assigneeName} ({t.assigneeType === 'GROUP' ? 'تیمی' : 'فردی'})
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-canvas text-ink-soft border border-border/60">{getPersianStatusLabel(t.status)}</span>
                  </Card>
                );
              })
            ) : (
              <EmptyState icon={<CheckSquare className="w-8 h-8 text-ink-soft opacity-50" />} title="تسک بازی وجود ندارد" description="" />
            )}
          </div>
        )}

        {activeSubTab === 'CASES' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-ink-soft">تیکت‌ها و شکایات خدمات مشتری ({accountCases.length})</h3>
              <Button size="sm" variant="primary" onClick={() => setIsCaseModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                ثبت مورد خدمات
              </Button>
            </div>
            {accountCases.length > 0 ? (
              accountCases.map((c: any) => (
                <Card key={c.id} padding="md" className="flex justify-between items-center bg-surface border border-border hover:border-primary/40 transition">
                  <div>
                    <h4 className="text-sm font-bold text-ink">{c.subject}</h4>
                    <span className="text-xs text-ink-soft font-mono mt-1 block">شماره: {c.caseNumber}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-canvas text-ink-soft border border-border/60">{getPersianStatusLabel(c.status)}</span>
                </Card>
              ))
            ) : (
              <EmptyState icon={<ShieldAlert className="w-8 h-8 text-ink-soft opacity-50" />} title="بدون سابقه پشتیبانی" description="" />
            )}
          </div>
        )}

        {activeSubTab === 'FINANCE' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-ink-soft">اسناد دریافت و وصولی‌ها ({accountPayments.length})</h3>
              <Button size="sm" variant="primary" onClick={() => setIsPaymentModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                ثبت تسویه جدید
              </Button>
            </div>
            {accountPayments.length > 0 ? (
              accountPayments.map(p => (
                <Card key={p.id} padding="sm" className="flex justify-between items-center text-xs bg-surface border border-border hover:border-primary/40 transition">
                  <div>
                    <span className="font-bold text-ink">{p.method || 'واریز نقدی'}</span>
                    <span className="text-ink-soft font-mono block text-[11px] mt-0.5">{formatAppDate(p.date, state.settings?.locale)}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="font-bold text-primary block">{formatCurrency(p.amount)} ریال</span>
                    <span className="text-[10px] text-ink-soft font-semibold">{getPersianStatusLabel(p.status)}</span>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState icon={<Wallet className="w-8 h-8 text-ink-soft opacity-50" />} title="سند پرداختی یافت نشد" description="" />
            )}
          </div>
        )}

        {activeSubTab === 'AUDIT' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-ink-soft px-1">تاریخچه تغییرات و رخدادهای سیستمی (Audit Trail)</h3>
            {accountAuditLogs.length > 0 ? (
              accountAuditLogs.map(l => (
                <Card key={l.id} padding="sm" className="text-xs space-y-1 bg-surface border border-border">
                  <div className="flex justify-between text-ink-soft font-mono text-[10px]">
                    <span className="font-bold text-ink">{l.action}</span>
                    <span>{formatAppDate(l.createdAt, state.settings?.locale)}</span>
                  </div>
                  <p className="text-ink">{l.details}</p>
                  <span className="text-[10px] text-ink-soft block">مجری: {l.actor}</span>
                </Card>
              ))
            ) : (
              <EmptyState icon={<History className="w-8 h-8 text-ink-soft opacity-50" />} title="لاگی یافت نشد" description="" />
            )}
          </div>
        )}
      </div>

      {receiptNotice && <div role="status" className="fixed inset-x-4 top-4 z-[60] mx-auto max-w-md rounded-2xl border border-border bg-white p-3 text-xs font-bold text-text-main shadow-lg">{receiptNotice}</div>}

      {/* Action Modals Powered by Central Dynamic Form Engine */}
      {isActivityModalOpen && (
        <Modal 
          isOpen={isActivityModalOpen} 
          onClose={() => setIsActivityModalOpen(false)}
          title="ثبت فعالیت و تعامل با مشتری (موتور فرم‌های پویا)"
        >
          <DynamicFormRenderer
            schema={ACTIVITY_FORM_SCHEMA}
            initialValues={{
              activityType: 'CALL',
              outcome: 'FOLLOW_UP',
              visitLocationType: 'STORE'
            }}
            onSubmit={handleDynamicActivitySubmit}
            onCancel={() => setIsActivityModalOpen(false)}
            submitLabel="ثبت و ذخیره فعالیت"
          />
        </Modal>
      )}

      {isNoteModalOpen && (
        <Modal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          title="ثبت سابقه و یادداشت مشتری (موتور فرم‌های پویا)"
        >
          <DynamicFormRenderer
            schema={NOTE_FORM_SCHEMA}
            initialValues={{
              category: 'GENERAL',
              isImportant: false
            }}
            onSubmit={handleDynamicNoteSubmit}
            onCancel={() => setIsNoteModalOpen(false)}
            submitLabel="ذخیره سابقه و یادداشت"
          />
        </Modal>
      )}

      {isTaskModalOpen && (
        <Modal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          title="تعریف وظیفه پیگیری (تسک) با موتور فرم‌های پویا"
        >
          <DynamicFormRenderer
            schema={createTaskFormSchema(state.users || [])}
            initialValues={{
              priority: 'NORMAL',
              dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
              assigneeId: state.currentUserId || state.users?.[0]?.id || '',
              taskCategory: 'FOLLOW_UP'
            }}
            onSubmit={handleDynamicTaskSubmit}
            onCancel={() => setIsTaskModalOpen(false)}
            submitLabel="ایجاد وظیفه پیگیری"
          />
        </Modal>
      )}

      {isOppModalOpen && (
        <Modal
          isOpen={isOppModalOpen}
          onClose={() => setIsOppModalOpen(false)}
          title="ثبت فرصت تجاری جدید (موتور فرم‌های پویا)"
        >
          <DynamicFormRenderer
            schema={OPPORTUNITY_FORM_SCHEMA}
            initialValues={{
              stage: 'DISCOVERY',
              probability: '50',
              expectedCloseDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
            }}
            onSubmit={handleDynamicOppSubmit}
            onCancel={() => setIsOppModalOpen(false)}
            submitLabel="ثبت فرصت تجاری"
          />
        </Modal>
      )}

      {isCaseModalOpen && (
        <Modal
          isOpen={isCaseModalOpen}
          onClose={() => setIsCaseModalOpen(false)}
          title="ثبت پرونده خدمات و پشتیبانی (موتور فرم‌های پویا)"
        >
          <DynamicFormRenderer
            schema={SERVICE_CASE_SCHEMA}
            initialValues={{
              priority: 'NORMAL',
              caseType: 'LOGISTICS',
              slaHours: '24'
            }}
            onSubmit={handleDynamicCaseSubmit}
            onCancel={() => setIsCaseModalOpen(false)}
            submitLabel="ثبت پرونده و تیکت"
          />
        </Modal>
      )}

      {isPaymentModalOpen && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="ثبت سند وصولی و دریافت وجه (موتور فرم‌های پویا)"
        >
          <DynamicFormRenderer
            schema={PAYMENT_RECEIPT_SCHEMA}
            initialValues={{
              method: 'TRANSFER',
              date: new Date().toISOString().split('T')[0]
            }}
            onSubmit={handleDynamicPaymentSubmit}
            onCancel={() => setIsPaymentModalOpen(false)}
            submitLabel="ثبت سند وصولی"
          />
        </Modal>
      )}

      {contactModal && (
        <Modal isOpen onClose={() => setContactModal(null)} title={contactModal.initial ? 'ویرایش اطلاعات مخاطب' : 'افزودن مخاطب جدید'}>
          <DynamicFormRenderer
            schema={CONTACT_FORM_SCHEMA}
            initialValues={contactModal.initial ? { ...contactModal.initial, landline: contactModal.initial.phone || '' } : { isPrimary: !customer.contacts?.length }}
            onSubmit={handleDynamicContactSubmit}
            onCancel={() => setContactModal(null)}
            submitLabel={contactModal.initial ? 'ذخیره تغییرات مخاطب' : 'افزودن مخاطب'}
          />
        </Modal>
      )}
    </div>
  );
}
