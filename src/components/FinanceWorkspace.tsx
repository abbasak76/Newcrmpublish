import { guard } from '../hooks/useCan';
import { useCan } from '../hooks/useCan';
import { DynamicFormRenderer } from './shared/DynamicFormRenderer';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppState, Cheque, Payment, Invoice, CreditNote, CreditNoteRequest } from '../types';
import { reconcileReceivables } from '../lib/receivableReconciliation';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { DataSourceStatus } from './ui/DataSourceStatus';
import { checkFinanceRequest, buildFinanceRequest, decideFinanceRequest, FINANCE_KIND_LABEL, FINANCE_STATUS_LABEL, FinanceRequestKind } from '../lib/financeRequests';
import { FINANCE_REQUEST_SCHEMA } from '../services/dynamicFormEngine';
import { DocumentField, DocFile } from './shared/DocumentField';
import { AttachmentManager } from './ui/AttachmentManager';
import { 
  Wallet, TrendingUp, AlertCircle, FileText, CheckCircle, Clock, 
  Plus, CheckCircle2, DollarSign, CreditCard, ShieldAlert, PhoneCall,
  CalendarCheck, AlertTriangle, ArrowUpRight, ShieldCheck, Check
} from 'lucide-react';
import { generateId, formatAppDate, nextSequenceNumber, cleanNumericInput } from '../lib/utils';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { 
  evaluateAllCustomerCollections, 
  generateCollectionTaskForAccount, 
  CustomerCollectionProfile 
} from '../services/collectionEngine';
import { checkReceipt, buildReceiptPayment, approveAndAllocate, markNeedsFix, transferToErp, RECEIPT_STATUS_LABEL } from '../lib/receiptFlow';
import { COLLECTION_PROMISE_SCHEMA, createInvoiceFormSchema, createPaymentReceiptFormSchema, createChequeFormSchema } from '../services/dynamicFormEngine';

interface FinanceWorkspaceProps {
  state: AppState;
  updateState?: (updater: (draft: AppState) => AppState | void) => void;
}

