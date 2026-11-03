import { DynamicFormRenderer } from './shared/DynamicFormRenderer';
import { LEAD_FORM_SCHEMA } from '../services/dynamicFormEngine';
import { useDeepLinkCreate } from '../hooks/useDeepLinkCreate';
import { requireActiveUser, useCan } from '../hooks/useCan';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, Lead, LeadStage, ID, Account } from '../types';
import { generateId, matchesSearch } from '../lib/utils';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { FilterChip } from './ui/Tabs';
import { EmptyState } from './ui/EmptyState';
import { UserCheck, Plus, Search, Phone, CheckCircle2, Clock } from 'lucide-react';
import { LEAD_STAGES, PIPELINE_FILTER_ALL } from '../config/pipeline';
import { activeRecords } from '../lib/recordLifecycle';

interface LeadsWorkspaceProps {
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
  setActiveTab?: (tab: any) => void;
}

export function LeadsWorkspace({ state, updateState }: LeadsWorkspaceProps) {
  const { can, canOn, denied } = useCan(state, updateState);
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  useDeepLinkCreate(() => setIsNewLeadOpen(true));

  const stages: { id: string; label: string; color: string }[] = [
    PIPELINE_FILTER_ALL.leads,
    ...LEAD_STAGES,
  ];

  const filteredLeads = useMemo(() => {
    let list = activeRecords(state.leads).filter((lead: any) => canOn('leads', 'VIEW', { ownerId: lead.ownerId, branchId: lead.branchId, territoryId: lead.territoryId, teamId: lead.teamId, tenantId: lead.tenantId }));
    if (activeStage !== 'ALL') {
      list = list.filter((l: any) => l.stage === activeStage);
    }
    if (searchQuery.trim()) {
      list = list.filter((l: any) => 
        matchesSearch(l.companyName, searchQuery) || 
        matchesSearch(l.contactName, searchQuery) || 
        matchesSearch(l.phone, searchQuery)
      );
    }
    return list;
  }, [state.leads, activeStage, searchQuery, canOn]);

  const handleCreateLead = (values: Record<string, any>) => {
    if (!can('leads', 'CREATE')) return denied('ثبت سرنخ');
    if (!requireActiveUser(state, updateState, 'ثبت سرنخ')) return;
    const creator = state.users.find(user => user.id === state.currentUserId);
    const newLead: Lead = {
      id: generateId(),
      companyName: String(values.companyName).trim(),
      contactName: String(values.contactName).trim(),
      phone: String(values.phone || '').trim(),
      stage: 'NEW',
      ownerId: state.currentUserId!,
      branchId: creator?.branchId, territoryId: creator?.territoryId, teamId: creator?.teamId, tenantId: creator?.tenantId,
      notes: String(values.notes || '').trim(),
      createdAt: new Date().toISOString()
    };
    updateState(draft => {
      if (!draft.leads) draft.leads = [];
      draft.leads.unshift(newLead);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({
        id: generateId(),
        action: 'LEAD_CREATED',
        entityType: 'LEAD',
        entityId: newLead.id,
        details: `سرنخ جدید برای شرکت ${newLead.companyName} ثبت شد`,
        actor: state.users.find(u => u.id === state.currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });
    setIsNewLeadOpen(false);
  };

  const handleUpdateStage = (leadId: ID, nextStage: LeadStage) => {
    if (!can('leads', 'EDIT')) return denied('تغییر مرحله سرنخ');
    updateState(draft => {
      const lead = (draft.leads || []).find((l: any) => l.id === leadId);
      if (lead) {
        lead.stage = nextStage;
      }
    });
  };

  const handleConvertLeadToAccount = (lead: Lead) => {
    if (!can('leads', 'EDIT') || !can('accounts', 'CREATE')) return denied('تبدیل سرنخ به مشتری');
    if (!requireActiveUser(state, updateState, 'تبدیل سرنخ به مشتری')) return;

    // Idempotency: a retry/re-render must reuse the account already linked to this lead.
    const linkedAccount = (state.accounts || []).find(account =>
      !account.deletedAt && !account.deletedAtUtc && account.isDeleted !== true &&
      (account.id === lead.convertedAccountId || account.sourceLeadId === lead.id)
    );
    if (linkedAccount) {
      updateState(draft => {
        const currentLead = (draft.leads || []).find((item: any) => item.id === lead.id);
        if (currentLead) {
          currentLead.stage = 'CONVERTED';
          currentLead.convertedAccountId = linkedAccount.id;
          currentLead.convertedAt ||= new Date().toISOString();
        }
        draft.activeContextAccountId = linkedAccount.id;
        draft.activeContextCustomerId = linkedAccount.id;
      });
      navigate(`/accounts/${linkedAccount.id}`);
      return;
    }

    const newAccountId = generateId();
    const now = new Date().toISOString();
    let resolvedAccountId = newAccountId;
    updateState(draft => {
      const currentLead = (draft.leads || []).find((item: any) => item.id === lead.id);
      // Recheck inside the state transaction to protect against a stale UI callback.
      const existing = (draft.accounts || []).find((account: any) =>
        !account.deletedAt && !account.deletedAtUtc && account.isDeleted !== true &&
        (account.id === currentLead?.convertedAccountId || account.sourceLeadId === lead.id)
      );
      if (existing) {
        resolvedAccountId = existing.id;
        if (currentLead) {
          currentLead.stage = 'CONVERTED';
          currentLead.convertedAccountId = existing.id;
          currentLead.convertedAt ||= now;
        }
      } else {
        const newAccount: Account = {
          id: newAccountId,
          name: lead.companyName,
          code: `ACC-${Date.now().toString().slice(-4)}`,
          status: 'ACTIVE',
          phone: lead.phone,
          active: true,
          sourceLeadId: lead.id,
          createdAt: now,
          contacts: [{ id: generateId(), accountId: newAccountId, name: lead.contactName, phone: lead.phone, isPrimary: true }]
        };
        if (!draft.accounts) draft.accounts = [];
        draft.accounts.unshift(newAccount);
        if (currentLead) {
          currentLead.stage = 'CONVERTED';
          currentLead.convertedAccountId = newAccountId;
          currentLead.convertedAt = now;
        }
        if (!draft.auditLogs) draft.auditLogs = [];
        draft.auditLogs.push({
          id: generateId(), action: 'LEAD_CONVERTED', entityType: 'LEAD', entityId: lead.id,
          details: `سرنخ ${lead.companyName} با موفقیت به حساب تجاری تبدیل شد`,
          actor: state.users.find(u => u.id === state.currentUserId)?.name || 'System', createdAt: now
        });
      }
      draft.activeContextAccountId = resolvedAccountId;
      draft.activeContextCustomerId = resolvedAccountId;
    });
    navigate(`/accounts/${resolvedAccountId}`);
  };

  return (
    <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-24 font-premium" dir="rtl">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" /> مدیریت سرنخ‌های فروش (Leads)
            </h2>
            <span className="text-xs text-text-secondary">پایش، صلاحیت‌سنجی و تبدیل سرنخ‌ها به حساب‌های رسمی</span>
          </div>
          <Button variant="primary" onClick={() => setIsNewLeadOpen(true)} icon={<Plus className="w-4 h-4" />}>
            ثبت سرنخ جدید
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
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

          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="جستجوی شرکت یا مخاطب..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-[38px] bg-white border border-border rounded-[12px] pl-4 pr-10 text-xs font-medium text-text-main placeholder:text-text-secondary outline-none focus:border-primary transition-all shadow-sm"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {filteredLeads.length > 0 ? (
          filteredLeads.map((lead: any) => {
            const stageDef = stages.find(s => s.id === lead.stage);
            return (
              <Card key={lead.id} padding="md" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow border-border bg-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-text-main">{lead.companyName}</strong>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${stageDef?.color}`}>
                      {stageDef?.label || lead.stage}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary flex flex-wrap gap-4 pt-1">
                    <span className="flex items-center gap-1 font-medium text-text-main">
                      مخاطب: {lead.contactName}
                    </span>
                    {lead.phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone size={12} className="text-text-secondary" /> {lead.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono text-[11px] text-text-secondary">
                      <Clock size={12} /> {new Date(lead.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  {lead.notes && (
                    <p className="text-xs text-text-secondary bg-canvas p-2 rounded-lg mt-2 border border-border">
                      یادداشت: {lead.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  {lead.stage === 'NEW' && (
                    <button 
                      onClick={() => handleUpdateStage(lead.id, 'CONTACTED')}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      ثبت تماس اولیه
                    </button>
                  )}

                  {lead.stage === 'CONTACTED' && (
                    <button 
                      onClick={() => handleUpdateStage(lead.id, 'QUALIFIED')}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-warning hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      تایید صلاحیت (Qualified)
                    </button>
                  )}

                  {lead.stage === 'QUALIFIED' && (
                    <Button 
                      size="sm" 
                      variant="primary" 
                      onClick={() => handleConvertLeadToAccount(lead)}
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      تبدیل به حساب رسمی (Account)
                    </Button>
                  )}

                  {lead.stage === 'CONVERTED' && (
                    <span className="text-xs font-bold text-success bg-success-soft px-3 py-1 rounded-lg border border-success-line flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> حساب ایجاد شد
                    </span>
                  )}

                  {lead.stage !== 'CONVERTED' && lead.stage !== 'LOST' && (
                    <button 
                      onClick={() => handleUpdateStage(lead.id, 'LOST')}
                      className="text-xs font-semibold px-2 py-1 text-text-secondary hover:text-danger rounded transition-colors cursor-pointer"
                      title="لغو / از دست رفته"
                    >
                      انصراف
                    </button>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <EmptyState 
            icon={<UserCheck className="w-8 h-8 text-text-secondary opacity-50" />} 
            title="هیچ سرنخی یافت نشد" 
            description="برای شروع روی دکمه ثبت سرنخ جدید کلیک کنید." 
            actionLabel="ثبت سرنخ جدید"
            onAction={() => setIsNewLeadOpen(true)}
          />
        )}
      </div>

      <Modal isOpen={isNewLeadOpen} onClose={() => setIsNewLeadOpen(false)} title="ثبت سرنخ بازرگانی جدید (موتور فرم‌های پویا)">
        <DynamicFormRenderer schema={LEAD_FORM_SCHEMA} onSubmit={handleCreateLead} onCancel={() => setIsNewLeadOpen(false)} submitLabel="ثبت سرنخ" />
      </Modal>
    </div>
  );
}
