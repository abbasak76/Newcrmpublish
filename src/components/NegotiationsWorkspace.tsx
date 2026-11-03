import { PageToolbar } from './ui/PageToolbar';
import { requireActiveUser, useCan } from '../hooks/useCan';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, Opportunity, OpportunityStage, ID } from '../types';
import { TrendingUp, Plus, Calendar, Building2 } from 'lucide-react';
import { formatCurrency, generateId, formatAppDate } from '../lib/utils';
import { emitBusinessEvent } from '../lib/events';
import { Card } from './ui/Card';
import { FilterChip } from './ui/Tabs';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import { DynamicFormRenderer } from './shared/DynamicFormRenderer';
import { OPPORTUNITY_FORM_SCHEMA, DynamicFormSchema } from '../services/dynamicFormEngine';
import { useDeepLinkCreate } from '../hooks/useDeepLinkCreate';
import { Button } from './ui/Button';
import { OPPORTUNITY_STAGES, PIPELINE_FILTER_ALL } from '../config/pipeline';
import { activeRecords } from '../lib/recordLifecycle';

export function NegotiationsWorkspace({ state, updateState }: { state: AppState; updateState: (updater: (draft: AppState) => AppState | void) => void; setActiveTab?: (tab: any) => void; }) {
  const { can, canOn, denied } = useCan(state, updateState);
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState<string>('ALL');
  const [oppQuery, setOppQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  const opportunities = useMemo(() => activeRecords(state.opportunities).filter(o => canOn('opportunities', 'VIEW', {
    ownerId: o.ownerId, branchId: o.branchId, territoryId: o.territoryId, teamId: o.teamId, tenantId: o.tenantId
  })), [state.opportunities, canOn]);
  const visibleAccounts = useMemo(() => activeRecords(state.accounts).filter(account => canOn('accounts', 'VIEW', {
    ownerId: account.ownerId, branchId: account.branchId, territoryId: account.territoryId, teamId: account.teamId, tenantId: account.tenantId
  })), [state.accounts, canOn]);

  const stages: { id: string; label: string; color: string }[] = [
    PIPELINE_FILTER_ALL.opportunities,
    ...OPPORTUNITY_STAGES,
  ];

  const filtered = useMemo(() => {
    const q = oppQuery.trim().toLowerCase();
    return opportunities.filter(o => (activeStage === 'ALL' || o.stage === activeStage) &&
      (!q || String(o.title || '').toLowerCase().includes(q) || String(visibleAccounts.find(a => a.id === o.accountId)?.name || '').toLowerCase().includes(q)));
  }, [opportunities, activeStage, oppQuery, visibleAccounts]);

  const totalValue = filtered.reduce((sum, o) => sum + (o.amount || 0), 0);

  useDeepLinkCreate(() => setShowNewModal(true));

  // فرم ایجاد فرصت از موتور فرم پویا: اسکیمای مشترک + فیلد انتخاب حساب (بدون ساخت موتور دوم)
  const opportunitySchema: DynamicFormSchema = useMemo(() => ({
    ...OPPORTUNITY_FORM_SCHEMA,
    fields: [
      { id: 'accountId', name: 'accountId', label: 'حساب تجاری مربوطه', type: 'select', options: visibleAccounts.map(a => ({ value: a.id, label: a.name })), validation: { required: true }, colSpan: 2 } as any,
      ...OPPORTUNITY_FORM_SCHEMA.fields.map(f => (f.name === 'stage' ? { ...f, options: (f.options || []).filter(o => ['DISCOVERY', 'PROPOSAL', 'NEGOTIATION'].includes(String(o.value))) } : f)),
    ],
  }), [visibleAccounts]);

  const handleCreateOpportunity = (values: Record<string, any>) => {
    if (!can('opportunities', 'CREATE')) return denied('ثبت فرصت تجاری');
    if (!requireActiveUser(state, updateState, 'ثبت فرصت تجاری')) return;
    const accountId = String(values.accountId || '');
    if (!visibleAccounts.some(account => account.id === accountId)) return denied('انتخاب حساب خارج از محدوده مجاز');
    const creator = state.users.find(user => user.id === state.currentUserId);
    const newOpp: Opportunity = {
      id: generateId(),
      accountId,
      title: String(values.title).trim(),
      amount: Number(values.amount) || 0,
      stage: (values.stage || 'DISCOVERY') as OpportunityStage,
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
        details: `فرصت تجاری جدید "${newOpp.title}" با ارزش ${newOpp.amount.toLocaleString()} ریال ثبت شد`,
        actor: state.users.find(u => u.id === state.currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });

    emitBusinessEvent('OPPORTUNITY_CREATED', 'OPPORTUNITY', newOpp.id, newOpp, state, updateState);
    setShowNewModal(false);
  };

  const handleUpdateStage = (oppId: ID, stage: OpportunityStage) => {
    if (!can('opportunities', 'EDIT')) return denied('تغییر مرحله فرصت');
    updateState(draft => {
      const opp = (draft.opportunities || []).find((o: any) => o.id === oppId);
      if (opp) opp.stage = stage;
    });
  };


  return (
    <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-24 font-premium" dir="rtl">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> پایپ‌لاین فرصت‌های تجاری
            </h2>
            <span className="text-xs text-text-secondary">
              ارزش کل فیلتر جاری: <strong className="font-mono text-primary font-bold">{formatCurrency(totalValue)} ریال</strong>
            </span>
          </div>
          <Button variant="primary" disabled={!can('opportunities', 'CREATE')} title={can('opportunities', 'CREATE') ? undefined : 'مجوز ثبت فرصت را ندارید'} onClick={() => setShowNewModal(true)} icon={<Plus className="w-4 h-4" />}>
            فرصت جدید
          </Button>
        </div>
        
        <PageToolbar search={oppQuery} onSearchChange={setOppQuery} searchPlaceholder="جستجوی عنوان فرصت یا نام مشتری" resultCount={filtered.length}
          activeFilters={activeStage !== 'ALL' ? [{ key: 'stage', label: `مرحله: ${stages.find(s => s.id === activeStage)?.label || activeStage}`, onRemove: () => setActiveStage('ALL') }] : []}
          onClearAll={() => { setOppQuery(''); setActiveStage('ALL'); }} />
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {stages.map(s => (
            <FilterChip 
              key={s.id} 
              label={s.label} 
              active={activeStage === s.id} 
              onClick={() => setActiveStage(s.id)} 
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {filtered.length > 0 ? (
          filtered.map(opp => {
            const acc = visibleAccounts.find(a => a.id === opp.accountId);
            const stageDef = stages.find(s => s.id === opp.stage);
            return (
              <Card key={opp.id} padding="md" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow bg-white border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-text-main">{opp.title}</strong>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${stageDef?.color}`}>
                      {stageDef?.label || opp.stage}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary pt-1">
                    <button 
                      onClick={() => navigate(`/accounts/${opp.accountId}`)}
                      className="flex items-center gap-1 font-medium text-text-main hover:text-primary transition-colors cursor-pointer"
                    >
                      <Building2 size={12} className="text-text-secondary" /> {acc?.name || 'حساب نامشخص'}
                    </button>
                    {opp.expectedCloseDate && (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-text-secondary">
                        <Calendar size={12} /> تاریخ هدف: {formatAppDate(opp.expectedCloseDate, state.settings?.locale)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
                  <div className="text-left font-mono">
                    <span className="text-[10px] text-text-secondary block">ارزش برآوردی</span>
                    <strong className="text-sm font-bold text-primary">{formatCurrency(opp.amount)} ریال</strong>
                  </div>

                  <div className="flex gap-1">
                    {can('opportunities', 'EDIT') && opp.stage !== 'WON' && opp.stage !== 'LOST' && (
                      <>
                        <button 
                          onClick={() => handleUpdateStage(opp.id, 'WON')}
                          className="px-2 py-1 text-xs font-bold rounded-lg bg-success-soft text-success hover:bg-success-soft transition-colors cursor-pointer border border-success-line"
                          title="ثبت به عنوان برنده (Won)"
                        >
                          برنده (Won)
                        </button>
                        <button 
                          onClick={() => handleUpdateStage(opp.id, 'LOST')}
                          className="px-2 py-1 text-xs font-bold rounded-lg bg-red-50 text-danger hover:bg-red-100 transition-colors cursor-pointer border border-red-200"
                          title="ثبت به عنوان از دست رفته (Lost)"
                        >
                          باخت (Lost)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <EmptyState 
            icon={<TrendingUp className="w-8 h-8 text-text-secondary opacity-50" />} 
            title="فرصتی یافت نشد" 
            description="فرصت تجاری جدید برای پیشبرد مذاکرات تعریف کنید." 
            actionLabel="ثبت فرصت جدید"
            onAction={() => setShowNewModal(true)}
          />
        )}
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="ثبت فرصت تجاری جدید (موتور فرم‌های پویا)">
        <DynamicFormRenderer
          schema={opportunitySchema}
          initialValues={{
            accountId: state.activeContextAccountId || state.accounts?.[0]?.id || '',
            stage: 'DISCOVERY',
            expectedCloseDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
          }}
          onSubmit={handleCreateOpportunity}
          onCancel={() => setShowNewModal(false)}
          submitLabel="ثبت فرصت"
        />
      </Modal>
    </div>
  );
}
