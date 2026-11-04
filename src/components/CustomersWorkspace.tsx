import { useDeepLinkCreate } from '../hooks/useDeepLinkCreate';
import { getDefaultCreditLimit } from '../lib/orgPolicy';
import { useCan } from '../hooks/useCan';
import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppState, Account } from '../types';
import { AvatarGroup } from './ui/Avatar';
import { Plus, ChevronDown, Search, Filter, Building2, Phone, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Customer360 } from './Customer360';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { DataSourceStatus } from './ui/DataSourceStatus';
import { generateId, matchesSearch, nextSequenceNumber } from '../lib/utils';
import { DynamicFormRenderer } from './shared/DynamicFormRenderer';
import { CUSTOMER_FORM_SCHEMA } from '../services/dynamicFormEngine';
import { activeRecords } from '../lib/recordLifecycle';

interface CustomersWorkspaceProps {
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
}

export function CustomersWorkspace({ state, updateState }: CustomersWorkspaceProps) {
  const { can, canOn, denied } = useCan(state, updateState);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'WITH_PHONE' | 'WITH_CONTACTS'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NAME' | 'CODE'>('NAME');

  const [showCreateModal, setShowCreateModal] = useState(false);
  useDeepLinkCreate(() => setShowCreateModal(true));
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const pathParts = location.pathname.split('/');
  const urlCustomerId = pathParts.length > 2 ? pathParts[2] : null;

  const selectedCustomer = activeRecords(state.accounts).find(a => a.id === urlCustomerId);

  const filteredAccounts = useMemo(() => {
    let list = activeRecords(state.accounts).filter((account: any) => canOn('accounts', 'VIEW', { ownerId: account.ownerId, branchId: account.branchId, territoryId: account.territoryId, teamId: account.teamId, tenantId: account.tenantId }));
    if (filterType === 'WITH_PHONE') {
      list = list.filter(a => !!a.phone);
    } else if (filterType === 'WITH_CONTACTS') {
      list = list.filter(a => a.contacts && a.contacts.length > 0);
    }

    if (searchQuery.trim()) {
      list = list.filter(a => 
        matchesSearch(a.name, searchQuery) || 
        matchesSearch(a.code, searchQuery) ||
        matchesSearch(a.phone, searchQuery)
      );
    }

    return [...list].sort((a, b) => {
      if (sortOrder === 'CODE') return (a.code || '').localeCompare(b.code || '');
      return a.name.localeCompare(b.name);
    });
  }, [state.accounts, searchQuery, filterType, sortOrder, canOn]);

  if (selectedCustomer) {
    return (
      <Customer360 
        customer={selectedCustomer}
        state={state}
        updateState={updateState}
        onBack={() => {
          updateState(draft => {
            draft.activeContextAccountId = null;
            draft.activeContextCustomerId = null;
          });
          navigate('/accounts');
        }}
      />
    );
  }

  const handleDynamicFormSubmit = (formValues: Record<string, any>) => {
    if (!can('accounts', 'CREATE')) return denied('ایجاد مشتری');
    const newId = generateId();
    const autoCode = nextSequenceNumber('ACC-', (state.accounts || []).map(a => (a as any).code), 1001);
    const newAccount: Account = {
      id: newId,
      name: String(formValues.name).trim(),
      company: String(formValues.name).trim(),
      code: autoCode,
      phone: formValues.phone ? String(formValues.phone).trim() : undefined,
      address: formValues.address ? String(formValues.address).trim() : undefined,
      creditLimit: Number(formValues.creditLimit) || getDefaultCreditLimit(state),
      balance: 0,
      totalRevenue: 0,
      status: 'ACTIVE',
      ownerId: state.currentUserId || 'user-admin',
      createdAt: new Date().toISOString(),
      customerType: formValues.customerType,
      nationalCode: formValues.nationalCode,
      economicCode: formValues.economicCode,
      paymentTermsDays: Number(formValues.paymentTermsDays) || 30,
      sayadRequired: Boolean(formValues.sayadRequired),
      contacts: [
        {
          id: generateId(),
          name: String(formValues.name).trim(),
          title: formValues.customerType === 'LEGAL' ? 'نماینده رسمی' : 'مالک فروشگاه',
          phone: formValues.phone ? String(formValues.phone).trim() : undefined,
          isPrimary: true
        }
      ]
    };

    updateState(draft => {
      if (!draft.accounts) draft.accounts = [];
      draft.accounts.unshift(newAccount);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(),
        action: 'CREATE',
        entityType: 'ACCOUNT',
        entityId: newId,
        details: `حساب مشتری جدید "${newAccount.name}" از طریق موتور فرم‌های پویا ایجاد گردید.`,
        actor: state.currentUserId || 'کاربر سیستم',
        createdAt: new Date().toISOString()
      });
    });

    setShowCreateModal(false);
    setSuccessNotice(`پرونده مشتری جدید "${newAccount.name}" با اعتبارسنجی کامل موتور پویا ثبت گردید.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-32 font-premium" dir="rtl">
      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      <DataSourceStatus 
        source="ERP" 
        sourceName="دفتر مرکزی مشتریان و طرف‌های تجاری ERP" 
        isAuthoritative={true}
      />
      
      <div className="flex gap-3 relative">
        <div className="flex-1 se-card px-4 py-3 flex items-center gap-3">
          <Search size={16} className="text-text-secondary shrink-0" />
          <input 
            type="text" 
            placeholder="جستجو در حساب‌ها، کد یا شماره تماس..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-xs w-full text-text-main placeholder:text-text-secondary font-medium" 
          />
        </div>
        <button 
          onClick={() => setShowFilterMenu(prev => !prev)}
          className={`se-card rounded-2xl px-4 py-3 flex items-center gap-2 transition-all cursor-pointer shrink-0 text-xs font-bold ${showFilterMenu ? 'border-primary text-primary bg-primary/5' : 'text-text-main hover:bg-canvas'}`}
        >
          <Filter size={14} className={showFilterMenu ? 'text-primary' : 'text-text-secondary'} />
          <span>{filterType === 'ALL' ? 'فیلتر' : filterType === 'WITH_PHONE' ? 'دارای تماس' : 'دارای مخاطب'}</span>
        </button>

        {showFilterMenu && (
          <div className="absolute left-0 top-14 se-card p-2 z-30 min-w-[180px] space-y-1 shadow-modal">
            <button 
              onClick={() => { setFilterType('ALL'); setShowFilterMenu(false); }}
              className={`w-full text-right px-3 py-2 text-xs rounded-xl font-bold transition-colors cursor-pointer ${filterType === 'ALL' ? 'bg-primary/10 text-primary' : 'text-text-main hover:bg-canvas'}`}
            >
              همه حساب‌ها
            </button>
            <button 
              onClick={() => { setFilterType('WITH_PHONE'); setShowFilterMenu(false); }}
              className={`w-full text-right px-3 py-2 text-xs rounded-xl font-bold transition-colors cursor-pointer ${filterType === 'WITH_PHONE' ? 'bg-primary/10 text-primary' : 'text-text-main hover:bg-canvas'}`}
            >
              دارای شماره تماس
            </button>
            <button 
              onClick={() => { setFilterType('WITH_CONTACTS'); setShowFilterMenu(false); }}
              className={`w-full text-right px-3 py-2 text-xs rounded-xl font-bold transition-colors cursor-pointer ${filterType === 'WITH_CONTACTS' ? 'bg-primary/10 text-primary' : 'text-text-main hover:bg-canvas'}`}
            >
              دارای مخاطبین ثبت‌شده
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-b border-border/60 px-1 pb-3">
        <div className="flex gap-6">
          <button 
            onClick={() => { setSearchQuery(''); setFilterType('ALL'); }}
            className="pb-2 text-xs font-extrabold border-b-[3px] border-primary text-primary transition-colors relative cursor-pointer"
          >
            لیست حساب‌های تجاری ({filteredAccounts.length})
          </button>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="pb-1 text-primary hover:text-primary-dark transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black bg-primary/10 hover:bg-primary/20 px-3.5 py-1.5 rounded-xl shadow-xs"
        >
          <Plus size={15}/> حساب تجاری جدید
        </button>
      </div>

      <div className="space-y-4">
        <div className="se-card p-6 space-y-4">
          <button 
            onClick={() => setSortOrder(prev => prev === 'NAME' ? 'CODE' : 'NAME')}
            className="flex items-center gap-2 text-xs font-extrabold text-text-main hover:text-primary transition-colors cursor-pointer"
          >
            <ChevronDown size={16} className="text-text-secondary" />
            <span>مرتب‌سازی بر اساس: {sortOrder === 'NAME' ? 'نام شرکت' : 'کد حساب'} (کلیک جهت تغییر)</span>
          </button>

          {filteredAccounts.length > 0 ? (
            <>
              {/* نمای کارتی مخصوص موبایل */}
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {filteredAccounts.map((acc, idx) => (
                  <div
                    key={acc.id}
                    onClick={() => {
                      updateState(draft => {
                        draft.activeContextAccountId = acc.id;
                        draft.activeContextCustomerId = acc.id;
                      });
                      navigate(`/accounts/${acc.id}`);
                    }}
                    className="p-4 rounded-2xl bg-canvas border border-border/80 hover:border-primary/40 active:scale-[0.99] transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0">
                          {acc.name ? acc.name.charAt(0) : 'م'}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-text-main line-clamp-1">{acc.name}</h3>
                          <span className="text-[11px] font-mono text-text-secondary">{acc.code || 'بدون کد'}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-xl">
                        پرونده ۳۶۰ <ChevronLeft size={12} />
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs text-text-secondary">
                      {acc.phone ? (
                        <span className="flex items-center gap-1 font-mono text-text-main" dir="ltr">
                          <Phone size={12} className="text-primary" /> {acc.phone}
                        </span>
                      ) : (
                        <span className="text-text-muted">بدون شماره تماس</span>
                      )}
                      <div>
                        <AvatarGroup users={(acc.contacts || []).map(c => ({ name: c.name }))} size="xs" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* جدول کامل در تبلت و دسکتاپ */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="text-text-secondary border-b border-border/60 text-[11px] font-bold">
                      <th className="pb-3 w-12 text-center">ردیف</th>
                      <th className="pb-3">نام حساب / شرکت</th>
                      <th className="pb-3 hidden sm:table-cell">کد / شناسه</th>
                      <th className="pb-3">مخاطبین</th>
                      <th className="pb-3 text-left pl-3">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredAccounts.map((acc, idx) => (
                      <tr 
                        key={acc.id} 
                        className="hover:bg-canvas transition-colors cursor-pointer group"
                        onClick={() => {
                          updateState(draft => {
                            draft.activeContextAccountId = acc.id;
                            draft.activeContextCustomerId = acc.id;
                          });
                          navigate(`/accounts/${acc.id}`);
                        }}
                      >
                        <td className="py-4 text-center text-text-secondary font-mono">{idx + 1}</td>
                        <td className="py-4">
                          <div className="font-bold text-text-main group-hover:text-primary transition-colors flex items-center gap-2">
                            <Building2 size={14} className="text-text-secondary" /> {acc.name}
                          </div>
                          {acc.phone && <div className="text-[10px] text-text-secondary mt-1 flex items-center gap-1 font-mono"><Phone size={10}/> {acc.phone}</div>}
                        </td>
                        <td className="py-4 hidden sm:table-cell font-mono text-text-secondary">{acc.code || '-'}</td>
                        <td className="py-4">
                          <AvatarGroup users={(acc.contacts || []).map(c => ({ name: c.name }))} size="xs" />
                        </td>
                        <td className="py-4 text-left pl-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                            ورود ۳۶۰ <ChevronLeft size={12} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyState 
              icon={<Building2 className="w-8 h-8 text-text-secondary opacity-50" />} 
              title="حسابی یافت نشد" 
              description="مشتری با این مشخصات در سیستم ثبت نشده است." 
              actionLabel="ایجاد حساب جدید"
              onAction={() => setShowCreateModal(true)}
            />
          )}
        </div>
      </div>

      {showCreateModal && (
        <Modal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          title="افتتاح حساب تجاری مشتری جدید (موتور فرم‌های پویا)"
        >
          <DynamicFormRenderer
            schema={CUSTOMER_FORM_SCHEMA}
            initialValues={{
              customerType: 'LEGAL',
              creditLimit: 200000000,
              paymentTermsDays: '30',
              sayadRequired: true
            }}
            onSubmit={handleDynamicFormSubmit}
            onCancel={() => setShowCreateModal(false)}
            submitLabel="ثبت و افتتاح پرونده مشتری"
          />
        </Modal>
      )}
    </div>
  );
}
