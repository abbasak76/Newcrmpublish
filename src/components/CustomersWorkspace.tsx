import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppState, Account } from '../types';
import { AvatarGroup } from './ui/Avatar';
import { Plus, Building2, Phone, ChevronLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Customer360 } from './Customer360';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import { DataSourceStatus } from './ui/DataSourceStatus';
import { PageToolbar } from './ui/PageToolbar';
import { generateId, matchesSearch, nextSequenceNumber, cn } from '../lib/utils';
import { DynamicFormRenderer } from './shared/DynamicFormRenderer';
import { CUSTOMER_FORM_SCHEMA } from '../services/dynamicFormEngine';
import { activeRecords } from '../lib/recordLifecycle';
import { predictAccountChurn } from '../services/churnPredictionService';
import { useDeepLinkCreate } from '../hooks/useDeepLinkCreate';
import { getDefaultCreditLimit } from '../lib/orgPolicy';
import { useCan, requireActiveUser } from '../hooks/useCan';

interface CustomersWorkspaceProps {
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
}

export function CustomersWorkspace({ state, updateState }: CustomersWorkspaceProps) {
  const { can, canOn, denied } = useCan(state, updateState);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'WITH_PHONE' | 'WITH_CONTACTS'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NAME' | 'CODE'>('NAME');

  const [showCreateModal, setShowCreateModal] = useState(false);
  useDeepLinkCreate(() => setShowCreateModal(true));
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const pathParts = location.pathname.split('/');
  const urlCustomerId = pathParts.length > 2 ? pathParts[2] : null;

  const selectedCustomer = activeRecords(state.accounts).find(a => a.id === urlCustomerId);

  const filteredAccounts = useMemo(() => {
    let list = activeRecords(state.accounts).filter((account: any) => 
      canOn('accounts', 'VIEW', { ownerId: account.ownerId, branchId: account.branchId, territoryId: account.territoryId, teamId: account.teamId, tenantId: account.tenantId })
    );
    
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
    if (!requireActiveUser(state, updateState, 'ایجاد مشتری')) return;
    
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
        actor: state.users?.find(u => u.id === state.currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });

    setShowCreateModal(false);
    setSuccessNotice(`پرونده مشتری جدید "${newAccount.name}" با موفقیت ثبت گردید.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const activeFilters: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (filterType !== 'ALL') {
    activeFilters.push({
      key: 'type',
      label: filterType === 'WITH_PHONE' ? 'دارای شماره تماس' : 'دارای مخاطب',
      onRemove: () => setFilterType('ALL')
    });
  }

  return (
    <div className="w-full space-y-4 px-2 py-2 sm:px-4 pb-32 font-sans" dir="rtl">
      {successNotice && (
        <div className="p-3 bg-success-soft border border-success-border text-success text-sm rounded-2xl flex items-center gap-2 font-bold animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      <PageToolbar
        title="بانک مشتریان و حساب‌ها"
        subtitle="مدیریت پرونده‌های تجاری، اطلاعات تماس و وضعیت اعتباری"
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="جستجو در نام، کد یا شماره تماس..."
        resultCount={filteredAccounts.length}
        activeFilters={activeFilters}
        onClearAll={() => { setSearchQuery(''); setFilterType('ALL'); }}
        actions={
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={16}/> <span>حساب جدید</span>
          </button>
        }
        filters={
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as any)}
            className="h-10 bg-canvas border border-border rounded-xl px-3 text-xs font-bold text-text-main outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">همه حساب‌ها</option>
            <option value="WITH_PHONE">دارای شماره تماس</option>
            <option value="WITH_CONTACTS">دارای مخاطبین ثبت‌شده</option>
          </select>
        }
      />

      <DataSourceStatus 
        source="ERP" 
        sourceName="دفتر مرکزی مشتریان و طرف‌های تجاری ERP" 
        isAuthoritative={true}
      />

      <div className="bg-surface border border-border rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => setSortOrder(prev => prev === 'NAME' ? 'CODE' : 'NAME')}
            className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-primary transition-colors cursor-pointer bg-canvas px-3 py-1.5 rounded-lg border border-border"
          >
            <span>مرتب‌سازی: {sortOrder === 'NAME' ? 'نام شرکت' : 'کد حساب'}</span>
          </button>
        </div>

        {filteredAccounts.length > 0 ? (
          <>
            {/* نمای کارتی مخصوص موبایل */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {filteredAccounts.map((acc) => {
                const churn = predictAccountChurn(acc, state);
                const hasElevatedChurn = churn.riskTier === 'CRITICAL' || churn.riskTier === 'HIGH';

                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      updateState(draft => {
                        draft.activeContextAccountId = acc.id;
                        draft.activeContextCustomerId = acc.id;
                      });
                      navigate(`/accounts/${acc.id}`);
                    }}
                    className="p-4 rounded-2xl bg-canvas border border-border hover:border-primary/40 hover:shadow-card active:scale-[0.98] transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary-soft text-primary font-black text-lg flex items-center justify-center shrink-0 border border-primary/20">
                          {acc.name ? acc.name.charAt(0) : 'م'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-text-main line-clamp-1">{acc.name}</h3>
                          </div>
                          <span className="text-xs font-mono text-text-secondary mt-0.5 block">{acc.code || 'بدون کد'}</span>
                        </div>
                      </div>
                    </div>

                    {hasElevatedChurn && (
                      <div className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border",
                        churn.riskTier === 'CRITICAL' ? 'bg-danger-soft text-danger border-danger-border' : 'bg-warning-soft text-warning border-warning-border'
                      )}>
                        <ShieldAlert size={12} />
                        <span>ریسک ریزش: {churn.churnScore}٪</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60 text-xs text-text-secondary">
                      {acc.phone ? (
                        <span className="flex items-center gap-1.5 font-mono text-text-main font-medium" dir="ltr">
                          <Phone size={14} className="text-primary" /> {acc.phone}
                        </span>
                      ) : (
                        <span className="text-text-muted">بدون شماره تماس</span>
                      )}
                      <div>
                        <AvatarGroup users={(acc.contacts || []).map(c => ({ name: c.name }))} size="sm" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* جدول سازمانی دسکتاپ */}
            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="text-text-secondary border-b border-border text-xs font-bold bg-canvas">
                    <th className="p-4 rounded-tr-xl w-16 text-center">ردیف</th>
                    <th className="p-4">نام حساب / شرکت</th>
                    <th className="p-4 font-mono">کد / شناسه</th>
                    <th className="p-4">مخاطبین</th>
                    <th className="p-4 text-left rounded-tl-xl">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAccounts.map((acc, idx) => {
                    const churn = predictAccountChurn(acc, state);
                    const hasElevatedChurn = churn.riskTier === 'CRITICAL' || churn.riskTier === 'HIGH';

                    return (
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
                        <td className="p-4 text-center text-text-secondary font-mono text-xs">{idx + 1}</td>
                        <td className="p-4">
                          <div className="font-bold text-text-main group-hover:text-primary transition-colors flex items-center gap-2">
                            <Building2 size={16} className="text-text-secondary shrink-0" />
                            <span className="truncate">{acc.name}</span>
                            {hasElevatedChurn && (
                              <span className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-black font-mono border shrink-0",
                                churn.riskTier === 'CRITICAL' ? 'bg-danger-soft text-danger border-danger-border' : 'bg-warning-soft text-warning border-warning-border'
                              )}>
                                ریزش: {churn.churnScore}٪
                              </span>
                            )}
                          </div>
                          {acc.phone && <div className="text-xs text-text-secondary mt-1.5 flex items-center gap-1.5 font-mono"><Phone size={12}/> {acc.phone}</div>}
                        </td>
                        <td className="p-4 font-mono text-text-secondary text-xs">{acc.code || '-'}</td>
                        <td className="p-4">
                          <AvatarGroup users={(acc.contacts || []).map(c => ({ name: c.name }))} size="sm" />
                        </td>
                        <td className="p-4 text-left">
                          <span className="inline-flex items-center gap-1 text-xs font-bold bg-primary-soft text-primary px-3 py-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-primary/20 group-hover:border-primary">
                            پرونده ۳۶۰ <ChevronLeft size={14} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState 
            icon={<Building2 className="w-10 h-10 text-text-secondary opacity-50" />} 
            title="حسابی یافت نشد" 
            description="مشتری با این مشخصات در سیستم ثبت نشده است." 
            actionLabel="ایجاد حساب جدید"
            onAction={() => setShowCreateModal(true)}
          />
        )}
      </div>

      {showCreateModal && (
        <Modal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          title="افتتاح حساب تجاری مشتری جدید"
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