export function FinanceWorkspace({ state, updateState }: FinanceWorkspaceProps) {
  const { can, canOn, denied } = useCan(state, updateState);
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['overview', 'invoices', 'payments', 'cheques', 'collection', 'requests', 'expenses', 'treasury', 'credits'] as const;
  type FinanceTab = typeof validTabs[number];
  const rawTab = searchParams.get('tab');
  const tabFromUrl = (rawTab === 'checks' ? 'cheques' : rawTab) as FinanceTab | null;
  const [activeTab, setLocalTabState] = useState<FinanceTab>(() => {
    return tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';
  });

  const setLocalTab = (tab: FinanceTab) => {
    setLocalTabState(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setLocalTabState(tabFromUrl);
    }
  }, [tabFromUrl]);
  const [notice, setNotice] = useState<string | null>(null);
  const [creditInvoiceId, setCreditInvoiceId] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [creditSourceDocumentId, setCreditSourceDocumentId] = useState('');

  // Collection Engine Modal States
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  const [selectedProfileForPromise, setSelectedProfileForPromise] = useState<CustomerCollectionProfile | null>(null);
  const [showAutoTaskModal, setShowAutoTaskModal] = useState(false);
  const [selectedProfileForTask, setSelectedProfileForTask] = useState<CustomerCollectionProfile | null>(null);
  const [autoTaskDueDate, setAutoTaskDueDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [autoTaskNote, setAutoTaskNote] = useState('');

  // New Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payEvidence, setPayEvidence] = useState<DocFile | null>(null);
  const manualEntry = (state.settings as any)?.orgConfig?.allowManualFinanceEntry === true;   // فاکتور/چک پرداختی/سند در ERP صادر می‌شود؛ ورود دستی فقط با تنظیم صریح
  const [reqKind, setReqKind] = useState<FinanceRequestKind | null>(null);
  const [decide, setDecide] = useState<{ id: string; mode: 'REJECT' | 'NEEDS_INFO' } | null>(null);
  const [decideNote, setDecideNote] = useState('');
  const getFinanceRecordScope = (record: any) => {
    const accountId = record.accountId || record.customerId;
    const account = (state.accounts || []).find(item => item.id === accountId);
    const owner = state.users.find(user => user.id === (record.ownerId || record.requestedBy || record.createdByUserId));
    return {
      ownerId: record.ownerId || account?.ownerId || owner?.id,
      branchId: record.branchId || account?.branchId || owner?.branchId,
      territoryId: record.territoryId || account?.territoryId || owner?.territoryId,
      teamId: record.teamId || account?.teamId || owner?.teamId,
      tenantId: record.tenantId || account?.tenantId || owner?.tenantId
    };
  };
  const financeRequests: any[] = ((state as any).financeRequests || []).filter((request: any) =>
    !request.deletedAt && canOn('financeRequests', 'VIEW', getFinanceRecordScope(request))
  );

  // New Invoice Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // New Cheque Modal
  const [showChequeModal, setShowChequeModal] = useState(false);

  const invoices = (state.invoices || []).filter(invoice => canOn('finance', 'VIEW', getFinanceRecordScope(invoice)));
  const payments = (state.payments || []).filter(payment => canOn('payments', 'VIEW', getFinanceRecordScope(payment)));
  const mirroredCreditNotes: CreditNote[] = (state.creditNotes || []).filter(note => !note.isVoided && canOn('finance', 'VIEW', getFinanceRecordScope(note)));
  const creditNotes: CreditNoteRequest[] = (state.creditNoteRequests || []).filter(note => canOn('finance', 'VIEW', getFinanceRecordScope(note)));
  const receivableReconciliation = reconcileReceivables(state.invoices || [], state.payments || [], state.paymentAllocations || [], state.creditNoteSourceStatus === 'CONNECTED' ? (state.creditNotes || []) : undefined, new Date());
  const createCreditNote = () => {
    if (!can('finance', 'CREATE')) return denied('ثبت درخواست بستانکاری');
    if (!updateState) return;
    const invoice = invoices.find(item => item.id === creditInvoiceId); const value = Number(creditAmount);
    if (!invoice || !Number.isFinite(value) || value <= 0 || !creditReason.trim() || !creditSourceDocumentId.trim()) { setNotice('فاکتور، مبلغ مثبت، دلیل و شناسهٔ سند مرجع بستانکاری الزامی است.'); return; }
    const note: CreditNoteRequest = { id: generateId(), requestNumber: nextSequenceNumber('CNR-', creditNotes.map(item => item.requestNumber), 1), customerId: String(invoice.customerId || invoice.accountId || ''), accountId: String(invoice.accountId || invoice.customerId || ''), invoiceId: invoice.id, amount: Math.round(value), status: 'DRAFT', reason: creditReason.trim(), sourceDocumentId: creditSourceDocumentId.trim(), createdAt: new Date().toISOString(), createdBy: state.currentUserId };
    updateState(draft => { if (!draft.creditNoteRequests) draft.creditNoteRequests = []; draft.creditNoteRequests.push(note); draft.auditLogs = draft.auditLogs || []; draft.auditLogs.push({ id: generateId(), action: 'CREDIT_NOTE_REQUEST_DRAFT_CREATED', entityType: 'CREDIT_NOTE', entityId: note.id, details: `درخواست بستانکاری ${note.requestNumber}؛ فاکتور ${invoice.invoiceNumber || invoice.id}؛ مبلغ ${note.amount}`, actor: draft.currentUserId || '', createdAt: new Date().toISOString() } as any); });
    setCreditInvoiceId(''); setCreditAmount(''); setCreditReason(''); setCreditSourceDocumentId(''); setNotice('درخواست بستانکاری به‌صورت پیش‌نویس محلی ثبت شد؛ تأیید آن فقط درخواست را آمادهٔ ورود در ERP می‌کند و مانده را تغییر نمی‌دهد.');
  };
  const transitionCreditNote = (note: CreditNoteRequest, next: 'PENDING_APPROVAL' | 'APPROVED' | 'VOID') => {
    if (!updateState) return;
    if (next === 'PENDING_APPROVAL' && !can('finance', 'CREATE')) return denied('ارسال بستانکاری برای تأیید');
    if (next === 'APPROVED' && (!can('finance', 'APPROVE') || note.createdBy === state.currentUserId)) return denied('تأیید بستانکاری توسط کاربر مجاز غیر از ثبت‌کننده');
    if (next === 'VOID' && !can('finance', 'APPROVE')) return denied('ابطال بستانکاری');
    
    updateState(draft => { const target = draft.creditNoteRequests?.find(item => item.id === note.id); if (!target) return; target.status = next; if (next === 'APPROVED') target.approvedAt = new Date().toISOString(); if (next === 'VOID') target.voidedAt = new Date().toISOString(); draft.auditLogs = draft.auditLogs || []; draft.auditLogs.push({ id: generateId(), action: `CREDIT_NOTE_REQUEST_${next}`, entityType: 'CREDIT_NOTE', entityId: target.id, details: `وضعیت درخواست بستانکاری ${target.requestNumber || target.id} به ${next} تغییر کرد.`, actor: draft.currentUserId || '', createdAt: new Date().toISOString() } as any); });
    setNotice(`وضعیت درخواست بستانکاری به ${next} تغییر کرد؛ این اقدام هیچ ثبت مالی در ERP ایجاد نمی‌کند.`);
  };
  const cheques: Cheque[] = (state.cheques || []).filter(cheque => canOn('finance', 'VIEW', getFinanceRecordScope(cheque)));
  const expenses: any[] = ((state as any).expenses || []).filter((expense: any) => !expense.deletedAt && canOn('finance', 'VIEW', getFinanceRecordScope(expense)));
  const [expenseStatusFilter, setExpenseStatusFilter] = useState('ALL');
  const today = new Date().toISOString().split('T')[0];

  let totalReceivables = 0;
  let totalOverdue = 0;
  let totalCredit = 0;

  const aging = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days90Plus: 0
  };

  const recMap = new Map(receivableReconciliation.invoices.map(r => [r.invoiceId, r]));
  invoices.forEach(inv => {
    const reconciled = recMap.get(inv.id);
    const balance = reconciled ? reconciled.outstandingAmount : Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
    if (balance > 0) {
      totalReceivables += balance;
      const days = reconciled ? reconciled.daysOverdue : (inv.dueDate && inv.dueDate < today ? Math.ceil(Math.abs(new Date(today).getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0);
      if (days > 0) {
        totalOverdue += balance;
        if (days <= 30) aging.days30 += balance;
        else if (days <= 60) aging.days60 += balance;
        else if (days <= 90) aging.days90 += balance;
        else aging.days90Plus += balance;
      } else {
        aging.current += balance;
      }
    } else if (balance < 0) {
      totalCredit += Math.abs(balance);
    }
  });

  const openCheques = cheques.filter(c => ['PENDING', 'RECEIVED', 'DEPOSITED'].includes(c.status));
  const receivableCheques = cheques.filter(c => c.direction !== 'PAYABLE');
  const payableCheques = cheques.filter(c => c.direction === 'PAYABLE');
  const upcomingPayableCheques = payableCheques.filter(c => c.status !== 'CLEARED' && c.dueDate && c.dueDate >= today && c.dueDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const paidExpenses = expenses.filter(e => e.status === 'PAID').reduce((sum, e) => sum + Math.max(0, Number(e.amount) || 0), 0);
  const dueExpenses = expenses.filter(e => ['DUE', 'PENDING', 'UNPAID'].includes(String(e.status).toUpperCase())).reduce((sum, e) => sum + Math.max(0, Number(e.amount) || 0), 0);
  const expenseByCategory = expenses.reduce((acc: Record<string, number>, e: any) => { const key = String(e.category || 'بدون دسته'); acc[key] = (acc[key] || 0) + Math.max(0, Number(e.amount) || 0); return acc; }, {});
  const financialMonths = Array.from({ length: 6 }, (_, idx) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - idx)); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; return { key, label: d.toLocaleDateString('fa-IR', { month: 'short' }), invoices: 0, receipts: 0, expenses: 0 }; });
  const monthIndex = new Map(financialMonths.map((m, i) => [m.key, i]));
  const addMonthValue = (dateValue: any, field: 'invoices' | 'receipts' | 'expenses', amount: number) => { if (!dateValue || !Number.isFinite(amount)) return; const d = new Date(dateValue); if (Number.isNaN(d.getTime())) return; const idx = monthIndex.get(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); if (idx !== undefined) financialMonths[idx][field] += amount; };
  invoices.forEach(inv => addMonthValue(inv.date, 'invoices', Math.max(0, Number(inv.totalAmount) || 0)));
  payments.filter(p => p.status === 'CLEARED').forEach(p => addMonthValue(p.date, 'receipts', Math.max(0, Number(p.amount) || 0)));
  expenses.filter(e => e.status === 'PAID').forEach(e => addMonthValue(e.date, 'expenses', Math.max(0, Number(e.amount) || 0)));
  const maxMonthlyValue = Math.max(1, ...financialMonths.flatMap(m => [m.invoices, m.receipts, m.expenses]));
  const openChequesTotal = openCheques.reduce((sum, c) => sum + c.amount, 0);

  const overdueTasks = (state.tasks || []).filter(t => t.dueDate && t.dueDate < today && t.status !== 'COMPLETED').length;
  const todayVisits = (state.activities || []).filter(a => a.type === 'VISIT' && a.dateTime.startsWith(today)).length;

  const handleCreatePayment = (values: Record<string, any>) => {
    if (!can('payments', 'CREATE')) return denied('ثبت پرداخت');
    if (!updateState) return;
    // ثبت رسید: اعتبارسنجی + ضدتکرار؛ وضعیت اولیه «در انتظار بررسی» (نه تسویه‌شده)؛ مانده فقط پس از تأیید و تخصیص حسابدار تغییر می‌کند
    const input = { accountId: values.accountId, amount: Number(values.amount), method: values.method, reference: String(values.reference || ''), bankName: values.bankName, submittedBy: state.currentUserId };
    const requireEvidence = (state.settings as any)?.orgConfig?.requireReceiptEvidence !== false;
    const check = checkReceipt(state, { ...input, requireEvidence, hasEvidence: !!payEvidence });
    if (!check.ok) { setNotice(check.errors.join(' ')); setTimeout(() => setNotice(null), 6000); return; }
    const newPayment = buildReceiptPayment(input, generateId(), new Date(), check.probableDuplicateOf);
    updateState(draft => {
      if (!draft.payments) draft.payments = [];
      // لایه دوم ضدتکرار داخل updater (دوبار کلیک پیش از رندر)
      if (newPayment.reference && draft.payments.some((x: any) => x.reference && x.reference.trim().toLowerCase() === newPayment.reference.trim().toLowerCase() && x.accountId === newPayment.accountId)) return;
      draft.payments.unshift(newPayment as Payment);
      if (payEvidence) { if (!draft.attachments) draft.attachments = []; draft.attachments.push({ id: generateId(), entityId: newPayment.id, entityType: 'PAYMENT', fileName: payEvidence.fileName, fileType: payEvidence.fileType, fileSize: payEvidence.fileSize, base64Data: payEvidence.base64Data, uploadedAt: new Date().toISOString(), uploadedBy: state.currentUserId || '' } as any); }
    });
    setShowPaymentModal(false); setPayEvidence(null);
    setNotice(check.probableDuplicateOf ? 'رسید ثبت شد ولی شبیه یک پرداخت قبلی است؛ در وضعیت «مغایرت» برای بررسی حسابدار قرار گرفت.' : `رسید به مبلغ ${Number(values.amount).toLocaleString()} ریال ثبت شد و در انتظار بررسی حسابداری است.`);
    setTimeout(() => setNotice(null), 5000);
  };

  const submitFinanceRequest = (values: Record<string, any>) => {
    if (!reqKind) return;
    if (!can('financeRequests', 'CREATE')) return denied('ثبت دستور پرداخت');
    const input = { kind: reqKind, payeeName: values.payeeName, amount: Number(values.amount), reason: values.reason, dueDate: values.dueDate, requestedBy: state.currentUserId };
    const c = checkFinanceRequest(state as any, input);
    if (!c.ok) { setNotice(c.errors.join(' ')); setTimeout(() => setNotice(null), 6000); return; }
    const rec = buildFinanceRequest(input, generateId(), new Date());
    const creator = state.users.find(user => user.id === state.currentUserId);
    Object.assign(rec, { ownerId: state.currentUserId, branchId: creator?.branchId, territoryId: creator?.territoryId, teamId: creator?.teamId, tenantId: creator?.tenantId });
    updateState?.(draft => {
      const d: any = draft; if (!d.financeRequests) d.financeRequests = [];
      if (d.financeRequests.some((x: any) => x.idempotencyKey === rec.idempotencyKey && ['SUBMITTED', 'NEEDS_INFO', 'APPROVED', 'ERP_PENDING'].includes(x.status))) return;
      d.financeRequests.unshift(rec);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({ id: generateId(), action: 'FINANCE_REQUEST_CREATED', entityType: 'PAYMENT', entityId: rec.id, details: `${FINANCE_KIND_LABEL[rec.kind as FinanceRequestKind]} به ${rec.payeeName} (${rec.amount.toLocaleString('fa-IR')} ریال) برای حسابدار ثبت شد`, actor: state.users?.find(u => u.id === state.currentUserId)?.name || 'System', createdAt: new Date().toISOString() } as any);
    });
    setReqKind(null); setNotice('درخواست برای حسابدار ثبت شد. اجرا در ERP انجام می‌شود (اتصال ERP پیکربندی نشده).'); setTimeout(() => setNotice(null), 6000);
  };
  const decideRequest = (id: string, mode: 'APPROVE' | 'REJECT' | 'NEEDS_INFO', note = '') => {
    if (!can('financeRequests', 'APPROVE')) return denied('تصمیم روی دستور پرداخت');
    const request = ((state as any).financeRequests || []).find((item: any) => item.id === id);
    if (!request || !canOn('financeRequests', 'APPROVE', getFinanceRecordScope(request))) return denied('دسترسی به این دستور مالی');
    let res: { ok: boolean; reason?: string } = { ok: false };
    updateState?.(draft => { res = decideFinanceRequest(draft, id, mode, note, state.currentUserId, new Date()); });
    if (!(res as any).ok) { setNotice((res as any).reason || 'انجام نشد.'); setTimeout(() => setNotice(null), 5000); }
    setDecide(null); setDecideNote('');
  };

  const handleApprovePayment = (paymentId: string) => {
    if (!can('payments', 'ALLOCATE')) return denied('تایید و تخصیص پرداخت');
    const paymentRecord = (state.payments || []).find(item => item.id === paymentId);
    if (!paymentRecord || !canOn('payments', 'ALLOCATE', getFinanceRecordScope(paymentRecord))) return denied('دسترسی به این پرداخت');
    if (!updateState) return;
    let res: ReturnType<typeof approveAndAllocate> | null = null;
    updateState(draft => { res = approveAndAllocate(draft, paymentId, state.currentUserId, new Date(), generateId); });
    const r = res as ReturnType<typeof approveAndAllocate> | null;
    setNotice(!r ? null : r.ok ? `رسید تأیید و ${r.allocations.length.toLocaleString('fa-IR')} تخصیص ثبت شد${r.remainder > 0 ? `؛ ${r.remainder.toLocaleString()} ریال تخصیص‌نیافته ماند` : ''}. ${transferToErp().message}` : (r.reason || 'تخصیص انجام نشد.'));
    setTimeout(() => setNotice(null), 7000);
  };

  const [fixFor, setFixFor] = useState<string | null>(null);
  const [fixReason, setFixReason] = useState('');
  const handleNeedsFix = () => {
    if (!can('payments', 'APPROVE')) return denied('بازگشت رسید برای اصلاح');
    if (!fixFor || !fixReason.trim() || !updateState) return;
    updateState(draft => { markNeedsFix(draft, fixFor, fixReason, state.currentUserId); });
    setFixFor(null); setFixReason('');
  };

  const handleCreateInvoice = (values: Record<string, any>) => {
    if (!can('finance', 'CREATE')) return denied('ثبت فاکتور');
    if (!updateState) return;
    const fromQuote = values.source === 'FROM_QUOTE';
    const selectedQuote = fromQuote ? state.quotes?.find(q => q.id === values.quoteId) : undefined;
    if (fromQuote && !selectedQuote) return;
    const accountId: string = fromQuote ? (selectedQuote!.accountId || '') : values.accountId;
    const amountNum = fromQuote ? Number(selectedQuote!.totalAmount) || 0 : Number(values.totalAmount) || 0;
    if (!accountId || amountNum <= 0) return;
    const invNum = String(values.invoiceNumber || '').trim() || nextSequenceNumber('INV-', (state.invoices || []).map(i => i.invoiceNumber), 1);

    const invoiceItems = fromQuote && selectedQuote!.lines.length > 0
      ? selectedQuote!.lines.map(line => {
          const prod = state.externalProducts?.find(p => p.id === line.productId);
          return { id: generateId(), description: prod?.name || `کالای کد ${line.productId}`, quantity: line.quantity, unitPrice: line.unitPrice, total: line.lineTotal };
        })
      : [{ id: generateId(), description: String(values.description || ''), quantity: 1, unitPrice: amountNum, total: amountNum }];

    const newInvoice: Invoice = {
      id: generateId(), invoiceNumber: invNum, accountId, customerId: accountId,
      totalAmount: amountNum, paidAmount: 0, balance: amountNum, status: 'UNPAID',
      date: new Date().toISOString(), dueDate: values.dueDate, items: invoiceItems
    };

    updateState(draft => {
      if (!draft.invoices) draft.invoices = [];
      draft.invoices.unshift(newInvoice);
      const acc = (draft.accounts || []).find(a => a.id === accountId);
      if (acc) {
        acc.balance = (acc.balance || 0) + amountNum;
        acc.totalRevenue = (acc.totalRevenue || 0) + amountNum;
      }
      if (selectedQuote) {
        const q = draft.quotes?.find(item => item.id === selectedQuote.id);
        if (q) { q.status = 'ACCEPTED'; (q as any).invoicedId = newInvoice.id; }
      }
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(), action: 'INVOICE_ISSUED', entityType: 'INVOICE', entityId: newInvoice.id,
        details: `فاکتور ${invNum} به مبلغ ${amountNum.toLocaleString('fa-IR')} ریال صادر شد`,
        actor: draft.users?.find(u => u.id === draft.currentUserId)?.name || 'System', createdAt: new Date().toISOString()
      } as any);
    });

    setShowInvoiceModal(false);
    setNotice(`فاکتور رسمی جدید ${invNum} به مبلغ ${amountNum.toLocaleString()} ریال صادر گردید.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleCreateCheque = (values: Record<string, any>) => {
    if (!can('finance', 'CREATE')) return denied('ثبت چک');
    if (!updateState) return;
    const num = String(values.chequeNumber || '').trim();
    const cleanNum = cleanNumericInput(num);
    if (cleanNum.length !== 16) {
      setNotice('شناسه صیادی چک باید دقیقاً ۱۶ رقم عددی باشد.');
      setTimeout(() => setNotice(null), 5000);
      return;
    }
    const amountNum = Number(values.amount) || 0;
    if (!values.accountId || !num || amountNum <= 0) return;
    if ((state.cheques || []).some(c => c.chequeNumber === cleanNum)) {
      setNotice('چک دیگری با همین شناسه صیاد قبلاً ثبت شده است.'); setTimeout(() => setNotice(null), 5000); return;
    }

    const newCheque: Cheque = {
      id: generateId(), chequeNumber: cleanNum, bankName: values.bankName, amount: amountNum, dueDate: values.dueDate,
      status: 'RECEIVED', customerId: values.accountId, accountId: values.accountId
    };

    updateState(draft => {
      if (!draft.cheques) draft.cheques = [];
      if (draft.cheques.some(c => c.chequeNumber === cleanNum)) return;
      draft.cheques.unshift(newCheque);
    });

    setShowChequeModal(false);
    setNotice(`چک صیادی شماره ${cleanNum} به مبلغ ${amountNum.toLocaleString()} ریال ثبت گردید.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const collectionData = evaluateAllCustomerCollections(state);

  const handleSavePromise = (formValues: Record<string, any>) => {
    if (!can('finance', 'EDIT')) return denied('ثبت تعهد وصول');
    if (!selectedProfileForPromise || !updateState) return;
    const targetAccount = state.accounts?.find(a => a.id === selectedProfileForPromise.accountId);
    if (!targetAccount) return;

    const promiseId = generateId();
    const promisedAmountNum = Number(formValues.promisedAmount) || 0;
    const promisedDateStr = formValues.promisedDate || new Date().toISOString().split('T')[0];

    updateState(draft => {
      if (!(draft as any).collectionPromises) (draft as any).collectionPromises = [];
      (draft as any).collectionPromises.unshift({
        id: promiseId,
        accountId: targetAccount.id,
        accountName: targetAccount.name,
        promisedAmount: promisedAmountNum,
        promisedDate: promisedDateStr,
        paymentMethod: formValues.paymentMethod,
        sayadChequeNumber: formValues.sayadChequeNumber,
        contactPerson: formValues.contactPerson,
        notes: formValues.negotiationNotes,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });

      if (formValues.autoGenerateCalendarTask) {
        if (!draft.tasks) draft.tasks = [];
        const newTask = generateCollectionTaskForAccount(
          targetAccount,
          selectedProfileForPromise,
          state.currentUserId || 'user-admin',
          promisedDateStr,
          `تعهد واریز ${promisedAmountNum.toLocaleString('fa-IR')} ریال توسط ${formValues.contactPerson} (${formValues.paymentMethod === 'SAYAD_CHEQUE' ? 'چک صیاد' : 'واریز نقدی'}).`
        );
        draft.tasks.unshift(newTask);
      }

      if (!draft.timelineEvents) draft.timelineEvents = [];
      draft.timelineEvents.unshift({
        id: generateId(),
        customerId: targetAccount.id,
        type: 'PROMISE',
        title: `ثبت تعهد پرداخت به مبلغ ${promisedAmountNum.toLocaleString('fa-IR')} ریال`,
        description: `مذاکره با: ${formValues.contactPerson} | موعد: ${formatAppDate(promisedDateStr, state.settings?.locale)} | روش: ${formValues.paymentMethod === 'SAYAD_CHEQUE' ? 'چک صیادی' : 'حواله مستقیم'}`,
        dateTime: new Date().toISOString()
      });

      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.unshift({
        id: generateId(),
        action: 'COLLECTION_PROMISE_CREATED',
        entityType: 'ACCOUNT',
        entityId: targetAccount.id,
        details: `ثبت تعهد پرداخت مطالبات برای "${targetAccount.name}" به مبلغ ${promisedAmountNum.toLocaleString()} ریال`,
        actor: state.currentUserId || 'کاربر سیستم',
        createdAt: new Date().toISOString()
      });
    });

    setShowPromiseModal(false);
    setSelectedProfileForPromise(null);
    setNotice(`تعهد پرداخت برای ${targetAccount.name} به مبلغ ${promisedAmountNum.toLocaleString()} ریال با موفقیت ثبت و وظیفه پیگیری تنظیم شد.`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleGenerateManualTask = () => {
    if (!guard(state, updateState, 'tasks', 'CREATE', 'ایجاد وظیفه وصول')) return;
    if (!selectedProfileForTask || !updateState) return;
    const targetAccount = state.accounts?.find(a => a.id === selectedProfileForTask.accountId);
    if (!targetAccount) return;

    updateState(draft => {
      if (!draft.tasks) draft.tasks = [];
      const newTask = generateCollectionTaskForAccount(
        targetAccount,
        selectedProfileForTask,
        state.currentUserId || 'user-admin',
        autoTaskDueDate,
        autoTaskNote
      );
      draft.tasks.unshift(newTask);

      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.unshift({
        id: generateId(),
        action: 'COLLECTION_TASK_CREATED',
        entityType: 'TASK',
        entityId: newTask.id,
        details: `وظیفه پیگیری وصول مطالبات برای مشتری "${targetAccount.name}" ایجاد شد.`,
        actor: state.currentUserId || 'کاربر سیستم',
        createdAt: new Date().toISOString()
      });
    });

    setShowAutoTaskModal(false);
    setSelectedProfileForTask(null);
    setAutoTaskNote('');
    setNotice(`وظیفه پیگیری وصول برای ${targetAccount.name} در کارتابل وظایف و تقویم شمسی ثبت گردید.`);
    setTimeout(() => setNotice(null), 5000);
  };

  return (
    <div className="w-full space-y-5 px-1 py-1 sm:px-3 sm:py-3 pb-32 font-premium" dir="rtl">
      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      
      {/* Header and Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-text-main tracking-tight">امور مالی و وصولی</h1>
          <p className="text-xs text-text-secondary mt-0.5">پایش وضعیت جریان وجوه نقد، فاکتورها، دریافتی‌ها و چک‌های صیادی</p>
        </div>
        
        {updateState && (
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => {
                setShowPaymentModal(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
            >
              <Plus size={14} /> ثبت دریافتی / حواله
            </button>
            <button 
              onClick={() => {
                setShowInvoiceModal(true);
              }}
              className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
            >
              <Plus size={14} /> صدور فاکتور جدید
            </button>
            <button 
              onClick={() => {
                setShowChequeModal(true);
              }}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
            >
              <Plus size={14} /> ثبت چک صیادی
            </button>
          </div>
        )}
      </div>

      <DataSourceStatus 
        source="ERP" 
        sourceName="آینه مالی سپیدار / راهکاران ERP" 
        isAuthoritative={receivableReconciliation.authoritative}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md" className="bg-surface border border-border/80 shadow-subtle rounded-3xl p-5">
          <div className="flex items-center gap-2.5 mb-2 text-text-secondary">
            <Wallet size={16} />
            <span className="text-xs font-bold">کل مطالبات (ریال)</span>
          </div>
          <div className="text-lg font-black text-text-main font-mono">{totalReceivables.toLocaleString()}</div>
        </Card>
        <Card padding="md" className="bg-surface border border-border/80 shadow-subtle rounded-3xl p-5">
          <div className="flex items-center gap-2.5 mb-2 text-danger">
            <AlertCircle size={16} />
            <span className="text-xs font-bold">معوقات (ریال)</span>
          </div>
          <div className="text-lg font-black text-danger font-mono">{totalOverdue.toLocaleString()}</div>
        </Card>
        <Card padding="md" className="bg-surface border border-border/80 shadow-subtle rounded-3xl p-5">
          <div className="flex items-center gap-2.5 mb-2 text-success">
            <TrendingUp size={16} />
            <span className="text-xs font-bold">بستانکاری مشتریان</span>
          </div>
          <div className="text-lg font-black text-success font-mono">{totalCredit.toLocaleString()}</div>
        </Card>
        <Card padding="md" className="bg-surface border border-border/80 shadow-subtle rounded-3xl p-5">
          <div className="flex items-center gap-2.5 mb-2 text-warning">
            <FileText size={16} />
            <span className="text-xs font-bold">چک‌های در جریان</span>
          </div>
          <div className="text-lg font-black text-warning font-mono">{openCheques.length} فقره</div>
          <div className="text-[10px] text-text-secondary mt-1 font-mono">{openChequesTotal.toLocaleString()} ریال</div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="bg-danger-soft text-danger px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 border border-danger-line shadow-subtle">
          <Clock size={14} /> {overdueTasks} وظیفه پیگیری معوق
        </div>
        <div className="bg-success-soft text-success px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 border border-success-soft shadow-subtle">
          <CheckCircle size={14} /> {todayVisits} ویزیت وصولی امروز
        </div>
      </div>

      <Card padding="lg" className="bg-surface border border-border/80 shadow-subtle rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-text-main">گزارش سنی مطالبات (AR Aging)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-canvas p-4 rounded-2xl border border-border/60">
            <div className="text-[10px] text-text-secondary mb-1 font-bold">جاری</div>
            <div className="text-xs sm:text-sm font-bold text-text-main font-mono">{aging.current.toLocaleString()}</div>
          </div>
          <div className="bg-warning-soft p-4 rounded-2xl border border-warning-line">
            <div className="text-[10px] text-warning mb-1 font-bold">۱ تا ۳۰ روز</div>
            <div className="text-xs sm:text-sm font-bold text-warning font-mono">{aging.days30.toLocaleString()}</div>
          </div>
          <div className="bg-warning-soft p-4 rounded-2xl border border-warning-line">
            <div className="text-[10px] text-warning mb-1 font-bold">۳۱ تا ۶۰ روز</div>
            <div className="text-xs sm:text-sm font-bold text-warning font-mono">{aging.days60.toLocaleString()}</div>
          </div>
          <div className="bg-danger-soft p-4 rounded-2xl border border-danger-line">
            <div className="text-[10px] text-danger mb-1 font-bold">۶۱ تا ۹۰ روز</div>
            <div className="text-xs sm:text-sm font-bold text-danger font-mono">{aging.days90.toLocaleString()}</div>
          </div>
          <div className="bg-danger-soft p-4 rounded-2xl border border-danger-line col-span-2 sm:col-span-1">
            <div className="text-[10px] text-danger mb-1 font-bold">+۹۰ روز</div>
            <div className="text-xs sm:text-sm font-bold text-danger font-mono">{aging.days90Plus.toLocaleString()}</div>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-4 sm:gap-6 border-b border-border/60 overflow-x-auto">
        <button onClick={() => setLocalTab('overview')} className={`pb-3 text-sm font-bold border-b-[3px] cursor-pointer transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}>نمای کلی</button>
        <button onClick={() => setLocalTab('collection')} className={`pb-3 text-sm font-bold border-b-[3px] cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'collection' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}>
          <ShieldAlert size={15} className="text-amber-500" />
          <span>پیگیری هوشمند مطالبات</span>
          {collectionData.summary.highRiskAccountsCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-red-500 text-white">
              {collectionData.summary.highRiskAccountsCount}
            </span>
          )}
        </button>
        <button onClick={() => setLocalTab('invoices')} className={`pb-3 text-sm font-bold border-b-[3px] cursor-pointer transition-colors whitespace-nowrap ${activeTab === 'invoices' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}>فاکتورها ({invoices.length})</button>
        <button onClick={() => setLocalTab('payments')} className={`pb-3 text-sm font-bold border-b-[3px] cursor-pointer transition-colors whitespace-nowrap ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}>دریافتی‌ها ({payments.length})</button>
        <button onClick={() => setLocalTab('credits')} className={`pb-3 text-sm font-bold border-b-[3px] cursor-pointer transition-colors whitespace-nowrap ${activeTab === 'credits' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}>بستانکاری‌ها ({creditNotes.length})</button>
        <button onClick={() => setLocalTab('requests')} className={`pb-3 text-sm font-bold border-b-[3px] cursor-pointer transition-colors whitespace-nowrap ${activeTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-text-secondary'}`}>دستورها و مجوزها</button>
        <button onClick={() => setLocalTab('cheques')} className={`pb-3 text-sm font-bold border-b-[3px] cursor-pointer transition-colors whitespace-nowrap ${activeTab === 'cheques' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}>چک‌ها ({cheques.length})</button>
        <button onClick={() => setLocalTab('treasury')} className={`pb-3 text-sm font-bold border-b-[3px] cursor-pointer transition-colors whitespace-nowrap ${activeTab === 'treasury' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}>خزانه و سررسید</button>
        <button onClick={() => setLocalTab('expenses')} className={`pb-3 text-sm font-bold border-b-[3px] cursor-pointer transition-colors whitespace-nowrap ${activeTab === 'expenses' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}>هزینه‌ها ({expenses.length})</button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <Card padding="md" className="rounded-2xl border border-border/80"><div className="text-[11px] text-text-secondary">مطالبات باز</div><div className="mt-2 text-lg font-black text-text-main font-mono">{totalReceivables.toLocaleString('fa-IR')}</div><div className="mt-1 text-[10px] text-text-secondary">ریال · از فاکتورها</div></Card>
            <Card padding="md" className="rounded-2xl border border-border/80"><div className="text-[11px] text-text-secondary">مطالبات معوق</div><div className="mt-2 text-lg font-black text-danger font-mono">{totalOverdue.toLocaleString('fa-IR')}</div><div className="mt-1 text-[10px] text-text-secondary">{totalReceivables ? Math.round(totalOverdue / totalReceivables * 100).toLocaleString('fa-IR') : '۰'}٪ از مطالبات باز</div></Card>
            <Card padding="md" className="rounded-2xl border border-border/80"><div className="text-[11px] text-text-secondary">هزینه‌های پرداخت‌شده</div><div className="mt-2 text-lg font-black text-text-main font-mono">{paidExpenses.toLocaleString('fa-IR')}</div><div className="mt-1 text-[10px] text-text-secondary">ریال · مجموع رکوردهای قابل مشاهده</div></Card>
            <Card padding="md" className="rounded-2xl border border-border/80"><div className="text-[11px] text-text-secondary">چک پرداختی در ۷ روز آینده</div><div className="mt-2 text-lg font-black text-warning font-mono">{upcomingPayableCheques.reduce((sum, c) => sum + Number(c.amount || 0), 0).toLocaleString('fa-IR')}</div><div className="mt-1 text-[10px] text-text-secondary">{upcomingPayableCheques.length.toLocaleString('fa-IR')} فقره · نیاز نقدینگی برنامه‌ای</div></Card>
          </div>
          <Card padding="md" className="rounded-2xl border border-border/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-sm">روند ۶ ماهه اسناد مالی</h3><span className="text-[10px] text-text-secondary">مبالغ ریالی بر اساس تاریخ رکوردهای قابل مشاهده</span></div>
            <div className="flex flex-wrap gap-3 text-[10px] text-text-secondary"><span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-primary" /> فاکتور صادرشده</span><span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-success" /> دریافتی تسویه‌شده</span><span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-warning" /> هزینه پرداخت‌شده</span></div>
            <div className="grid grid-cols-6 gap-2 items-end min-h-[150px]">{financialMonths.map(month => <div key={month.key} className="flex flex-col items-center gap-2 min-w-0"><div className="w-full flex items-end justify-center gap-1 h-28 border-b border-border/70">{([['invoices', month.invoices, 'bg-primary'], ['receipts', month.receipts, 'bg-success'], ['expenses', month.expenses, 'bg-warning']] as const).map(([field, amount, color]) => <div key={field} title={`${field}: ${amount.toLocaleString('fa-IR')} ریال`} className={`w-2 sm:w-3 rounded-t-sm ${color}`} style={{ height: `${amount ? Math.max(4, amount / maxMonthlyValue * 100) : 0}%` }} />)}</div><span className="text-[10px] text-text-secondary truncate max-w-full">{month.label}</span></div>)}</div>
            <p className="text-[10px] text-text-secondary">فاکتور به معنی ارزش سند ثبت‌شده است، نه وجه وصول‌شده؛ دریافتی فقط پرداخت‌های CLEARED و هزینه فقط رکوردهای PAID را شامل می‌شود. این نمودار جریان نقد واقعی یا صورت مالی حسابرسی‌شده نیست.</p>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card padding="md" className="bg-surface border border-border/80 shadow-subtle rounded-3xl p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-border/60 pb-2">
                <span className="text-xs font-bold text-text-main">آخرین فاکتورهای صادر شده</span>
                <button onClick={() => setLocalTab('invoices')} className="text-[11px] font-bold text-primary hover:underline cursor-pointer">مشاهده همه ({invoices.length})</button>
              </div>
              <div className="space-y-2">
                {invoices.slice(0, 4).map(inv => (
                  <div key={inv.id} className="flex justify-between items-center text-xs py-1.5 border-b border-border/40 last:border-none">
                    <span className="font-mono text-text-main font-bold">{inv.invoiceNumber}</span>
                    <span className="font-mono text-primary font-bold">{inv.totalAmount.toLocaleString()} ریال</span>
                  </div>
                ))}
                {invoices.length === 0 && <div className="text-xs text-text-secondary py-3 text-center">فاکتوری ثبت نشده است.</div>}
              </div>
            </Card>

            <Card padding="md" className="bg-surface border border-border/80 shadow-subtle rounded-3xl p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-border/60 pb-2">
                <span className="text-xs font-bold text-text-main">چک‌های در انتظار وصول</span>
                <button onClick={() => setLocalTab('cheques')} className="text-[11px] font-bold text-primary hover:underline cursor-pointer">مشاهده همه ({cheques.length})</button>
              </div>
              <div className="space-y-2">
                {openCheques.slice(0, 4).map(c => (
                  <div key={c.id} className="flex justify-between items-center text-xs py-1.5 border-b border-border/40 last:border-none">
                    <div>
                      <span className="text-text-main font-bold block">{c.bankName || 'بانک نامشخص'}</span>
                      <span className="text-[10px] text-text-secondary font-mono">{c.chequeNumber || c.id}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-xs text-warning font-bold block">{c.amount.toLocaleString()} ریال</span>
                      <span className="text-[10px] text-text-secondary">{c.dueDate || 'بدون تاریخ'}</span>
                    </div>
                  </div>
                ))}
                {openCheques.length === 0 && <div className="text-xs text-text-secondary py-3 text-center">چک در انتظاری وجود ندارد.</div>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {invoices.map(inv => {
            const acc = (state.accounts || []).find(a => a.id === (inv as any).accountId);
            return (
              <Card key={inv.id} padding="md" className="bg-surface border border-border/80 shadow-subtle rounded-3xl flex justify-between items-center p-5">
                <div>
                  <div className="text-sm font-bold text-text-main font-mono">{inv.invoiceNumber}</div>
                  {acc && <div className="text-xs text-text-secondary mt-0.5">{acc.name}</div>}
                  <div className="text-xs text-text-secondary mt-1 font-mono">سررسید: {formatAppDate(inv.dueDate, state.settings?.locale)}</div>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-text-main font-mono">{inv.totalAmount.toLocaleString()} ریال</div>
                  <div className={`text-xs font-bold mt-1 ${inv.status === 'PAID' ? 'text-success' : inv.status === 'OVERDUE' ? 'text-danger' : 'text-warning'}`}>
                    {inv.status === 'PAID' ? 'پرداخت شده' : inv.status === 'OVERDUE' ? 'معوق' : 'باز'}
                  </div>
                </div>
              </Card>
            );
          })}
          {invoices.length === 0 && <div className="text-center text-xs text-text-secondary py-12 bg-surface rounded-3xl border border-border/80">فاکتوری یافت نشد.</div>}
        </div>
      )}

      {activeTab === 'credits' && (
        <div className="space-y-4">
          <Card padding="lg" className="space-y-3">
            <div><h2 className="text-base font-black text-text-main">درخواست بستانکاری مشتری</h2><p className="mt-1 text-xs leading-6 text-text-secondary">این فرم فقط درخواست محلی ثبت می‌کند. سند واقعی بستانکاری باید از ERP/حسابداری آینه شود؛ تأیید درخواست به‌تنهایی مانده را کاهش نمی‌دهد.</p></div>
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-text-secondary">فاکتور مرجع<select value={creditInvoiceId} onChange={e=>setCreditInvoiceId(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-text-main"><option value="">انتخاب فاکتور</option>{invoices.filter(inv=>!['VOID','VOIDED','CANCELLED','CANCELED'].includes(String(inv.status).toUpperCase())).map(inv=><option key={inv.id} value={inv.id}>{inv.invoiceNumber || inv.id} · {state.accounts.find(a=>a.id===(inv.accountId||inv.customerId))?.name || inv.customerId}</option>)}</select></label><Input label="مبلغ بستانکاری (ریال)" type="number" value={creditAmount} onChange={e=>setCreditAmount(e.target.value)} placeholder="مبلغ مثبت"/><Input label="شناسهٔ سند مرجع (الزامی)" value={creditSourceDocumentId} onChange={e=>setCreditSourceDocumentId(e.target.value)} placeholder="شمارهٔ برگشت/سند حسابداری"/><label className="sm:col-span-2 text-xs font-bold text-text-secondary">دلیل و مبنای بستانکاری<textarea value={creditReason} onChange={e=>setCreditReason(e.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-border bg-white p-3 text-sm text-text-main" placeholder="شماره سند برگشت، تخفیف تأییدشده یا علت مستند" /></label></div>
            <Button onClick={createCreditNote} disabled={!can('finance','CREATE')||!creditInvoiceId||!(Number(creditAmount)>0)||!creditReason.trim()||!creditSourceDocumentId.trim()}>ثبت پیش‌نویس بستانکاری</Button>
          </Card>
          <Card padding="lg" className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-black text-text-main">منبع بستانکاری ERP و گردش درخواست‌ها</h2><span className={`rounded-lg px-2 py-1 text-xs font-bold ${receivableReconciliation.authoritative?'bg-success-soft text-success':'bg-warning-soft text-warning'}`}>{state.creditNoteSourceStatus === 'CONNECTED' ? (receivableReconciliation.authoritative?'تطبیق بدون مغایرت':'تطبیق مسدود / نیازمند بررسی') : 'منبع ERP متصل نیست'}</span></div><p className="text-xs leading-6 text-text-secondary">{state.creditNoteSourceStatus === 'CONNECTED' ? (receivableReconciliation.authoritative?'مانده بر اساس فاکتورهای فعال، تخصیص پرداخت CLEARED و بستانکاری آینه‌شده از ERP محاسبه شده است.':'رتبه‌بندی رسمی وصول تا رفع مغایرت‌های مالی مسدود است.') : 'منبع CreditNoteMirror از ERP هنوز به برنامه متصل نیست؛ هیچ درخواست محلی به‌عنوان بستانکاری واقعی منظور نمی‌شود.'}</p>
            {mirroredCreditNotes.length>0&&<div className="space-y-2"><h3 className="text-sm font-bold text-text-main">اسناد آینه‌شده از ERP (فقط‌خواندنی)</h3>{mirroredCreditNotes.map(note=><div key={note.id} className="rounded-xl border border-border p-3 text-xs"><div className="font-bold text-text-main">{note.externalCreditNoteId} · {Number(note.amount).toLocaleString('fa-IR')} ریال</div><div className="mt-1 text-text-secondary">سیستم: {note.sourceSystemCode} · وضعیت: {note.status} · همگام‌سازی: {note.syncedAt || '—'}</div></div>)}</div>}{creditNotes.length===0?<p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-secondary">هنوز درخواست بستانکاری ثبت نشده است.</p>:creditNotes.map(note=><div key={note.id} className="space-y-2 rounded-xl border border-border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-text-main">{note.requestNumber || note.id} · {note.amount.toLocaleString('fa-IR')} ریال</strong><span className="rounded-lg bg-canvas px-2 py-1 text-[10px] font-bold">{({DRAFT:'پیش‌نویس',PENDING_APPROVAL:'در انتظار تأیید',APPROVED:'تأییدشده؛ آمادهٔ ورود در ERP',VOID:'باطل'} as Record<string,string>)[note.status] || note.status}</span></div><div className="text-xs leading-5 text-text-secondary">فاکتور: {invoices.find(inv=>inv.id===note.invoiceId)?.invoiceNumber || note.invoiceId} · مشتری: {state.accounts.find(a=>a.id===(note.accountId||note.customerId))?.name || note.customerId} · سند مرجع درخواستی: {note.sourceDocumentId || 'ثبت نشده'} · دلیل: {note.reason}</div><div className="flex flex-wrap gap-2">{note.status==='DRAFT'&&<Button size="sm" variant="outline" disabled={!can('finance','CREATE')} onClick={()=>transitionCreditNote(note,'PENDING_APPROVAL')}>ارسال برای تأیید</Button>}{note.status==='PENDING_APPROVAL'&&<Button size="sm" variant="primary" disabled={!can('finance','APPROVE')||note.createdBy===state.currentUserId} onClick={()=>transitionCreditNote(note,'APPROVED')}>تأیید مستقل</Button>}{note.status==='APPROVED'&&<span className="rounded-lg bg-warning-soft px-2 py-1 text-[10px] text-warning">آمادهٔ ورود در ERP؛ ثبت مالی انجام نشده</span>}{['DRAFT','PENDING_APPROVAL','APPROVED'].includes(note.status)&&<Button size="sm" variant="ghost" disabled={!can('finance','APPROVE')} onClick={()=>transitionCreditNote(note,'VOID')}>ابطال</Button>}</div></div>)}
          </Card>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="se-caption max-w-xl">این بخش فقط «درخواست و تصمیم» را ثبت می‌کند. صدور چک پرداختی، سند و اجرای پرداخت در ERP انجام می‌شود.</p>
            {can('financeRequests', 'CREATE') && <div className="flex gap-2"><Button size="sm" variant="primary" onClick={() => setReqKind('PAYMENT_ORDER')}>دستور پرداخت جدید</Button><Button size="sm" variant="outline" onClick={() => setReqKind('DEPOSIT_AUTHORIZATION')}>درخواست مجوز واریز</Button></div>}
          </div>
          {financeRequests.filter(r => canOn('financeRequests', 'VIEW', { ownerId: r.requestedBy }) || r.requestedBy === state.currentUserId).map(r => (
            <Card key={r.id} padding="md" className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm font-extrabold text-text-main">{FINANCE_KIND_LABEL[r.kind as FinanceRequestKind]} · {r.payeeName}</strong><span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-primary/10 text-primary">{FINANCE_STATUS_LABEL[r.status as keyof typeof FINANCE_STATUS_LABEL] || r.status}</span></div>
              <div className="text-xs text-text-secondary se-num">{r.amount.toLocaleString('fa-IR')} ریال{r.dueDate ? ` · مهلت: ${formatAppDate(r.dueDate, state.settings?.locale)}` : ''} · ثبت‌کننده: {state.users?.find(u => u.id === r.requestedBy)?.name || '—'}</div>
              <p className="text-xs text-text-main">{r.reason}</p>
              {r.decisionNote && <p className="text-[11px] text-danger">یادداشت حسابدار: {r.decisionNote}</p>}
              {r.status === 'ERP_PENDING' && <p className="text-[11px] text-text-secondary">اجرا در ERP: پیکربندی نشده (NOT_CONFIGURED)</p>}
              {updateState && <AttachmentManager entityId={r.id} entityType="REQUEST" state={state} updateState={updateState} readonly={!(r.requestedBy === state.currentUserId || can('financeRequests', 'APPROVE'))} />}
              {['SUBMITTED', 'NEEDS_INFO'].includes(r.status) && can('financeRequests', 'APPROVE') && r.requestedBy !== state.currentUserId && (
                <div className="flex flex-wrap gap-2 pt-1"><Button size="sm" variant="primary" onClick={() => decideRequest(r.id, 'APPROVE')}>تایید</Button><Button size="sm" variant="outline" onClick={() => setDecide({ id: r.id, mode: 'NEEDS_INFO' })}>نیازمند اطلاعات</Button><Button size="sm" variant="danger" onClick={() => setDecide({ id: r.id, mode: 'REJECT' })}>رد</Button></div>)}
            </Card>))}
          {financeRequests.length === 0 && <div className="rounded-2xl border border-dashed border-border-strong px-4 py-10 text-center text-xs text-text-secondary">هنوز دستور پرداخت یا مجوز واریزی ثبت نشده است.</div>}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-3">
          {payments.map(p => {
            const acc = (state.accounts || []).find(a => a.id === p.accountId);
            return (
              <Card key={p.id} padding="md" className="bg-surface border border-border/80 shadow-subtle rounded-3xl flex justify-between items-center p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-text-main">
                      {p.method === 'CASH' ? 'پرداخت نقدی' : p.method === 'TRANSFER' ? 'انتقال بانکی (حواله)' : 'چک صیادی'}
                    </strong>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${p.status === 'CLEARED' ? 'bg-success-soft text-success' : 'bg-amber-50 text-warning'}`}>
                      {p.status === 'CLEARED' ? 'تسویه و وصول شده' : 'در انتظار وصول'}
                    </span>
                    {(p as any).receiptStatus && <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-primary/10 text-primary">{RECEIPT_STATUS_LABEL[(p as any).receiptStatus as keyof typeof RECEIPT_STATUS_LABEL] || (p as any).receiptStatus}</span>}
                  </div>
                  {acc && <div className="text-xs text-text-secondary mt-1">{acc.name}</div>}
                  {p.reference && <div className="text-[11px] text-text-secondary font-mono mt-0.5">کد رهگیری: {p.reference}</div>}
                  {(p as any).needsFixReason && <div className="text-[11px] text-danger mt-1">دلیل اصلاح: {(p as any).needsFixReason}</div>}
                  {(p as any).receiptStatus === 'PENDING_ERP' && <div className="text-[11px] text-text-secondary mt-1">انتقال به ERP: پیکربندی نشده (NOT_CONFIGURED)</div>}
                  {['PENDING_REVIEW', 'MISMATCH', 'RECEIVED'].includes((p as any).receiptStatus) && can('payments', 'ALLOCATE') && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="primary" onClick={() => handleApprovePayment(p.id)}>تایید و تخصیص</Button>
                      {can('payments', 'APPROVE') && <Button size="sm" variant="outline" onClick={() => setFixFor(p.id)}>نیازمند اصلاح</Button>}
                    </div>
                  )}
                  <div className="text-[10px] text-text-secondary font-mono mt-1">تاریخ: {formatAppDate(p.date, state.settings?.locale)}</div>
                </div>
                <div className="text-left font-mono">
                  <span className="text-sm font-bold text-success block">+{p.amount.toLocaleString()} ریال</span>
                  {p.bankName && <span className="text-[10px] text-text-secondary">{p.bankName}</span>}
                </div>
              </Card>
            );
          })}
          {payments.length === 0 && <div className="text-center text-xs text-text-secondary py-12 bg-surface rounded-3xl border border-border/80">هیچ تراکنش دریافتی ثبت نشده است.</div>}
        </div>
      )}

      {activeTab === 'cheques' && (
        <div className="space-y-3">
          {cheques.map(c => (
            <Card key={c.id} padding="md" className="bg-surface border border-border/80 shadow-subtle rounded-3xl flex justify-between items-center p-5">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-text-main">{c.bankName || 'بانک مرکزی / صیاد'}</strong>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${c.status === 'CLEARED' ? 'bg-success-soft text-success' : c.status === 'BOUNCED' ? 'bg-red-50 text-danger' : 'bg-amber-50 text-warning'}`}>
                    {c.status === 'CLEARED' ? 'وصول شد' : c.status === 'BOUNCED' ? 'برگشتی' : 'در جریان'}
                  </span>
                </div>
                <div className="text-xs text-text-secondary font-mono mt-1">شماره صیادی: {c.chequeNumber || c.id}</div>
                <div className="text-[10px] text-text-secondary font-mono mt-0.5">تاریخ سررسید: {formatAppDate(c.dueDate, state.settings?.locale)}</div>
              </div>
              <div className="text-left font-mono">
                <span className="text-sm font-bold text-warning block">{c.amount.toLocaleString()} ریال</span>
              </div>
            </Card>
          ))}
          {cheques.length === 0 && <div className="text-center text-xs text-text-secondary py-12 bg-surface rounded-3xl border border-border/80">هیچ چکی ثبت نشده است.</div>}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* کارت هوشمند بررسی هزینه‌های مشکوک (D58) */}
          {expenses.some(e => Number(e.amount) >= 50000000 || e.isSuspicious) && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span>هشدار هزینه نامتعارف / مشکوک به مغایرت</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-200/60 px-2 py-0.5 rounded-full">نیاز به بازبینی مالی</span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed">
                یک یا چند قلم هزینه با مبالغ درشت یا بدون فاکتور ضمیمه شناسایی شده است که نیازمند تأیید مدیر مالی و انطباق با اسناد ERP است.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (updateState) {
                      updateState(draft => {
                        if (!draft.tasks) draft.tasks = [];
                        draft.tasks.unshift({
                          id: generateId(),
                          title: 'بررسی و ممیزی هزینه نامتعارف در دفتر هزینه‌ها',
                          description: 'بررسی هزینه‌های مشکوک با مبالغ بالای ۵۰ میلیون ریال و ثبت سند تطبیق با حسابداری.',
                          status: 'OPEN',
                          priority: 'HIGH',
                          dueDate: new Date().toISOString().split('T')[0],
                          slaStatus: 'ON_TRACK',
                          createdAt: new Date().toISOString()
                        });
                      });
                      setNotice('تسک ارجاع و بازبینی به کارتابل حسابدار افزوده شد.');
                      setTimeout(() => setNotice(null), 4000);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={13} /> ارجاع تسک به حسابدار
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card padding="md" className="rounded-2xl"><div className="text-[11px] text-text-secondary">کل هزینه پرداخت‌شده</div><div className="text-base font-black font-mono mt-2">{paidExpenses.toLocaleString('fa-IR')} ریال</div></Card>
            <Card padding="md" className="rounded-2xl"><div className="text-[11px] text-text-secondary">هزینه‌های سررسید/پرداخت‌نشده</div><div className="text-base font-black font-mono mt-2 text-warning">{dueExpenses.toLocaleString('fa-IR')} ریال</div></Card>
            <Card padding="md" className="rounded-2xl col-span-2 md:col-span-1"><div className="text-[11px] text-text-secondary">تعداد رکوردها</div><div className="text-base font-black mt-2">{expenses.length.toLocaleString('fa-IR')}</div><div className="text-[10px] text-text-secondary mt-1">داده‌های تست با برچسب LOCAL_TEST تفکیک می‌شوند.</div></Card>
          </div>
          <Card padding="md" className="rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-sm">تفکیک هزینه بر اساس دسته</h3><span className="text-[10px] text-text-secondary">بر اساس رکوردهای قابل مشاهده</span></div>
            {Object.entries(expenseByCategory).sort((a,b) => b[1]-a[1]).map(([category, amount]) => { const max = Math.max(1, ...Object.values(expenseByCategory)); return <div key={category} className="space-y-1"><div className="flex justify-between gap-3 text-xs"><span>{category}</span><b className="font-mono">{amount.toLocaleString('fa-IR')} ریال</b></div><div className="h-2 rounded-full bg-surface-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, amount / max * 100)}%` }} /></div></div>; })}
          </Card>
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-sm">دفتر هزینه‌ها</h3><select aria-label="فیلتر وضعیت هزینه" value={expenseStatusFilter} onChange={e => setExpenseStatusFilter(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2 text-xs"><option value="ALL">همه وضعیت‌ها</option><option value="PAID">پرداخت‌شده</option><option value="DUE">سررسید</option><option value="PENDING">در انتظار</option><option value="UNPAID">پرداخت‌نشده</option></select></div>
          <div className="space-y-2">{expenses.filter(e => expenseStatusFilter === 'ALL' || String(e.status).toUpperCase() === expenseStatusFilter).slice().sort((a,b) => String(b.date || '').localeCompare(String(a.date || ''))).map((expense: any) => <Card key={expense.id} padding="md" className="rounded-2xl"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="font-bold text-sm">{expense.title || expense.description || 'هزینه بدون عنوان'}</div><div className="text-[11px] text-text-secondary mt-1">{expense.category || 'بدون دسته'} · {formatAppDate(expense.date, state.settings?.locale)}</div>{expense.source === 'LOCAL_TEST' || String(expense.id).startsWith('demo-') ? <div className="text-[10px] text-warning mt-1">داده آزمایشی · LOCAL_TEST</div> : null}</div><div className="text-left shrink-0"><div className="font-mono font-bold text-sm">{Number(expense.amount || 0).toLocaleString('fa-IR')}</div><div className={`text-[10px] mt-1 ${expense.status === 'PAID' ? 'text-success' : 'text-warning'}`}>{expense.status === 'PAID' ? 'پرداخت‌شده' : expense.status === 'DUE' ? 'سررسید' : expense.status || 'نامشخص'}</div></div></div></Card>)}
          {expenses.filter(e => expenseStatusFilter === 'ALL' || String(e.status).toUpperCase() === expenseStatusFilter).length === 0 && <div className="text-center text-xs text-text-secondary py-10">هزینه‌ای با این فیلتر یافت نشد.</div>}</div>
          <p className="text-[10px] text-text-secondary">این صفحه گزارش/نمایش است؛ ثبت یا پرداخت هزینه، سند مالی معتبر و گردش تأیید مستقل در فاز بعد تکمیل می‌شود. اعداد آزمایشی نباید به‌عنوان مانده واقعی تلقی شوند.</p>
        </div>
      )}

      {activeTab === 'treasury' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <Card padding="md" className="rounded-2xl"><div className="text-[11px] text-text-secondary">چک دریافتی باز</div><div className="text-base font-black font-mono mt-2">{receivableCheques.filter(c => ['PENDING','RECEIVED','DEPOSITED'].includes(c.status)).reduce((sum,c) => sum + Number(c.amount || 0),0).toLocaleString('fa-IR')}</div><div className="text-[10px] text-text-secondary mt-1">ریال</div></Card>
            <Card padding="md" className="rounded-2xl"><div className="text-[11px] text-text-secondary">چک پرداختی باز</div><div className="text-base font-black font-mono mt-2">{payableCheques.filter(c => c.status !== 'CLEARED').reduce((sum,c) => sum + Number(c.amount || 0),0).toLocaleString('fa-IR')}</div><div className="text-[10px] text-text-secondary mt-1">ریال</div></Card>
            <Card padding="md" className="rounded-2xl"><div className="text-[11px] text-text-secondary">سررسید پرداخت ۷ روز</div><div className="text-base font-black font-mono mt-2 text-warning">{upcomingPayableCheques.reduce((sum,c) => sum + Number(c.amount || 0),0).toLocaleString('fa-IR')}</div><div className="text-[10px] text-text-secondary mt-1">ریال</div></Card>
            <Card padding="md" className="rounded-2xl"><div className="text-[11px] text-text-secondary">چک برگشتی</div><div className="text-base font-black font-mono mt-2 text-danger">{cheques.filter(c => c.status === 'BOUNCED').reduce((sum,c) => sum + Number(c.amount || 0),0).toLocaleString('fa-IR')}</div><div className="text-[10px] text-text-secondary mt-1">ریال · نیازمند پیگیری</div></Card>
          </div>
          <div className="space-y-2">{cheques.slice().sort((a,b) => String(a.dueDate || '').localeCompare(String(b.dueDate || ''))).map(c => { const payable = c.direction === 'PAYABLE'; return <Card key={c.id} padding="md" className="rounded-2xl"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="font-bold text-sm">{payable ? 'چک پرداختی' : 'چک دریافتی'} · {c.bankName || 'بانک نامشخص'}</div><div className="text-[11px] text-text-secondary mt-1 font-mono">{c.chequeNumber || c.id} · سررسید {formatAppDate(c.dueDate, state.settings?.locale)}</div><div className="text-[10px] text-text-secondary mt-1">{c.supplierId ? (state as any).suppliers?.find((x:any) => x.id === c.supplierId)?.name || 'تأمین‌کننده' : (state.accounts || []).find(a => a.id === ((c as any).accountId || (c as any).customerId))?.name || 'طرف حساب نامشخص'}</div></div><div className="text-left shrink-0"><div className={`font-mono font-bold ${c.status === 'BOUNCED' ? 'text-danger' : payable ? 'text-warning' : 'text-text-main'}`}>{Number(c.amount || 0).toLocaleString('fa-IR')} ریال</div><div className="text-[10px] mt-1 text-text-secondary">{c.status === 'CLEARED' ? 'تسویه‌شده' : c.status === 'BOUNCED' ? 'برگشتی' : c.status === 'DEPOSITED' ? 'واگذار‌شده' : c.status === 'RECEIVED' ? 'دریافت‌شده' : 'در انتظار'}</div></div></div>{c.source === 'LOCAL_TEST' || String(c.id).startsWith('demo-') ? <div className="text-[10px] text-warning mt-2">داده آزمایشی · LOCAL_TEST</div> : null}</Card>; })}
          {cheques.length === 0 && <div className="text-center text-xs text-text-secondary py-10">چکی ثبت نشده است.</div>}</div>
          <p className="text-[10px] text-text-secondary">این داشبورد بر مبنای رکوردهای موجود در IndexedDB محاسبه می‌شود؛ پیش‌بینی مانده بانک یا موجودی نقد واقعی تا اتصال دفتر بانک/ERP در دسترس نیست.</p>
        </div>
      )}

      {activeTab === 'collection' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card padding="md" className="bg-red-50/60 border border-red-200 rounded-3xl p-4.5 space-y-1">
              <div className="flex items-center gap-1.5 text-red-700 text-xs font-bold">
                <AlertTriangle size={15} /> کل مطالبات معوق
              </div>
              <div className="text-base sm:text-lg font-black text-red-800 font-mono">
                {collectionData.summary.totalOverdueAmount.toLocaleString('fa-IR')} <span className="text-[11px] font-normal">ریال</span>
              </div>
              <div className="text-[10px] text-red-600 font-bold">
                {collectionData.summary.totalUnpaidInvoicesCount} فاکتور باز پرداخت‌نشده
              </div>
            </Card>

            <Card padding="md" className="bg-rose-50/60 border border-rose-200 rounded-3xl p-4.5 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-700 text-xs font-bold">
                <ShieldAlert size={15} /> معوقات بحرانی (&gt;۶۰ روز)
              </div>
              <div className="text-base sm:text-lg font-black text-rose-800 font-mono">
                {collectionData.summary.criticalOverdueAmount.toLocaleString('fa-IR')} <span className="text-[11px] font-normal">ریال</span>
              </div>
              <div className="text-[10px] text-rose-600 font-bold">
                ریسک بالای سوخت مطالبات
              </div>
            </Card>

            <Card padding="md" className="bg-amber-50/60 border border-amber-200 rounded-3xl p-4.5 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
                <ShieldCheck size={15} /> مشتریان پرریسک
              </div>
              <div className="text-base sm:text-lg font-black text-amber-800 font-mono">
                {collectionData.summary.highRiskAccountsCount} <span className="text-[11px] font-normal">مشتری</span>
              </div>
              <div className="text-[10px] text-amber-600 font-bold">
                قفل خودکار اعتبار و لزوم تأیید
              </div>
            </Card>

            <Card padding="md" className="bg-emerald-50/60 border border-emerald-200 rounded-3xl p-4.5 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                <CalendarCheck size={15} /> وعده‌های وصولی امروز
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                {collectionData.summary.todayPromisesCount} <span className="text-[11px] font-normal">فقره</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-bold">
                پیگیری و ثبت اسناد واریز
              </div>
            </Card>
          </div>

          {/* Customer Risk & Collection List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-black text-text-main flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-primary" />
                <span>رتبه‌بندی ریسک مشتریان و فهرست مطالبات سررسیدشده</span>
              </h3>
              <span className="text-[11px] text-text-secondary">
                موتور هوشمند وصول: مرتب‌سازی بر اساس امتیاز ریسک و روزهای تأخیر
              </span>
            </div>

            {collectionData.profiles.map(p => {
              const riskColor = 
                p.riskLevel === 'CRITICAL' ? 'bg-red-500 text-white' :
                p.riskLevel === 'HIGH' ? 'bg-amber-500 text-white' :
                p.riskLevel === 'MEDIUM' ? 'bg-blue-500 text-white' :
                'bg-emerald-500 text-white';

              const riskBadgeLabel =
                p.riskLevel === 'CRITICAL' ? 'بحرانی' :
                p.riskLevel === 'HIGH' ? 'پرریسک' :
                p.riskLevel === 'MEDIUM' ? 'ریسک متوسط' :
                'کم‌ریسک';

              return (
                <Card 
                  key={p.accountId}
                  padding="md"
                  className={`bg-surface border rounded-3xl p-5 transition-all hover:shadow-subtle ${
                    p.riskLevel === 'CRITICAL' ? 'border-red-300 bg-red-50/10' :
                    p.riskLevel === 'HIGH' ? 'border-amber-300 bg-amber-50/10' :
                    'border-border/80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-text-main">{p.accountName}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${riskColor}`}>
                          امتیاز ریسک {p.riskScore}٪ ({riskBadgeLabel})
                        </span>
                        {p.bouncedChequesCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            {p.bouncedChequesCount} چک برگشتی
                          </span>
                        )}
                        {p.maxDaysOverdue > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {p.maxDaysOverdue} روز حداکثر تأخیر
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-text-secondary flex items-center gap-4 flex-wrap">
                        <span>مانده معوق: <strong className="text-red-700 font-mono">{p.overdueBalance.toLocaleString('fa-IR')} ریال</strong></span>
                        <span>سقف اعتبار مصوب: <strong className="font-mono text-text-main">{p.creditLimit.toLocaleString('fa-IR')} ریال</strong></span>
                        <span>تلفن تماس: <strong className="font-mono text-text-main" dir="ltr">{p.phone || '-'}</strong></span>
                      </div>

                      <div className="text-[11px] text-primary bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10 inline-block font-medium">
                        اقدام پیشنهادی سیستم: {p.recommendedAction}
                      </div>

                      {p.activePromises.length > 0 && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          وعده پرداخت فعال: {p.activePromises[0].promisedAmount.toLocaleString('fa-IR')} ریال در تاریخ {formatAppDate(p.activePromises[0].promisedDate, state.settings?.locale)} ({p.activePromises[0].contactPerson})
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                      <button
                        onClick={() => {
                          setSelectedProfileForPromise(p);
                          setShowPromiseModal(true);
                        }}
                        className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <CalendarCheck size={14} /> ثبت تعهد پرداخت (فرم پویا)
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProfileForTask(p);
                          setAutoTaskNote(`پیگیری فوری معوقات ${p.overdueBalance.toLocaleString('fa-IR')} ریال و توافق نحوه تسویه.`);
                          setShowAutoTaskModal(true);
                        }}
                        className="px-3.5 py-2 bg-canvas border border-border text-text-main hover:bg-surface text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <PhoneCall size={14} /> وظیفه پیگیری تقویم
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {collectionData.profiles.length === 0 && (
              <div className="text-center text-xs text-text-secondary py-12 bg-surface rounded-3xl border border-border/80">
                هیچ حساب یا مطالبات معوقی در سیستم ثبت نشده است.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Payment */}
      {showPaymentModal && (
        <Modal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setPayEvidence(null); }} title="ثبت وصولی با پیوست عکس یا رسید">
          <div className="mb-3"><DocumentField label="عکس یا رسید وصولی" required={(state.settings as any)?.orgConfig?.requireReceiptEvidence !== false} value={payEvidence} onChange={setPayEvidence} /></div>
          <DynamicFormRenderer
            schema={createPaymentReceiptFormSchema(state.accounts || [], [
              { value: 'TRANSFER', label: 'حواله پایا / ساتنا' },
              { value: 'CASH', label: 'نقدی / کارتخوان POS' },
              { value: 'CHEQUE', label: 'چک صیادی' }
            ])}
            initialValues={{ method: 'TRANSFER' }}
            onSubmit={handleCreatePayment}
            onCancel={() => setShowPaymentModal(false)}
            submitLabel="ثبت رسید پرداخت"
          />
        </Modal>
      )}

      {showInvoiceModal && (
        <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="صدور فاکتور رسمی جدید">
          <DynamicFormRenderer
            schema={createInvoiceFormSchema(
              state.accounts || [],
              (state.quotes || []).filter(q => !(q as any).invoicedId).map(q => {
                const acc = state.accounts?.find(a => a.id === q.accountId);
                return { id: q.id, value: q.id, label: `${q.quoteNumber} | ${acc?.name || 'مشتری نامشخص'} | ${Number(q.totalAmount).toLocaleString()} ریال` };
              })
            )}
            onSubmit={handleCreateInvoice}
            onCancel={() => setShowInvoiceModal(false)}
            submitLabel="صدور و ثبت فاکتور"
          />
        </Modal>
      )}

      {showChequeModal && (
        <Modal isOpen={showChequeModal} onClose={() => setShowChequeModal(false)} title="ثبت چک صیادی جدید">
          <DynamicFormRenderer
            schema={createChequeFormSchema(state.accounts || [])}
            onSubmit={handleCreateCheque}
            onCancel={() => setShowChequeModal(false)}
            submitLabel="ثبت چک در سامانه"
          />
        </Modal>
      )}

      {/* Modal: Record Promise to Pay with Dynamic Form Engine */}
      {showPromiseModal && selectedProfileForPromise && (
        <Modal 
          isOpen={showPromiseModal} 
          onClose={() => { setShowPromiseModal(false); setSelectedProfileForPromise(null); }} 
          title={`ثبت تعهد و وعده پرداخت: ${selectedProfileForPromise.accountName}`}
        >
          <DynamicFormRenderer
            schema={COLLECTION_PROMISE_SCHEMA}
            initialValues={{
              promisedAmount: selectedProfileForPromise.overdueBalance || undefined,
              promisedDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
              paymentMethod: 'TRANSFER',
              autoGenerateCalendarTask: true,
              contactPerson: selectedProfileForPromise.accountName
            }}
            onSubmit={handleSavePromise}
            onCancel={() => { setShowPromiseModal(false); setSelectedProfileForPromise(null); }}
            submitLabel="ثبت تعهد و تنظیم وظیفه تقویم"
          />
        </Modal>
      )}

      {/* Modal: Generate Collection Task */}
      {showAutoTaskModal && selectedProfileForTask && (
        <Modal 
          isOpen={showAutoTaskModal} 
          onClose={() => { setShowAutoTaskModal(false); setSelectedProfileForTask(null); }} 
          title={`تنظیم وظیفه پیگیری وصول: ${selectedProfileForTask.accountName}`}
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => { setShowAutoTaskModal(false); setSelectedProfileForTask(null); }}>انصراف</Button>
              <Button variant="primary" size="sm" onClick={handleGenerateManualTask}>ثبت در تقویم و کارتابل</Button>
            </>
          }
        >
          <div className="space-y-4 text-xs" dir="rtl">
            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-red-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert size={15} />
                <span>مشتری: {selectedProfileForTask.accountName} (سطح ریسک: {selectedProfileForTask.riskLevel})</span>
              </div>
              <div className="text-[11px]">
                مانده معوق: <strong>{selectedProfileForTask.overdueBalance.toLocaleString('fa-IR')} ریال</strong> | حداکثر تأخیر: <strong>{selectedProfileForTask.maxDaysOverdue} روز</strong>
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-text-main">تاریخ موعد پیگیری در تقویم شمسی *</label>
              <CustomDatePicker 
                value={autoTaskDueDate} 
                onChange={setAutoTaskDueDate} 
                calendarType={state.settings?.locale?.calendar === 'gregorian' ? 'gregorian' : 'jalali'}
              />
            </div>

            <Input 
              label="یادداشت و هدف مذاکره کارشناس مالی" 
              value={autoTaskNote} 
              onChange={e => setAutoTaskNote(e.target.value)} 
              placeholder="مثال: تماس با مدیر مالی جهت استعلام وضعیت واریز فاکتورهای معوق" 
            />
          </div>
        </Modal>
      )}
      <Modal isOpen={!!fixFor} onClose={() => { setFixFor(null); setFixReason(''); }} title="بازگشت رسید برای اصلاح" footer={<><Button variant="ghost" size="sm" onClick={() => { setFixFor(null); setFixReason(''); }}>انصراف</Button><Button variant="primary" size="sm" onClick={handleNeedsFix} disabled={!fixReason.trim()}>ثبت</Button></>}>
        <Input label="دلیل اصلاح *" value={fixReason} onChange={e => setFixReason(e.target.value)} placeholder="مثال: فیش ناخوانا یا مبلغ مغایر" />
      </Modal>
      <Modal isOpen={!!reqKind} onClose={() => setReqKind(null)} title={reqKind ? `${FINANCE_KIND_LABEL[reqKind]} جدید (موتور فرم‌های پویا)` : ''}>
        <DynamicFormRenderer schema={FINANCE_REQUEST_SCHEMA} onSubmit={submitFinanceRequest} onCancel={() => setReqKind(null)} submitLabel="ثبت برای حسابدار" />
      </Modal>
      <Modal isOpen={!!decide} onClose={() => { setDecide(null); setDecideNote(''); }} title={decide?.mode === 'REJECT' ? 'رد درخواست' : 'درخواست اطلاعات بیشتر'} footer={<><Button variant="ghost" size="sm" onClick={() => { setDecide(null); setDecideNote(''); }}>انصراف</Button><Button variant="primary" size="sm" disabled={!decideNote.trim()} onClick={() => decide && decideRequest(decide.id, decide.mode, decideNote)}>ثبت</Button></>}>
        <Input label="یادداشت *" value={decideNote} onChange={e => setDecideNote(e.target.value)} placeholder="دلیل رد یا اطلاعات موردنیاز" />
      </Modal>
    </div>
  );
}
