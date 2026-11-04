import { canEditQuoteLines } from '../lib/cpqEngine';
import { useCan } from '../hooks/useCan';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, Quote, QuoteLine, ID, ExternalProduct, PriceWaterfallBreakdown } from '../types';
import { generateId, nextSequenceNumber, formatCurrency, cleanNumericInput, formatInputCurrency, parsePersianNumber, formatAppDate } from '../lib/utils';
import { calculateQuoteLineMargin, calculatePriceWaterfall } from '../lib/cpqEngine';
import { generateQuoteNegotiationScenarios, QuoteNegotiationScenario } from '../lib/negotiationEngine';
import { emitBusinessEvent } from '../lib/events';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { FileText, Send, CheckCircle2, AlertTriangle, Plus, Trash2, ArrowRight, Printer, Sparkles, Building2, Layers, ChevronDown, BarChart2 } from 'lucide-react';
import { CustomerInvoicePrint } from './PrintLayouts';
import { ProfitModal } from './ProfitModal';
import { QuoteWizardModal } from './QuoteWizardModal';
import { DataSourceStatus } from './ui/DataSourceStatus';

interface QuotesWorkspaceProps {
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
  setActiveTab?: (tab: any) => void;
}

export function QuotesWorkspace({ state, updateState, setActiveTab }: QuotesWorkspaceProps) {
  const { can, canOn, denied } = useCan(state, updateState);
  const navigate = useNavigate();
  const [activeQuoteId, setActiveQuoteId] = useState<ID | null>(() => {
    return state.quotes[0]?.id || null;
  });
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [waterfallBreakdown, setWaterfallBreakdown] = useState<{ title: string; breakdown: PriceWaterfallBreakdown } | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<ID>(state.activeContextAccountId || state.accounts[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState<ID>(state.externalProducts[0]?.id || '');
  const [lineQuantity, setLineQuantity] = useState<string>('1');
  const [linePrice, setLinePrice] = useState<string>(() => String(state.externalProducts[0]?.basePrice || ''));

  const visibleQuotes = (state.quotes || []).filter(quote => canOn('quotes', 'VIEW', {
    ownerId: quote.ownerId, branchId: quote.branchId, territoryId: quote.territoryId, teamId: quote.teamId, tenantId: quote.tenantId
  }));
  const activeQuote = visibleQuotes.find(q => q.id === activeQuoteId) || visibleQuotes[0];
  const activeQuoteAccount = activeQuote ? state.accounts.find(account => account.id === activeQuote.accountId && canOn('accounts', 'VIEW', {
    ownerId: account.ownerId, branchId: account.branchId, territoryId: account.territoryId, teamId: account.teamId, tenantId: account.tenantId
  })) : undefined;
  const threshold = state.settings?.quoteApprovalMarginThreshold || 15;
  const activeQuoteKnownCostCount = activeQuote?.lines.filter(line => Number.isFinite(line.costPrice) && line.costPrice > 0).length || 0;
  const activeQuoteMarginCompleteness = activeQuote
    ? (activeQuote.lines.length > 0 && activeQuoteKnownCostCount === activeQuote.lines.length ? 'KNOWN' : activeQuoteKnownCostCount > 0 ? 'PARTIAL' : 'UNKNOWN')
    : 'UNKNOWN';
  const negotiationScenarios = useMemo(
    () => activeQuote ? generateQuoteNegotiationScenarios(activeQuote, state) : [],
    [activeQuote, state]
  );

  const handleApplyNegotiationScenario = (scenario: QuoteNegotiationScenario) => {
    if (!activeQuote || activeQuote.status !== 'DRAFT') return;
    if (!canOn('quotes', 'EDIT', { ownerId: activeQuote.ownerId, branchId: activeQuote.branchId, territoryId: activeQuote.territoryId, teamId: activeQuote.teamId, tenantId: activeQuote.tenantId })) return denied('اعمال پیشنهاد مذاکره');
    if (scenario.creditRisk === 'CRITICAL') {
      updateState(draft => {
        if (!draft.notifications) draft.notifications = [];
        draft.notifications.push({
          id: generateId(), title: 'پیشنهاد با ریسک اعتباری بالا اعمال نشد',
          message: 'مبلغ پیشنهادی از سقف اعتبار تعریف‌شده عبور می‌کند. ابتدا باید وضعیت اعتبار توسط مسئول مجاز بررسی شود.',
          type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'quotes', entityId: activeQuote.id
        });
      });
      return;
    }
    updateState(draft => {
      const quote = draft.quotes.find(item => item.id === activeQuote.id);
      if (!quote || quote.status !== 'DRAFT') return;
      const beforeAmount = quote.totalAmount;
      quote.lines = scenario.lines.map(line => ({ ...line }));
      quote.totalAmount = quote.lines.reduce((sum, line) => sum + (Number.isFinite(line.lineTotal) ? line.lineTotal : line.unitPrice * line.quantity), 0);
      const costKnown = quote.lines.every(line => Number.isFinite(line.costPrice) && line.costPrice > 0);
      if (costKnown) {
        const cost = quote.lines.reduce((sum, line) => sum + line.costPrice * line.quantity, 0);
        quote.marginPercent = quote.totalAmount > 0 ? Math.round(((quote.totalAmount - cost) / quote.totalAmount) * 1000) / 10 : 0;
        quote.marginCompleteness = 'KNOWN';
      } else {
        quote.marginPercent = 0;
        quote.marginCompleteness = quote.lines.some(line => Number.isFinite(line.costPrice) && line.costPrice > 0) ? 'PARTIAL' : 'UNKNOWN';
      }
      quote.updatedAt = new Date().toISOString();
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(), action: 'QUOTE_NEGOTIATION_SCENARIO_APPLIED', entityType: 'QUOTE', entityId: quote.id,
        details: `سناریوی «${scenario.title}» اعمال شد؛ مبلغ قبل ${beforeAmount} و مبلغ بعد ${quote.totalAmount}.`,
        actor: draft.users?.find(user => user.id === draft.currentUserId)?.name || 'System', createdAt: new Date().toISOString()
      } as any);
    });
  };

  const handleCreateDraftQuote = () => {
    if (!can('quotes', 'CREATE')) return denied('صدور پیش‌فاکتور');
    const accessibleAccounts = (state.accounts || []).filter(account => canOn('accounts', 'VIEW', { ownerId: account.ownerId, branchId: account.branchId, territoryId: account.territoryId, teamId: account.teamId, tenantId: account.tenantId }));
    const preferredAccountId = state.activeContextAccountId;
    const accId = preferredAccountId && accessibleAccounts.some(account => account.id === preferredAccountId) ? preferredAccountId : accessibleAccounts[0]?.id;
    if (!accId) {
      alert('ابتدا حداقل یک حساب یا مشتری در سیستم تعریف کنید.');
      return;
    }
    if (!state.currentUserId) return;
    const newId = generateId();
    const newQuoteNumber = nextSequenceNumber('QT-', (state.quotes || []).map(x => x.quoteNumber), 1001);
    updateState(draft => {
      const creator = draft.users.find(user => user.id === state.currentUserId);
      const newQuote: Quote = {
        id: newId,
        quoteNumber: newQuoteNumber,
        accountId: accId,
        ownerId: state.currentUserId,
        branchId: creator?.branchId,
        territoryId: creator?.territoryId,
        teamId: creator?.teamId,
        tenantId: creator?.tenantId,
        status: 'DRAFT',
        lines: [],
        versions: [{
          versionNumber: 1,
          totalAmount: 0,
          marginPercent: 0,
          createdAt: new Date().toISOString(),
          createdBy: state.currentUserId
        }],
        totalAmount: 0,
        marginPercent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      draft.quotes.unshift(newQuote);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(),
        action: 'QUOTE_CREATED',
        entityType: 'QUOTE',
        entityId: newId,
        details: `پیش‌فاکتور جدید ${newQuoteNumber} ایجاد شد`,
        actor: state.users.find(u => u.id === state.currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });
    setActiveQuoteId(newId);
  };

  const handleAddLine = () => {
    if (!activeQuote) return;
    { const g = canEditQuoteLines(activeQuote); if (!g.ok) return denied(g.reason || 'ویرایش اقلام پیش‌فاکتور'); }
    const prod = state.externalProducts.find(p => p.id === selectedProductId);
    if (!prod) return;

    const unitPrice = parsePersianNumber(linePrice) || prod.basePrice;
    const quantity = Math.max(1, parsePersianNumber(lineQuantity) || 1);
    const costPrice = prod.costPrice;
    const lineTotal = unitPrice * quantity;

    updateState(draft => {
      const q = draft.quotes.find(item => item.id === activeQuote.id);
      if (!q) return;

      const newLine: QuoteLine = {
        id: generateId(),
        productId: prod.id,
        quantity,
        unitPrice,
        costPrice,
        lineTotal
      };
      q.lines.push(newLine);

      const totalAmount = q.lines.reduce((sum, l) => sum + l.lineTotal, 0);
      const knownCostLines = q.lines.filter(l => Number.isFinite(l.costPrice) && l.costPrice > 0);
      const costsComplete = q.lines.length > 0 && knownCostLines.length === q.lines.length;
      const totalCost = knownCostLines.reduce((sum, l) => sum + (l.costPrice * l.quantity), 0);
      const totalProfit = totalAmount - totalCost;
      const marginPercent = costsComplete && totalAmount > 0 ? Math.round((totalProfit / totalAmount) * 1000) / 10 : 0;

      q.totalAmount = totalAmount;
      q.marginPercent = marginPercent;
      q.marginCompleteness = costsComplete ? 'KNOWN' : knownCostLines.length ? 'PARTIAL' : 'UNKNOWN';
      q.updatedAt = new Date().toISOString();
    });

    setIsAddModalOpen(false);
  };

  const handleAddBundle = (bundleId: ID) => {
    if (!activeQuote) return;
    { const g = canEditQuoteLines(activeQuote); if (!g.ok) return denied(g.reason || 'ویرایش اقلام پیش‌فاکتور'); }
    const bundle = (state.productBundles || []).find((b: any) => b.id === bundleId);
    if (!bundle) return;

    updateState(draft => {
      const q = draft.quotes.find(item => item.id === activeQuote.id);
      if (!q) return;

      bundle.productIds.forEach((prodId: string) => {
        const prod = state.externalProducts.find(p => p.id === prodId);
        if (prod) {
          const discountMultiplier = (100 - bundle.discountPercent) / 100;
          const discountedPrice = Math.round(prod.basePrice * discountMultiplier);
          q.lines.push({
            id: generateId(),
            productId: prod.id,
            quantity: 1,
            unitPrice: discountedPrice,
            costPrice: prod.costPrice,
            lineTotal: discountedPrice,
            appliedTiers: [bundle.name]
          });
        }
      });

      const totalAmount = q.lines.reduce((sum, l) => sum + l.lineTotal, 0);
      const knownCostLines = q.lines.filter(l => Number.isFinite(l.costPrice) && l.costPrice > 0);
      const costsComplete = q.lines.length > 0 && knownCostLines.length === q.lines.length;
      const totalCost = knownCostLines.reduce((sum, l) => sum + (l.costPrice * l.quantity), 0);
      const totalProfit = totalAmount - totalCost;
      const marginPercent = costsComplete && totalAmount > 0 ? Math.round((totalProfit / totalAmount) * 1000) / 10 : 0;

      q.totalAmount = totalAmount;
      q.marginPercent = marginPercent;
      q.marginCompleteness = costsComplete ? 'KNOWN' : knownCostLines.length ? 'PARTIAL' : 'UNKNOWN';
      q.updatedAt = new Date().toISOString();
    });

    setIsBundleModalOpen(false);
  };

  const handleOpenLineWaterfall = (line: QuoteLine) => {
    const prod = state.externalProducts.find(p => p.id === line.productId);
    if (!prod) return;
    const hasSnapshot = !!activeQuote.pricingSnapshot;
    const contract = hasSnapshot ? undefined : (state.contracts || []).find((c: any) => c.accountId === activeQuote.accountId);
    const rebateValue = Number(contract?.rebatePercent);
    const rebate = Number.isFinite(rebateValue) && rebateValue >= 0 && rebateValue <= 100 ? rebateValue : 0;
    const applicableTiers = hasSnapshot ? [] : (state.volumeTiers || []).filter((vt: any) =>
      vt.productId === prod.id && Number.isFinite(Number(vt.minQuantity)) && line.quantity >= Number(vt.minQuantity) &&
      Number.isFinite(Number(vt.discountPercent)) && Number(vt.discountPercent) >= 0 && Number(vt.discountPercent) <= 100
    ).sort((a: any, b: any) => Number(b.minQuantity) - Number(a.minQuantity));
    const volumeDiscountPercent = Number(applicableTiers[0]?.discountPercent) || 0;

    const snapshotBasePrice = (activeQuote as any).pricingSnapshot?.productBasePrices?.[prod.id];
    const snapshotCostPrice = (activeQuote as any).pricingSnapshot?.productCosts?.[prod.id];
    const breakdown = calculatePriceWaterfall({
      basePrice: Number.isFinite(snapshotBasePrice) ? snapshotBasePrice : prod.basePrice,
      quantity: line.quantity,
      costPrice: Number.isFinite(snapshotCostPrice) ? snapshotCostPrice : line.costPrice,
      negotiatedUnitPrice: line.unitPrice,
      appliedVolumeDiscountPercent: volumeDiscountPercent,
      contractRebatePercent: rebate
    });

    setWaterfallBreakdown({
      title: `${hasSnapshot ? 'تحلیل قیمت ثبت‌شده' : 'تحلیل قیمت و قواعد فعلی'}: ${prod.name}`,
      breakdown
    });
  };

  const handleRemoveLine = (lineId: ID) => {
    if (!activeQuote) return;
    { const g = canEditQuoteLines(activeQuote); if (!g.ok) return denied(g.reason || 'ویرایش اقلام پیش‌فاکتور'); }
    updateState(draft => {
      const q = draft.quotes.find(item => item.id === activeQuote.id);
      if (!q) return;
      const removed = q.lines.find(l => l.id === lineId);
      q.lines = q.lines.filter(l => l.id !== lineId);
      if (removed) {
        if (!draft.auditLogs) draft.auditLogs = [];
        draft.auditLogs.push({
          id: generateId(), action: 'QUOTE_LINE_REMOVED', entityType: 'QUOTE', entityId: q.id,
          details: `قلم «${(removed as any).productName || (removed as any).name || removed.id}» (مبلغ ${Number(removed.lineTotal || 0).toLocaleString('fa-IR')} ریال) از پیش‌فاکتور ${q.quoteNumber} حذف شد`,
          actor: draft.users?.find(u => u.id === draft.currentUserId)?.name || 'System', createdAt: new Date().toISOString()
        } as any);
      }

      const totalAmount = q.lines.reduce((sum, l) => sum + l.lineTotal, 0);
      const knownCostLines = q.lines.filter(l => Number.isFinite(l.costPrice) && l.costPrice > 0);
      const costsComplete = q.lines.length > 0 && knownCostLines.length === q.lines.length;
      const totalCost = knownCostLines.reduce((sum, l) => sum + (l.costPrice * l.quantity), 0);
      const totalProfit = totalAmount - totalCost;
      const marginPercent = costsComplete && totalAmount > 0 ? Math.round((totalProfit / totalAmount) * 1000) / 10 : 0;

      q.totalAmount = totalAmount;
      q.marginPercent = marginPercent;
      q.marginCompleteness = costsComplete ? 'KNOWN' : knownCostLines.length ? 'PARTIAL' : 'UNKNOWN';
      q.updatedAt = new Date().toISOString();
    });
  };

  const handleAction = (action: 'REQUEST_APPROVAL' | 'APPROVE' | 'ACCEPT' | 'REJECT' | 'HANDOFF') => {
    if (!can('quotes', action === 'APPROVE' || action === 'HANDOFF' ? 'APPROVE' : 'EDIT')) return denied(action === 'APPROVE' ? 'تایید پیش‌فاکتور' : 'تغییر وضعیت پیش‌فاکتور');
    if (!activeQuote) return;
    if (!canOn('quotes', action === 'APPROVE' || action === 'HANDOFF' ? 'APPROVE' : 'EDIT', { ownerId: activeQuote.ownerId, branchId: activeQuote.branchId, territoryId: activeQuote.territoryId, teamId: activeQuote.teamId, tenantId: activeQuote.tenantId })) return denied('دسترسی به این پیش‌فاکتور');
    // هیچ API/Connector واقعی در این نسخه پیکربندی نشده است؛ شماره خارجی یا موفقیت ساختگی نساز.
    if (action === 'HANDOFF') {
      updateState(draft => {
        if (!draft.notifications) draft.notifications = [];
        draft.notifications.push({
          id: generateId(),
          title: 'ارسال به سامانه خارجی پیکربندی نشده است',
          message: `پیش‌فاکتور ${activeQuote.quoteNumber} ارسال نشد. برای تحویل واقعی، Connector/API مجاز و Outbox سمت سرور باید پیکربندی شود.`,
          type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'quotes', entityId: activeQuote.id
        });
        if (!draft.auditLogs) draft.auditLogs = [];
        draft.auditLogs.push({
          id: generateId(), action: 'QUOTE_HANDOFF_BLOCKED_NOT_CONFIGURED', entityType: 'QUOTE', entityId: activeQuote.id,
          details: `تلاش برای ارسال ${activeQuote.quoteNumber} انجام شد؛ ارسال به‌دلیل نبود Connector/API واقعی متوقف شد.`,
          actor: draft.users?.find(u => u.id === draft.currentUserId)?.name || 'System', createdAt: new Date().toISOString()
        } as any);
      });
      return;
    }
    updateState(draft => {
      const quote = draft.quotes.find(q => q.id === activeQuote.id);
      if (!quote) return;

      if (action === 'REQUEST_APPROVAL') {
        quote.status = 'PENDING_APPROVAL';
        if (!draft.notifications) draft.notifications = [];
        draft.notifications.push({
          id: generateId(),
          title: `درخواست تایید پیش‌فاکتور ${quote.quoteNumber}`,
          message: `مارجین پیش‌فاکتور (${quote.marginPercent}٪) کمتر از حد آستانه (${threshold}٪) است و نیازمند تایید است.`,
          type: 'WARNING',
          read: false,
          createdAt: new Date().toISOString(),
          linkTab: 'quotes'
        });
      }

      if (action === 'APPROVE') {
        quote.status = 'APPROVED';
        if (!draft.notifications) draft.notifications = [];
        draft.notifications.push({
          id: generateId(),
          title: `پیش‌فاکتور ${quote.quoteNumber} تایید شد`,
          message: `مدیریت پیش‌فاکتور را با مارجین ${quote.marginPercent}٪ تایید کرد.`,
          type: 'SUCCESS',
          read: false,
          createdAt: new Date().toISOString(),
          linkTab: 'quotes'
        });
      }

      if (action === 'ACCEPT') {
        // پذیرش مشتری فقط وضعیت پیشنهاد تجاری را تغییر می‌دهد؛ Quote هرگز به‌تنهایی فاکتور قطعی نمی‌سازد.
        quote.status = 'ACCEPTED';
        if (!draft.notifications) draft.notifications = [];
        draft.notifications.push({
          id: generateId(),
          title: `پیش‌فاکتور ${quote.quoteNumber} توسط مشتری پذیرفته شد`,
          message: 'پذیرش ثبت شد. صدور فاکتور قطعی باید از مسیر مجاز مالی/ERP و با نتیجه واقعی منبع انجام شود.',
          type: 'SUCCESS',
          read: false,
          createdAt: new Date().toISOString(),
          linkTab: 'quotes',
          entityId: quote.id
        });
        if (!draft.auditLogs) draft.auditLogs = [];
        draft.auditLogs.push({
          id: generateId(), action: 'QUOTE_ACCEPTED', entityType: 'QUOTE', entityId: quote.id,
          details: `پذیرش مشتری برای پیش‌فاکتور ${quote.quoteNumber} ثبت شد؛ فاکتور قطعی به‌صورت خودکار ایجاد نشد.`,
          actor: draft.users?.find(u => u.id === draft.currentUserId)?.name || 'System',
          createdAt: new Date().toISOString()
        } as any);
      }

      if (action === 'REJECT') {
        quote.status = 'REJECTED';
      }

      quote.updatedAt = new Date().toISOString();
    });

    if (action === 'APPROVE') {
      emitBusinessEvent('QUOTE_APPROVED', 'QUOTE', activeQuote.id, activeQuote, state, updateState);
    }
  };

  const handleConvertToInvoice = () => {
    if (!can('quotes', 'EDIT') || !can('finance', 'CREATE')) return denied('تبدیل پیش‌فاکتور به فاکتور');
    if (!activeQuote) return;
    if (!canOn('quotes', 'EDIT', { ownerId: activeQuote.ownerId, branchId: activeQuote.branchId, territoryId: activeQuote.territoryId, teamId: activeQuote.teamId, tenantId: activeQuote.tenantId })) return denied('دسترسی به این پیش‌فاکتور');
    const manualFinanceEntryEnabled = (state.settings as any)?.orgConfig?.allowManualFinanceEntry === true;
    if (!manualFinanceEntryEnabled) {
      updateState(draft => {
        if (!draft.notifications) draft.notifications = [];
        draft.notifications.push({
          id: generateId(), title: 'صدور فاکتور دستی مجاز نیست',
          message: 'پیش‌فاکتور به فاکتور قطعی تبدیل نشد. صدور فاکتور باید از ERP/حسابداری یا از مسیر ورود دستیِ صریحاً مجاز انجام شود.',
          type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'finance', entityId: activeQuote.id
        });
      });
      return;
    }
    const invNum = `INV-${activeQuote.quoteNumber.replace('QT-', '')}`;
    if ((state.invoices || []).some(i => i.invoiceNumber === invNum)) {
      updateState(draft => {
        if (!draft.notifications) draft.notifications = [];
        draft.notifications.push({
          id: generateId(), title: 'فاکتور تکراری ایجاد نشد',
          message: `فاکتور با شماره ${invNum} از قبل وجود دارد؛ برای جلوگیری از ثبت تکراری عملیات متوقف شد.`,
          type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'finance', entityId: activeQuote.id
        });
      });
      return;
    }
    const invId = generateId();
    const invoiceItems = activeQuote.lines.map(line => {
      const prod = state.externalProducts.find(p => p.id === line.productId);
      return {
        id: generateId(),
        description: prod?.name || `کالای کد ${line.productId}`,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: line.lineTotal
      };
    });

    updateState(draft => {
      if (!draft.invoices) draft.invoices = [];
      const newInvoice = {
        id: invId,
        invoiceNumber: invNum,
        accountId: activeQuote.accountId || '',
        customerId: activeQuote.accountId || '',
        totalAmount: activeQuote.totalAmount,
        paidAmount: 0,
        balance: activeQuote.totalAmount,
        status: 'UNPAID' as const,
        date: new Date().toISOString(),
        items: invoiceItems
      };
      draft.invoices.unshift(newInvoice);

      const acc = (draft.accounts || []).find(a => a.id === activeQuote.accountId);
      if (acc) {
        acc.balance = (acc.balance || 0) + activeQuote.totalAmount;
        acc.totalRevenue = (acc.totalRevenue || 0) + activeQuote.totalAmount;
      }

      const q = draft.quotes.find(item => item.id === activeQuote.id);
      if (q) {
        q.status = 'ACCEPTED';
        (q as any).invoicedId = invId;
        q.updatedAt = new Date().toISOString();
      }
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(), action: 'MANUAL_INVOICE_CREATED_FROM_QUOTE', entityType: 'INVOICE', entityId: invId,
        details: `فاکتور دستی ${invNum} از پیش‌فاکتور ${activeQuote.quoteNumber} ایجاد شد؛ سیاست ورود دستی مالی فعال بود.`,
        actor: draft.users?.find(user => user.id === draft.currentUserId)?.name || 'System', createdAt: new Date().toISOString()
      } as any);

      if (!draft.notifications) draft.notifications = [];
      draft.notifications.push({
        id: generateId(),
        title: `فاکتور رسمی صادر شد`,
        message: `پیش‌فاکتور ${activeQuote.quoteNumber} با موفقیت به فاکتور رسمی مالی ${invNum} تبدیل گردید.`,
        type: 'SUCCESS',
        read: false,
        createdAt: new Date().toISOString(),
        linkTab: 'finance'
      });
    });

    navigate('/finance');
  };

  const getStatusBadge = (status: Quote['status']) => {
    switch (status) {
      case 'DRAFT': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-canvas text-text-secondary border border-border">پیش‌نویس (DRAFT)</span>;
      case 'PENDING_APPROVAL': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-warning dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">در انتظار تایید مدیریت</span>;
      case 'APPROVED': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-50 dark:bg-sky-950/40 text-info dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/40">تایید شده توسط مدیریت</span>;
      case 'SENT': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 dark:bg-primary-950/40 text-primary dark:text-blue-400 border border-primary/20">ارسال به مشتری</span>;
      case 'ACCEPTED': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-success-soft dark:bg-emerald-950/40 text-success dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">تایید نهایی مشتری</span>;
      case 'REJECTED': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 dark:bg-rose-950/40 text-danger dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">رد شده</span>;
      case 'CANCELLED': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 dark:bg-rose-950/40 text-red-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">لغوشده</span>;
      case 'PENDING_APPROVAL_ERP': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">در انتظار تأیید لغو در ERP</span>;
      case 'HANDOFF_EXTERNAL': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/20 dark:bg-primary-950/60 text-primary-hover dark:text-blue-300 border border-primary/30">ارسال به ERP (تحویل نهایی)</span>;
      default: return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-border">{status}</span>;
    }
  };

  return (
    <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-32 font-premium" dir="rtl">
      <Card padding="md" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface border-border/80">
        <div>
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> میز پیش‌فاکتورها و پروپوزال‌های تجاری (CPQ)
          </h2>
          <span className="text-xs text-text-secondary block mt-0.5">
            پیکربندی قیمت، درخواست تاییدیه مارجین، و انتقال به سیستم ثبت سفارش خارجی
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setIsWizardOpen(true)} className="shadow-sm" icon={<Sparkles className="w-4 h-4" />}>
            صدور پیش‌فاکتور با ویزارد
          </Button>
          <Button variant="outline" onClick={handleCreateDraftQuote} icon={<Plus className="w-4 h-4" />}>
            پیش‌نویس سریع
          </Button>
        </div>
      </Card>

      <DataSourceStatus 
        source="CRM" 
        sourceName="موتور قیمت‌گذاری و پیش‌فاکتور تجاری (CPQ)" 
        isAuthoritative={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-text-secondary px-1">لیست پیش‌فاکتورها ({visibleQuotes.length})</h3>
          {visibleQuotes.map(q => {
            const acc = state.accounts.find(a => a.id === q.accountId);
            const accountIsVisible = !!acc && canOn('accounts', 'VIEW', { ownerId: acc.ownerId, branchId: acc.branchId, territoryId: acc.territoryId, teamId: acc.teamId, tenantId: acc.tenantId });
            const isSelected = activeQuote?.id === q.id;
            return (
              <Card 
                key={q.id} 
                padding="md" 
                onClick={() => setActiveQuoteId(q.id)}
                className={`cursor-pointer transition-all border ${isSelected ? 'border-primary/60 bg-surface shadow-md' : 'border-border/70 hover:bg-surface-secondary bg-surface'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-sm font-bold text-text-main font-mono">{q.quoteNumber}</strong>
                    <div className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-text-secondary" />
                      <span>{accountIsVisible ? acc?.name : 'حساب محدود'}</span>
                    </div>
                  </div>
                  {getStatusBadge(q.status)}
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/70 text-xs">
                  <span className="text-text-secondary">ارزش کل:</span>
                  <span className="font-bold font-mono text-text-main">{formatCurrency(q.totalAmount)} ریال</span>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {activeQuote ? (
            <Card padding="lg" className="space-y-4 bg-surface border-border/80">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-border gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-text-main font-mono">{activeQuote.quoteNumber}</h3>
                    {getStatusBadge(activeQuote.status)}
                  </div>
                  <div className="text-xs text-text-secondary mt-1 flex flex-wrap gap-3">
                    <span>حساب: {activeQuoteAccount ? <strong className="cursor-pointer hover:text-primary" onClick={() => navigate(`/accounts/${activeQuote.accountId}`)}>{activeQuoteAccount.name}</strong> : <strong>حساب محدود</strong>}</span>
                    <span>•</span>
                    <span>تاریخ: <strong className="font-mono">{formatAppDate(activeQuote.createdAt, state.settings?.locale)}</strong></span>
                    {activeQuote.validUntil && <span>اعتبار تا: <strong className="font-mono">{formatAppDate(activeQuote.validUntil, state.settings?.locale)}</strong></span>}
                    {activeQuote.externalOrderId && (
                      <span className="text-primary font-bold font-mono">شناسه سفارش خارجی: {activeQuote.externalOrderId}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeQuote.status === 'DRAFT' && (
                    <>
                      {can('quotes', 'EDIT') && <Button size="sm" variant="outline" onClick={() => handleAction('REQUEST_APPROVAL')}>
                        درخواست تایید مدیریت
                      </Button>}
                      {can('quotes', 'APPROVE') && <Button size="sm" variant="primary" onClick={() => handleAction('APPROVE')}>
                        تایید قیمت
                      </Button>}
                    </>
                  )}

                  {activeQuote.status === 'PENDING_APPROVAL' && (
                    can('quotes', 'APPROVE') ? <>
                      <Button size="sm" variant="success" onClick={() => handleAction('APPROVE')} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                        تایید نهایی مدیریت
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleAction('REJECT')}>
                        رد پیش‌فاکتور
                      </Button>
                    </> : <span className="text-xs text-warning font-bold rounded-xl bg-warning-soft px-3 py-2">در انتظار تصمیم مدیر مجاز</span>
                  )}

                  {activeQuote.status === 'APPROVED' && (
                    <Button size="sm" variant="primary" onClick={() => handleAction('ACCEPT')} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                      ثبت تاییدیه مشتری
                    </Button>
                  )}

                  {(activeQuote.status === 'ACCEPTED' || activeQuote.status === 'HANDOFF_EXTERNAL') && (
                    <>
                      {can('finance', 'CREATE') && (state.settings as any)?.orgConfig?.allowManualFinanceEntry === true && <Button size="sm" variant="success" onClick={handleConvertToInvoice} icon={<FileText className="w-3.5 h-3.5" />}>
                        ثبت فاکتور دستی مجاز
                      </Button>}
                      {can('finance', 'CREATE') && (state.settings as any)?.orgConfig?.allowManualFinanceEntry !== true && <span className="text-[11px] text-text-secondary rounded-xl bg-canvas px-3 py-2">صدور فاکتور باید از ERP/حسابداری انجام شود.</span>}
                      {activeQuote.status === 'ACCEPTED' && can('quotes', 'APPROVE') && (
                        <Button size="sm" variant="outline" onClick={() => handleAction('HANDOFF')} icon={<Send className="w-3.5 h-3.5" />}>
                          ارسال به ERP (نیازمند اتصال)
                        </Button>
                      )}
                    </>
                  )}

                  <button onClick={() => setIsProfitModalOpen(true)} className="p-2 text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors" title="تحلیل اقتصادی و حاشیه سود">
                    <BarChart2 className="w-4 h-4" />
                    <span className="hidden sm:inline">تحلیل سود</span>
                  </button>

                  <button onClick={() => window.print()} className="p-2 text-text-secondary hover:text-text-main bg-canvas hover:bg-border rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors" title="چاپ پیش‌فاکتور">
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">چاپ</span>
                  </button>
                </div>
              </div>

              {(activeQuoteMarginCompleteness !== 'KNOWN' || activeQuote.marginPercent < threshold) && activeQuote.lines.length > 0 && activeQuote.status === 'DRAFT' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-warning flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                  <span>
                    {activeQuoteMarginCompleteness !== 'KNOWN' ? 'بهای تمام‌شدهٔ معتبر برای همه اقلام موجود نیست؛ سود قابل اتکا نیست.' : `مارجین ناخالص این پیش‌فاکتور (${activeQuote.marginPercent}٪) کمتر از کف مجاز سازمانی (${threshold}٪) است.`} پیش از نهایی‌سازی نیازمند درخواست مجوز و تایید مدیر بازرگانی است.
                  </span>
                </div>
              )}

              {activeQuote.lines.length > 0 && (
                <section className="rounded-2xl border border-border bg-canvas/70 p-4 space-y-3" aria-labelledby="quote-negotiation-heading">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 id="quote-negotiation-heading" className="text-sm font-bold text-text-main flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> میز مذاکره مبتنی بر داده</h4>
                      <p className="text-[11px] text-text-secondary mt-1">پیشنهاد افزایش فقط وقتی نمایش داده می‌شود که پلهٔ حجمی واقعی در تنظیمات محصول وجود داشته باشد؛ درصد فرضی ساخته نمی‌شود.</p>
                    </div>
                    <span className="text-[10px] text-text-secondary whitespace-nowrap">{negotiationScenarios.length} سناریو</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {negotiationScenarios.map(scenario => (
                      <div key={scenario.key} className="rounded-xl border border-border bg-surface p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <strong className="text-xs text-text-main">{scenario.title}</strong>
                          <span className={`text-[10px] rounded-full px-2 py-1 font-bold ${scenario.creditRisk === 'CRITICAL' ? 'bg-danger-soft text-danger' : scenario.creditRisk === 'HIGH' ? 'bg-warning-soft text-warning' : scenario.creditRisk === 'LOW' ? 'bg-success-soft text-success' : 'bg-canvas text-text-secondary'}`}>
                            {scenario.creditRisk === 'CRITICAL' ? 'عبور از سقف اعتبار' : scenario.creditRisk === 'HIGH' ? 'نزدیک سقف اعتبار' : scenario.creditRisk === 'LOW' ? 'در محدوده اعتبار' : 'اعتبار نامشخص'}
                          </span>
                        </div>
                        <div className="text-base font-bold font-mono text-text-main">{formatCurrency(scenario.proposedAmount)} ریال</div>
                        <div className="text-[11px] text-text-secondary">{scenario.proposedProfit === null ? 'سود قابل محاسبه نیست؛ بهای معتبر کافی نیست.' : `${scenario.profitCompleteness === 'PARTIAL' ? 'سود ناقص' : 'سود برآوردی'}: ${formatCurrency(scenario.proposedProfit)} ریال`}</div>
                        <p className="text-[11px] leading-relaxed text-text-secondary">{scenario.reason}</p>
                        {activeQuote.status === 'DRAFT' && (
                          <Button size="sm" variant="outline" className="w-full" disabled={scenario.creditRisk === 'CRITICAL'} onClick={() => handleApplyNegotiationScenario(scenario)}>
                            اعمال سناریو در پیش‌نویس
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeQuote.pricingSnapshot && (
                <div className="p-3 bg-primary/10 text-primary text-xs rounded-xl border border-primary/20 flex items-center gap-2 font-medium">
                  <span className="font-mono font-bold">⚠️ این سند به سیستم انبار/سفارشات ارسال شده و وضعیت قیمت‌گذاری آن در زمان تایید (Snapshot) قفل و فریز گردیده است.</span>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-text-main">اقلام پیش‌فاکتور ({activeQuote.lines.length})</h4>
                  {activeQuote.status === 'DRAFT' && (
                    <div className="flex items-center gap-2">
                      {(state.productBundles || []).length > 0 && (
                        <button onClick={() => setIsBundleModalOpen(true)} className="text-xs text-primary font-bold hover:text-primary-hover flex items-center gap-1 cursor-pointer bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                          <Layers className="w-3.5 h-3.5" /> افزودن بسته ترکیبی (Bundle)
                        </button>
                      )}
                      <button onClick={() => { const prod = state.externalProducts[0]; if (prod) { setSelectedProductId(prod.id); setLinePrice(String(prod.basePrice)); setLineQuantity('1'); } setIsAddModalOpen(true); }} className="text-xs text-success font-bold hover:text-success flex items-center gap-1 cursor-pointer bg-success-soft px-2.5 py-1 rounded-lg border border-success-line">
                        <Plus className="w-3.5 h-3.5" /> افزودن کالا از کاتالوگ
                      </button>
                    </div>
                  )}
                </div>

                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-canvas border-b border-border text-text-secondary font-semibold">
                      <tr>
                        <th className="p-3">شرح کالا (از سیستم خارجی)</th>
                        <th className="p-3">تعداد</th>
                        <th className="p-3">قیمت واحد (ریال)</th>
                        <th className="p-3">قیمت تمام‌شده</th>
                        <th className="p-3">مبلغ کل</th>
                        <th className="p-3 text-center">آبشار قیمت (CPQ)</th>
                        {activeQuote.status === 'DRAFT' && <th className="p-3 text-center">حذف</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeQuote.lines.length > 0 ? (
                        activeQuote.lines.map(line => {
                          const prod = state.externalProducts.find(p => p.id === line.productId);
                          const marginInfo = calculateQuoteLineMargin(line, prod, threshold);
                          return (
                            <tr key={line.id} className="hover:bg-canvas/50">
                              <td className="p-3 font-semibold text-text-main">
                                <div className="flex items-center gap-1.5">
                                  <span>{prod?.name || 'کالای نامشخص'}</span>
                                  {line.appliedTiers && line.appliedTiers.length > 0 && (
                                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.2 rounded">
                                      {line.appliedTiers.join(', ')}
                                    </span>
                                  )}
                                </div>
                                <span className="block text-[10px] text-text-secondary font-mono">{prod?.sku}</span>
                              </td>
                              <td className="p-3 font-mono font-bold">{line.quantity}</td>
                              <td className="p-3 font-mono">{formatCurrency(line.unitPrice)}</td>
                              <td className="p-3 font-mono text-text-secondary">{formatCurrency(line.costPrice)}</td>
                              <td className="p-3 font-mono font-bold text-primary">{formatCurrency(line.lineTotal)}</td>
                              <td className="p-3 text-center">
                                <button onClick={() => handleOpenLineWaterfall(line)} className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-canvas hover:bg-border text-text-main inline-flex items-center gap-1 transition-colors cursor-pointer" title="نمایش ریز محاسبات آبشاری قیمت">
                                  <BarChart2 size={12} className="text-primary" /> {marginInfo.isCostKnown ? `${marginInfo.marginPercent}٪` : 'سود نامشخص'}
                                </button>
                              </td>
                              {activeQuote.status === 'DRAFT' && (
                                <td className="p-3 text-center">
                                  <button onClick={() => handleRemoveLine(line.id)} className="p-1 text-text-secondary hover:text-danger rounded transition-colors cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-text-secondary">
                            هنوز کالایی به این پیش‌فاکتور افزوده نشده است.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-canvas p-4 rounded-xl border border-border grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[11px] text-text-secondary block">مبلغ کل پیش‌فاکتور:</span>
                  <strong className="text-base font-bold font-mono text-text-main">
                    {formatCurrency(activeQuote.totalAmount)} ریال
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-text-secondary block">حاشیه سود ناخالص (مارجین):</span>
                  <strong className={`text-base font-bold font-mono ${activeQuote.marginPercent < threshold ? 'text-warning' : 'text-success'}`}>
                    {activeQuoteMarginCompleteness !== 'KNOWN' ? 'نامشخص' : `${activeQuote.marginPercent}٪`}
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-text-secondary block">وضعیت مجوز مارجین:</span>
                  <span className="text-xs font-bold text-text-main">
                    {activeQuoteMarginCompleteness !== 'KNOWN' ? 'بهای معتبر کامل نیست؛ نیازمند بررسی مدیر' : activeQuote.marginPercent >= threshold ? 'مجاز و بدون نیاز به تایید' : 'نیازمند تایید سرپرست فروش'}
                  </span>
                </div>
              </div>
            </Card>
          ) : (
            <Card padding="lg" className="text-center text-text-secondary py-12 bg-surface border-border space-y-3">
              <p className="text-xs">یک پیش‌فاکتور از فهرست انتخاب کنید یا پیش‌فاکتور جدید صادر نمایید.</p>
              <div className="flex justify-center gap-2">
                <Button variant="primary" size="sm" onClick={() => setIsWizardOpen(true)} icon={<Sparkles className="w-3.5 h-3.5" />}>
                  صدور با ویزارد
                </Button>
                <Button variant="outline" size="sm" onClick={handleCreateDraftQuote} icon={<Plus className="w-3.5 h-3.5" />}>
                  پیش‌نویس سریع
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="افزودن قلم کالا به پیش‌فاکتور" footer={<><Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>انصراف</Button><Button variant="primary" size="sm" onClick={handleAddLine}>ثبت در پیش‌فاکتور</Button></>}>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-text-main mb-1">انتخاب کالا از کاتالوگ ERP</label>
              <select value={selectedProductId} onChange={e => { setSelectedProductId(e.target.value); const prod = state.externalProducts.find(p => p.id === e.target.value); if (prod) setLinePrice(String(prod.basePrice)); }} className="w-full bg-canvas border border-border rounded-xl p-2.5 font-medium outline-none focus:border-primary">
                {state.externalProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - قیمت پایه: {formatCurrency(p.basePrice)} ریال</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-text-main mb-1">تعداد</label>
                <input type="text" value={lineQuantity} onChange={e => setLineQuantity(cleanNumericInput(e.target.value))} placeholder="مثال: 10" className="w-full bg-canvas border border-border rounded-xl p-2.5 font-mono outline-none focus:border-primary" dir="ltr" />
              </div>
              <div>
                <label className="block font-bold text-text-main mb-1">قیمت توافقی واحد (ریال)</label>
                <input type="text" value={formatInputCurrency(linePrice)} onChange={e => setLinePrice(cleanNumericInput(e.target.value))} placeholder="قیمت به ریال" className="w-full bg-canvas border border-border rounded-xl p-2.5 font-mono outline-none focus:border-primary" dir="ltr" />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {isBundleModalOpen && (
        <Modal isOpen={isBundleModalOpen} onClose={() => setIsBundleModalOpen(false)} title="انتخاب و درج بسته ترکیبی محصولات (CPQ Bundle)" footer={<Button variant="ghost" size="sm" onClick={() => setIsBundleModalOpen(false)}>بستن</Button>}>
          <div className="space-y-3 text-xs">
            <p className="text-text-secondary">با انتخاب بسته، تمام اقلام زیرمجموعه آن همراه با درصد تخفیف ویژه پکیج به پیش‌فاکتور اضافه می‌شوند.</p>
            <div className="space-y-2">
              {(state.productBundles || []).map((b: any) => (
                <div key={b.id} className="p-3 bg-canvas border border-border rounded-xl flex justify-between items-center">
                  <div>
                    <strong className="text-sm font-bold text-text-main block">{b.name}</strong>
                    <span className="text-[11px] text-primary font-bold block mt-0.5">تخفیف پکیج: {b.discountPercent}٪ | اقلام شامل: {b.productIds.length} قلم کالا</span>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => handleAddBundle(b.id)}>افزودن به پیش‌فاکتور</Button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {waterfallBreakdown && (
        <Modal isOpen={!!waterfallBreakdown} onClose={() => setWaterfallBreakdown(null)} title={waterfallBreakdown.title} footer={<Button variant="primary" size="sm" onClick={() => setWaterfallBreakdown(null)}>بستن</Button>}>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-canvas rounded-xl border border-border space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-border">
                <span className="text-text-secondary">۱. قیمت پایه کاتالوگ (Base Price):</span>
                <span className="font-mono font-bold">{formatCurrency(waterfallBreakdown.breakdown.basePrice)} ریال</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border text-warning">
                <span>۲. تخفیف پلکانی تیراژ (Volume Tier Discount):</span>
                <span className="font-mono font-bold">- {formatCurrency(waterfallBreakdown.breakdown.volumeDiscount)} ریال</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border text-primary">
                <span>۳. تخفیف بسته ترکیبی (Bundle Discount):</span>
                <span className="font-mono font-bold">- {formatCurrency(waterfallBreakdown.breakdown.bundleDiscount)} ریال</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border text-info">
                <span>۴. ریبیت قرارداد سالانه (Contract Rebate):</span>
                <span className="font-mono font-bold">- {formatCurrency(waterfallBreakdown.breakdown.contractRebate)} ریال</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border text-danger">
                <span>۵. تخفیف توافقی مذاکره (Negotiated Discount):</span>
                <span className="font-mono font-bold">- {formatCurrency(waterfallBreakdown.breakdown.negotiatedDiscount)} ریال</span>
              </div>
              <div className="flex justify-between items-center py-2 bg-success-soft px-2 rounded-lg text-success font-bold">
                <span>۶. قیمت خالص فاکتور (Net Price):</span>
                <span className="font-mono text-sm">{formatCurrency(waterfallBreakdown.breakdown.netPrice)} ریال</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl font-mono text-center border border-border">
              <div>
                <span className="text-[11px] text-text-secondary block">بهای تمام‌شده کل:</span>
                <span className="font-bold text-text-main">{formatCurrency(waterfallBreakdown.breakdown.costPrice)} ریال</span>
              </div>
              <div>
                <span className="text-[11px] text-text-secondary block">مارجین ناخالص:</span>
                {waterfallBreakdown.breakdown.costKnown ? (
                  <span className={`font-bold ${(waterfallBreakdown.breakdown.grossMarginPercent ?? 0) < threshold ? 'text-warning' : 'text-success'}`}>
                    {waterfallBreakdown.breakdown.grossMarginPercent}٪ ({formatCurrency(waterfallBreakdown.breakdown.grossMarginAmount || 0)} ریال)
                  </span>
                ) : (
                  <span className="font-bold text-warning">سود قابل محاسبه نیست؛ بهای تمام‌شدهٔ معتبر موجود نیست.</span>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {isProfitModalOpen && activeQuote && (
        <ProfitModal state={state} quote={activeQuote} onClose={() => setIsProfitModalOpen(false)} />
      )}

      <QuoteWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} state={state} updateState={updateState} onQuoteCreated={(newId) => { setActiveQuoteId(newId); navigate('/quotes'); }} />

      {activeQuote && (
        <CustomerInvoicePrint state={state} quote={activeQuote} />
      )}
    </div>
  );
}
