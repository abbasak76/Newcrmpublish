import { guard, useCan } from '../hooks/useCan';
import React, { useState, useEffect } from 'react';
import { AppState, Quote, ID, DraftQuoteState } from '../types';
import { generateId, nextSequenceNumber, formatCurrency, parsePersianNumber, formatInputCurrency, cleanNumericInput } from '../lib/utils';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Package, CheckCircle2, ChevronRight, ChevronLeft, Plus, Trash2, Printer, Percent, ShieldCheck, FileText, Save } from 'lucide-react';
import { CustomerInvoicePrint } from './PrintLayouts';

interface QuoteWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
  onQuoteCreated?: (quoteId: ID) => void;
}

export function QuoteWizardModal({ isOpen, onClose, state, updateState, onQuoteCreated }: QuoteWizardModalProps) {
  const draftState = state.draftQuote;
  const orgConfig = (state.settings as any)?.orgConfig || {};
  const configuredTaxRaw = orgConfig.taxRatePercent;
  const configuredTaxRate = configuredTaxRaw !== undefined && configuredTaxRaw !== null && String(configuredTaxRaw).trim() !== '' && Number.isFinite(Number(configuredTaxRaw)) && Number(configuredTaxRaw) >= 0 && Number(configuredTaxRaw) <= 100
    ? Number(configuredTaxRaw) : null;
  const configuredValidityDays = Number(orgConfig.quoteValidityDays);
  const defaultValidityDays = Number.isFinite(configuredValidityDays) && configuredValidityDays > 0 ? String(configuredValidityDays) : '';
  const { canOn } = useCan(state, updateState);
  const visibleAccounts = (state.accounts || []).filter(account => canOn('accounts', 'VIEW', {
    ownerId: account.ownerId, branchId: account.branchId, territoryId: account.territoryId, teamId: account.teamId, tenantId: account.tenantId
  }));
  const draftCustomerId = draftState?.selectedCustomerId || state.activeContextAccountId || '';
  const defaultCustomerId = visibleAccounts.some(account => account.id === draftCustomerId) ? draftCustomerId : (visibleAccounts[0]?.id || '');

  const [step, setStep] = useState<1 | 2 | 3 | 4>((draftState?.step as any) || 1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<ID>(defaultCustomerId);
  const [projectTitle, setProjectTitle] = useState(draftState?.projectTitle || '');
  const [validUntilDays, setValidUntilDays] = useState(draftState?.validUntilDays ?? defaultValidityDays);

  const [lines, setLines] = useState<DraftQuoteState['lines']>(draftState?.lines || []);
  const [currentProductId, setCurrentProductId] = useState<ID>(state.externalProducts[0]?.id || '');
  const [currentQty, setCurrentQty] = useState('1');
  const [currentPrice, setCurrentPrice] = useState(() => String(state.externalProducts[0]?.basePrice || 0));

  const [discountPercent, setDiscountPercent] = useState(draftState?.discountPercent || '0');
  const [applyTax, setApplyTax] = useState(configuredTaxRate === null ? false : (draftState?.applyTax ?? true));
  const [paymentTerms, setPaymentTerms] = useState(draftState?.paymentTerms ?? (typeof orgConfig.defaultQuotePaymentTerms === 'string' ? orgConfig.defaultQuotePaymentTerms : ''));
  const [deliveryTerms, setDeliveryTerms] = useState(draftState?.deliveryTerms ?? (typeof orgConfig.defaultQuoteDeliveryTerms === 'string' ? orgConfig.defaultQuoteDeliveryTerms : ''));
  const [quoteNotes, setQuoteNotes] = useState(draftState?.quoteNotes || '');

  const [createdQuote, setCreatedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (isOpen && step < 4) {
      const timeout = setTimeout(() => {
        updateState(draft => {
          draft.draftQuote = {
            step, selectedCustomerId, projectTitle, validUntilDays, lines,
            discountPercent, applyTax, paymentTerms, deliveryTerms, quoteNotes
          };
        });
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [step, selectedCustomerId, projectTitle, validUntilDays, lines, discountPercent, applyTax, paymentTerms, deliveryTerms, quoteNotes, isOpen, updateState]);

  if (!isOpen) return null;

  const currentProduct = state.externalProducts.find(p => p.id === currentProductId) || state.externalProducts[0];
  const selectedCustomer = visibleAccounts.find(a => a.id === selectedCustomerId);

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const knownCostLines = lines.filter(line => Number.isFinite(line.costPrice) && line.costPrice > 0);
  const costsComplete = lines.length > 0 && knownCostLines.length === lines.length;
  const totalCost = knownCostLines.reduce((sum, l) => sum + (l.costPrice * l.quantity), 0);
  const discountNumber = Number(discountPercent);
  const discountValid = Number.isFinite(discountNumber) && discountNumber >= 0 && discountNumber <= 100;
  const discountVal = (subtotal * (discountValid ? discountNumber : 0)) / 100;
  const taxableAmount = Math.max(0, subtotal - discountVal);
  const taxVal = applyTax && configuredTaxRate !== null ? taxableAmount * configuredTaxRate / 100 : 0;
  const grandTotal = taxableAmount + taxVal;
  const grossProfit = costsComplete ? taxableAmount - totalCost : null;
  const marginPercent = grossProfit !== null && taxableAmount > 0 ? Math.round((grossProfit / taxableAmount) * 1000) / 10 : 0;

  const handleAddLineItem = () => {
    if (!currentProduct) return;
    const qty = Math.max(1, parsePersianNumber(currentQty) || 1);
    const price = parsePersianNumber(currentPrice) || currentProduct.basePrice || 0;
    
    setLines(prev => [
      ...prev,
      {
        productId: currentProduct.id,
        productName: currentProduct.name,
        productCode: currentProduct.sku || currentProduct.code || '',
        quantity: qty,
        unitPrice: price,
        costPrice: currentProduct.costPrice,
        lineTotal: qty * price
      }
    ]);
    setCurrentQty('1');
  };

  const handleRemoveLine = (idx: number) => {
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFinishAndCreate = () => {
    if (!guard(state, updateState, 'quotes', 'CREATE', 'صدور پیش‌فاکتور')) return;
    if (!selectedCustomerId || !visibleAccounts.some(account => account.id === selectedCustomerId) || lines.length === 0) return;
    if (!discountValid) {
      updateState(draft => { if (!draft.notifications) draft.notifications = []; draft.notifications.push({ id: generateId(), title: 'درصد تخفیف نامعتبر است', message: 'درصد تخفیف باید عددی بین صفر تا صد باشد.', type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'quotes' }); });
      return;
    }
    if (applyTax && configuredTaxRate === null) {
      updateState(draft => { if (!draft.notifications) draft.notifications = []; draft.notifications.push({ id: generateId(), title: 'نرخ مالیات تعریف نشده است', message: 'برای اعمال مالیات، نرخ معتبر را در تنظیمات سازمان تعریف کنید؛ نرخ فرضی اعمال نشد.', type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'settings' }); });
      return;
    }
    if (validUntilDays.trim() !== '' && (!Number.isInteger(Number(validUntilDays)) || Number(validUntilDays) <= 0)) {
      updateState(draft => { if (!draft.notifications) draft.notifications = []; draft.notifications.push({ id: generateId(), title: 'مدت اعتبار نامعتبر است', message: 'مدت اعتبار باید خالی یا عددی بزرگ‌تر از صفر باشد.', type: 'WARNING', read: false, createdAt: new Date().toISOString(), linkTab: 'quotes' }); });
      return;
    }
    if (!state.currentUserId) return;
    const newId = generateId();
    const newQuoteNum = nextSequenceNumber('QT-', (state.quotes || []).map(x => x.quoteNumber), 1001);
    const creator = state.users.find(user => user.id === state.currentUserId);

    const finalQuote: Quote = {
      id: newId,
      quoteNumber: newQuoteNum,
      accountId: selectedCustomerId,
      customerId: selectedCustomerId,
      ownerId: state.currentUserId,
      branchId: creator?.branchId,
      territoryId: creator?.territoryId,
      teamId: creator?.teamId,
      tenantId: creator?.tenantId,
      status: !costsComplete || marginPercent < (state.settings?.quoteApprovalMarginThreshold || 15) ? 'PENDING_APPROVAL' : 'APPROVED',
      lines: lines.map(l => ({
        id: generateId(),
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        costPrice: l.costPrice,
        lineTotal: l.lineTotal
      })),
      totalAmount: grandTotal,
      marginPercent,
      marginCompleteness: costsComplete ? 'KNOWN' : knownCostLines.length ? 'PARTIAL' : 'UNKNOWN',
      validUntil: validUntilDays.trim() ? new Date(Date.now() + Number(validUntilDays) * 86400000).toISOString().slice(0, 10) : undefined,
      notes: [projectTitle.trim() ? `عنوان: ${projectTitle.trim()}` : '', paymentTerms.trim() ? `شرایط پرداخت: ${paymentTerms.trim()}` : '', deliveryTerms.trim() ? `تحویل: ${deliveryTerms.trim()}` : '', quoteNotes.trim() ? `توضیحات: ${quoteNotes.trim()}` : ''].filter(Boolean).join(' | '),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateState(draft => {
      if (!draft.quotes) draft.quotes = [];
      draft.quotes.unshift(finalQuote);
      draft.activeContextAccountId = selectedCustomerId;
      draft.draftQuote = null;
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(),
        action: 'QUOTE_CREATED',
        entityType: 'QUOTE',
        entityId: newId,
        details: `پیش‌فاکتور رسمی ${newQuoteNum} صادر شد`,
        actor: state.users?.find(u => u.id === state.currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });

    setCreatedQuote(finalQuote);
    setStep(4);
    if (onQuoteCreated) onQuoteCreated(newId);
  };

  const handleClearDraft = () => {
    if (!guard(state, updateState, 'quotes', 'CREATE', 'پاک‌کردن پیش‌نویس')) return;
    if(confirm('آیا از پاک کردن اطلاعات پیش‌نویس اطمینان دارید؟')) {
      updateState(draft => { draft.draftQuote = null; });
      setStep(1);
      setLines([]);
      setProjectTitle('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ویزارد صدور پیش‌فاکتور رسمی (پیکربندی و قیمت‌گذاری)"
      subtitle={`مرحله ${step} از ۴`}
      size="xl"
      footer={
        step < 4 ? (
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleClearDraft} className="text-danger hover:bg-danger-soft">
                <Trash2 size={16} className="ml-1" /> پاک کردن پیش‌نویس
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={step === 1} onClick={() => setStep(s => (s - 1) as any)}>
                <ChevronRight size={16} className="ml-1" /> مرحله قبل
              </Button>
              {step < 3 ? (
                <Button variant="primary" size="sm" onClick={() => setStep(s => (s + 1) as any)}>
                  مرحله بعد <ChevronLeft size={16} className="mr-1" />
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleFinishAndCreate} className="bg-primary hover:bg-primary-hover">
                  <FileText size={16} className="ml-1" /> صدور نهایی
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={onClose}>اتمام و بازگشت</Button>
        )
      }
    >
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          {[
            { num: 1, label: 'مشتری و پروژه' },
            { num: 2, label: 'اقلام و متراژ' },
            { num: 3, label: 'شرایط و مارجین' },
            { num: 4, label: 'صدور و چاپ' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s.num ? 'bg-primary text-white shadow-sm' : step > s.num ? 'bg-primary/10 text-primary' : 'bg-canvas text-text-secondary'}`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${step === s.num ? 'text-text-main' : 'text-text-secondary'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-main mb-1.5">انتخاب طرف حساب / مشتری سازمانی *</label>
              <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full bg-canvas border border-border rounded-xl p-3 text-sm font-bold text-text-main focus:bg-white focus:border-primary outline-none transition-colors">
                {visibleAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.code || acc.phone})</option>)}
              </select>
            </div>
            {selectedCustomer && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-main">اطلاعات حساب:</span>
                  <span className="text-primary font-bold">{selectedCustomer.name}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>سقف اعتبار مالی:</span>
                  <span className="font-mono font-bold text-text-main">{(selectedCustomer.creditLimit || 0).toLocaleString()} ریال</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>آدرس و نشانی تحویل:</span>
                  <span className="truncate max-w-[280px]">{selectedCustomer.address || 'ثبت نشده'}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">عنوان پروژه / فرصت تجاری</label>
                <input type="text" placeholder="مثال: فاز دوم پروژه اداری تجاری وزرا" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="w-full bg-canvas border border-border rounded-xl p-2.5 text-xs text-text-main focus:bg-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">اعتبار پیش‌فاکتور (روز، اختیاری)</label>
                <input type="number" min="1" value={validUntilDays} onChange={(e) => setValidUntilDays(e.target.value)} className="w-full bg-canvas border border-border rounded-xl p-2.5 text-xs text-text-main focus:bg-white focus:border-primary outline-none" placeholder="بدون انقضا" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-canvas p-4 rounded-2xl border border-border space-y-3">
              <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                <Package size={15} className="text-primary" /> افزودن کالا
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">کالا / محصول</label>
                  <select value={currentProductId} onChange={(e) => { setCurrentProductId(e.target.value); const prod = state.externalProducts.find(p => p.id === e.target.value); if (prod) setCurrentPrice(String(prod.basePrice || prod.unitPrice || 0)); }} className="w-full bg-white border border-border rounded-xl p-2 text-xs font-bold outline-none">
                    {state.externalProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">تعداد</label>
                  <input type="number" min="1" value={currentQty} onChange={(e) => setCurrentQty(e.target.value)} className="w-full bg-white border border-border rounded-xl p-2 text-xs text-center font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">قیمت واحد</label>
                  <input type="text" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} className="w-full bg-white border border-border rounded-xl p-2 text-xs text-center font-bold outline-none" />
                </div>
              </div>
              <Button size="sm" variant="primary" onClick={handleAddLineItem} className="w-full flex items-center justify-center gap-1 mt-2">
                <Plus size={14} /> درج در پیش‌فاکتور
              </Button>
            </div>

            <div className="overflow-x-auto border border-border rounded-2xl">
              <table className="w-full text-xs text-right">
                <thead className="bg-canvas text-text-secondary font-bold border-b border-border">
                  <tr>
                    <th className="p-3">شرح کالا</th>
                    <th className="p-3 text-center">تعداد</th>
                    <th className="p-3 text-center">فی واحد</th>
                    <th className="p-3 text-center">مبلغ کل</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((l, i) => (
                    <tr key={i} className="hover:bg-canvas/50">
                      <td className="p-3 font-bold text-text-main">{l.productName}</td>
                      <td className="p-3 text-center font-bold text-text-main">{l.quantity}</td>
                      <td className="p-3 text-center font-mono">{l.unitPrice.toLocaleString()}</td>
                      <td className="p-3 text-center font-mono font-bold text-primary">{l.lineTotal.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleRemoveLine(i)} className="text-status-risk hover:text-danger p-1 rounded-md transition-colors cursor-pointer"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">تخفیف کلی (درصد)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="w-full bg-canvas border border-border rounded-xl p-2.5 pl-8 text-xs font-bold text-text-main outline-none" />
                  <Percent size={14} className="absolute left-3 top-3 text-text-secondary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">مالیات بر ارزش افزوده</label>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="applyTax" checked={applyTax} disabled={configuredTaxRate === null} onChange={(e) => setApplyTax(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary disabled:opacity-40" />
                  <label htmlFor="applyTax" className="text-xs font-bold text-text-main cursor-pointer">{configuredTaxRate === null ? 'نرخ سازمانی تعریف نشده' : `اعمال مالیات با نرخ ${configuredTaxRate}٪`}</label>
                </div>
                {configuredTaxRate === null && <p className="mt-1 text-[10px] text-warning">نرخ فرضی اعمال نمی‌شود؛ در صورت نیاز نرخ را در تنظیمات سازمان تعریف کنید.</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">شرایط تسویه</label>
                <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full bg-canvas border border-border rounded-xl p-2.5 text-xs text-text-main outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">شرایط تحویل</label>
                <input type="text" value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} className="w-full bg-canvas border border-border rounded-xl p-2.5 text-xs text-text-main outline-none" />
              </div>
            </div>
            <div className="bg-text-main text-white rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                <ShieldCheck size={16} /> تحلیل مالی و حاشیه سود
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white/10 p-2.5 rounded-xl">
                  <div className="text-[10px] text-white/60 mb-0.5">مبلغ خام</div>
                  <div className="text-xs font-bold font-mono">{subtotal.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl">
                  <div className="text-[10px] text-white/60 mb-0.5">تخفیف</div>
                  <div className="text-xs font-bold font-mono text-status-risk">{discountVal.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl">
                  <div className="text-[10px] text-white/60 mb-0.5">ارزش افزوده</div>
                  <div className="text-xs font-bold font-mono text-status-warning">{taxVal.toLocaleString()}</div>
                </div>
                <div className="bg-primary/20 border border-primary/50 p-2.5 rounded-xl">
                  <div className="text-[10px] text-accent mb-0.5">مبلغ نهایی</div>
                  <div className="text-sm font-extrabold font-mono text-white">{grandTotal.toLocaleString()} ریال</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && createdQuote && (
          <div className="space-y-4">
            <div className="bg-success-soft border border-success-line rounded-2xl p-4 text-center space-y-2">
              <div className="w-12 h-12 bg-success text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-bold text-success">پیش‌فاکتور رسمی با موفقیت صادر شد!</h3>
              <p className="text-xs text-text-secondary">شماره پیگیری: <span className="font-mono font-bold text-text-main">{createdQuote.quoteNumber}</span></p>
            </div>
            <div className="border border-border rounded-2xl p-4 bg-canvas max-h-[340px] overflow-y-auto">
              <CustomerInvoicePrint quote={createdQuote} state={state} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
