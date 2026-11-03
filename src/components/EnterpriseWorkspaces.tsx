import React, { useState } from 'react';
import { AppState, Case, Campaign, KnowledgeArticle, ID } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { ShieldAlert, BookOpen, Megaphone, Plus, Building2, Eye, X } from 'lucide-react';
import { generateId, formatAppDate } from '../lib/utils';
import { enqueueJob } from '../lib/automation';
import { emitBusinessEvent } from '../lib/events';
import { EmptyState } from './ui/EmptyState';
import { useCan } from '../hooks/useCan';
import { DynamicFormRenderer } from './shared/DynamicFormRenderer';
import { createCaseFormSchema, createCampaignFormSchema, createKnowledgeArticleFormSchema } from '../services/dynamicFormEngine';
import { getPersianStatusLabel } from '../lib/labels';

interface WorkspaceProps {
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
  setActiveTab?: (tab: any) => void;
}

// ----------------------------------------------------------------------
// CASES WORKSPACE
// ----------------------------------------------------------------------
export function CasesWorkspace({ state, updateState }: WorkspaceProps) {
  const { rbac, can, denied } = useCan(state, updateState);
  const cases = state.cases || [];
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const caseFormSchema = createCaseFormSchema(state.accounts || []);
  const handleCreateCase = (values: Record<string, any>) => {
    if (!can('cases', 'CREATE')) return denied('ثبت تیکت پشتیبانی');
    if (!state.currentUserId) return;
    setFormError('');
    const caseSubject = String(values.subject || '').trim();
    const caseDesc = String(values.description || '').trim();
    const caseAccountId = String(values.accountId || '');
    const casePriority = (values.priority || 'NORMAL') as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    if (!caseSubject) return setFormError('موضوع پرونده الزامی است.');
    if (!caseAccountId) return setFormError('حساب مشتری مربوطه را انتخاب کنید.');

    const newCase: Case = {
      id: generateId(),
      caseNumber: `CS-${Date.now().toString().slice(-4)}`,
      accountId: caseAccountId,
      subject: caseSubject.trim(),
      description: caseDesc.trim(),
      status: 'NEW',
      priority: casePriority,
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
        details: `پرونده خدمات ${newCase.caseNumber} با موضوع "${newCase.subject}" ایجاد شد`,
        actor: state.users?.find(u => u.id === state.currentUserId)?.name || 'System',
        createdAt: new Date().toISOString()
      });
    });

    setIsNewCaseOpen(false);
  };

  return (
    <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-24 font-premium" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" /> میز خدمات و پشتیبانی مشتریان
          </h2>
          <span className="text-xs text-ink-soft">مدیریت تیکت‌ها، شکایات و درخواست‌های پشتیبانی</span>
        </div>
        <Button variant="primary" onClick={() => setIsNewCaseOpen(true)} icon={<Plus className="w-4 h-4"/>}>
          مورد جدید
        </Button>
      </div>
      
      <div className="space-y-3">
        {cases.length > 0 ? cases.map((c: any) => {
          const acc = state.accounts.find(a => a.id === c.accountId);
          return (
            <Card key={c.id} padding="md" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:shadow-xs transition bg-surface border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-ink">{c.subject}</strong>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${c.priority === 'URGENT' || c.priority === 'HIGH' ? 'bg-red-50 text-danger border border-red-200' : 'bg-canvas text-ink-soft border border-border/60'}`}>
                    {getPersianStatusLabel(c.priority)}
                  </span>
                </div>
                <div className="text-xs text-ink-soft flex items-center gap-3">
                  <span className="font-mono">{c.caseNumber}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-ink">
                    <Building2 size={12} className="text-ink-soft" /> {acc?.name || 'حساب نامشخص'}
                  </span>
                </div>
                {c.description && <p className="text-xs text-ink-soft mt-1 leading-relaxed">{c.description}</p>}
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-warning rounded-lg shrink-0 border border-amber-200">
                {getPersianStatusLabel(c.status)}
              </span>
            </Card>
          );
        }) : (
          <EmptyState 
            icon={<ShieldAlert className="w-8 h-8 text-ink-soft opacity-50" />} 
            title="موردی یافت نشد" 
            description="هیچ پرونده پشتیبانی در سیستم ثبت نشده است." 
            actionLabel="مورد جدید"
            onAction={() => setIsNewCaseOpen(true)}
          />
        )}
      </div>

      <Modal isOpen={isNewCaseOpen} onClose={() => setIsNewCaseOpen(false)} title="ثبت مورد خدمات / شکایت جدید">
        {formError && <div role="alert" className="mb-3 p-2 bg-red-50 text-danger rounded-lg font-bold">{formError}</div>}
        <DynamicFormRenderer
          schema={caseFormSchema}
          initialValues={{ accountId: state.activeContextAccountId || state.accounts[0]?.id || '', priority: 'NORMAL' }}
          onSubmit={handleCreateCase}
          onCancel={() => setIsNewCaseOpen(false)}
          submitLabel="ثبت پرونده"
        />
      </Modal>
    </div>
  );
}

// ----------------------------------------------------------------------
// CAMPAIGNS WORKSPACE
// ----------------------------------------------------------------------
export function CampaignsWorkspace({ state, updateState }: WorkspaceProps) {
  const { rbac, can, denied } = useCan(state, updateState);
  const campaigns = state.campaigns || [];
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const campaignFormSchema = createCampaignFormSchema();

  const handleCreateCampaign = (values: Record<string, any>) => {
    if (!rbac.canAccessWorkspace('marketing' as any)) return denied('ایجاد کمپین');
    if (!state.currentUserId) return;
    setFormError('');
    const name = String(values.name || '').trim();
    const description = String(values.description || '').trim();
    const targetAudience = String(values.targetAudience || '').trim();
    const startDate = String(values.startDate || '');
    const endDate = String(values.endDate || '');
    if (!name) return setFormError('نام کمپین الزامی است.');
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) return setFormError('تاریخ پایان کمپین باید بعد از تاریخ شروع باشد.');

    const newCamp: Campaign = {
      id: generateId(),
      name: name.trim(),
      description: description.trim(),
      targetAudience: targetAudience.trim() || 'عموم مشتریان',
      mode: 'DYNAMIC',
      startDate,
      endDate,
      status: 'ACTIVE',
      ownerId: state.currentUserId,
      executionCount: 0,
      createdAt: new Date().toISOString()
    };

    updateState(draft => {
      if (!draft.campaigns) draft.campaigns = [];
      draft.campaigns.unshift(newCamp);
    });

    emitBusinessEvent('CAMPAIGN_CREATED', 'CAMPAIGN', newCamp.id, newCamp, state, updateState);
    setIsNewCampaignOpen(false);
  };

  const handleBroadcastCampaign = (campId: string) => {
    if (!rbac.canAccessWorkspace('marketing' as any)) return denied('انتشار کمپین');
    updateState(draft => {
      const c = (draft.campaigns || []).find((item: any) => item.id === campId);
      if (c) {
        if (!draft.notifications) draft.notifications = [];
        draft.notifications.push({
          id: generateId(),
          title: `درخواست بررسی کمپین «${c.name}» ثبت شد`,
          message: `درخواست بررسی در صف داخلی ثبت شد؛ ارسال واقعی پیام تا اتصال و تأیید درگاه پیام‌رسان انجام نمی‌شود.`,
          type: 'INFO',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    });
    enqueueJob('EVALUATE_DYNAMIC_CAMPAIGN', { campaignId: campId }, state, updateState);
  };

  return (
    <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-24 font-premium" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" /> بازاریابی و کمپین‌ها
          </h2>
          <span className="text-xs text-ink-soft">مدیریت پروموشن‌ها و برنامه‌های بازاریابی</span>
        </div>
        <Button variant="primary" onClick={() => setIsNewCampaignOpen(true)} icon={<Plus className="w-4 h-4"/>}>
          کمپین جدید
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.length > 0 ? campaigns.map((c: any) => (
          <Card key={c.id} padding="md" className="flex flex-col justify-between bg-surface border-border hover:border-primary/40 transition">
            <div>
              <div className="flex justify-between items-start mb-2">
                <strong className="text-sm font-bold text-ink">{c.name}</strong>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-lg border border-primary/20">{getPersianStatusLabel(c.status)}</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">{c.description || 'بدون توضیحات'}</p>
              <div className="mt-3 pt-2 border-t border-border text-xs text-ink-soft flex justify-between items-center">
                <span>مخاطبین هدف: <strong className="text-ink">{c.targetAudience}</strong></span>
                {c.startDate && <span className="font-mono text-[10px]">{c.startDate} تا {c.endDate || 'نامحدود'}</span>}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-ink-soft font-mono">تعداد اجرا: {c.executionCount || 0} نوبت</span>
              <Button size="sm" variant="outline" onClick={() => handleBroadcastCampaign(c.id)}>
                ثبت درخواست اجرا
              </Button>
            </div>
          </Card>
        )) : (
          <div className="col-span-full">
            <EmptyState 
              icon={<Megaphone className="w-8 h-8 text-ink-soft opacity-50" />} 
              title="کمپینی یافت نشد" 
              description="هیچ کمپین بازاریابی فعالی وجود ندارد." 
              actionLabel="کمپین جدید"
              onAction={() => setIsNewCampaignOpen(true)}
            />
          </div>
        )}
      </div>

      <Modal isOpen={isNewCampaignOpen} onClose={() => setIsNewCampaignOpen(false)} title="ایجاد کمپین بازاریابی">
        {formError && <div role="alert" className="mb-3 p-2 rounded-lg bg-red-50 text-danger font-bold">{formError}</div>}
        <DynamicFormRenderer
          schema={campaignFormSchema}
          initialValues={{ startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], targetAudience: 'عموم مشتریان' }}
          onSubmit={handleCreateCampaign}
          onCancel={() => setIsNewCampaignOpen(false)}
          submitLabel="ثبت کمپین"
        />
      </Modal>
    </div>
  );
}

// ----------------------------------------------------------------------
// KNOWLEDGE WORKSPACE
// ----------------------------------------------------------------------
export function KnowledgeWorkspace({ state, updateState }: WorkspaceProps) {
  const { rbac, can, denied } = useCan(state, updateState);
  const articles = state.articles || [];
  const [isNewArticleOpen, setIsNewArticleOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  
  const [formError, setFormError] = useState('');
  const articleFormSchema = createKnowledgeArticleFormSchema();

  const handleCreateArticle = (values: Record<string, any>) => {
    if (!rbac.canAccessWorkspace('knowledge' as any)) return denied('ثبت مقاله دانش');
    if (!state.currentUserId) return;
    setFormError('');
    const title = String(values.title || '').trim();
    const category = String(values.category || 'آموزش عمومی').trim();
    const content = String(values.content || '').trim();
    if (!title || !content) return setFormError('عنوان و متن مقاله الزامی است.');

    const newArt: KnowledgeArticle = {
      id: generateId(),
      title: title.trim(),
      category: category.trim(),
      content: content.trim(),
      status: 'PUBLISHED',
      authorId: state.currentUserId,
      createdAt: new Date().toISOString()
    };

    updateState(draft => {
      if (!draft.articles) draft.articles = [];
      draft.articles.unshift(newArt);
    });

    setIsNewArticleOpen(false);
  };

  return (
    <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-24 font-premium" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> پایگاه دانش و دستورالعمل‌ها
          </h2>
          <span className="text-xs text-ink-soft">مقالات آموزشی، بخشنامه‌ها و شیوه‌نامه‌ها</span>
        </div>
        <Button variant="primary" onClick={() => setIsNewArticleOpen(true)} icon={<Plus className="w-4 h-4"/>}>
          مقاله جدید
        </Button>
      </div>
      
      <div className="space-y-3">
        {articles.length > 0 ? articles.map((a: any) => (
          <Card key={a.id} padding="md" onClick={() => setSelectedArticle(a)} className="hover:shadow-xs cursor-pointer transition-all hover:border-primary/50 bg-surface border-border">
            <div className="flex justify-between items-start">
              <strong className="text-sm font-bold text-ink">{a.title}</strong>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-md border border-primary/20">
                {a.category}
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-1 line-clamp-2 leading-relaxed">{a.content}</p>
            <div className="mt-3 pt-2 border-t border-border text-[10px] text-ink-soft font-mono flex justify-between items-center">
              <span>تاریخ انتشار: {formatAppDate(a.createdAt, state.settings?.locale)}</span>
              <span className="text-primary font-bold flex items-center gap-1">مطالعه کامل <Eye size={12} /></span>
            </div>
          </Card>
        )) : (
          <EmptyState 
            icon={<BookOpen className="w-8 h-8 text-ink-soft opacity-50" />} 
            title="مقاله‌ای یافت نشد" 
            description="پایگاه دانش در حال حاضر خالی است." 
            actionLabel="مقاله جدید"
            onAction={() => setIsNewArticleOpen(true)}
          />
        )}
      </div>

      {selectedArticle && (
        <Modal isOpen={!!selectedArticle} onClose={() => setSelectedArticle(null)} title={selectedArticle.title} footer={<Button size="sm" variant="primary" onClick={() => setSelectedArticle(null)}>بستن</Button>}>
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center bg-canvas p-2.5 rounded-xl border border-border">
              <span className="text-ink-soft font-medium">دسته‌بندی: <strong className="text-ink">{selectedArticle.category}</strong></span>
              <span className="text-ink-soft font-mono text-[11px]">{formatAppDate(selectedArticle.createdAt, state.settings?.locale)}</span>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border text-xs text-ink leading-loose whitespace-pre-wrap">
              {selectedArticle.content}
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={isNewArticleOpen} onClose={() => setIsNewArticleOpen(false)} title="افزودن مقاله و شیوه‌نامه جدید">
        {formError && <div role="alert" className="mb-3 p-2 bg-red-50 text-danger rounded-lg font-bold">{formError}</div>}
        <DynamicFormRenderer
          schema={articleFormSchema}
          initialValues={{ category: 'مالی و اعتبارات' }}
          onSubmit={handleCreateArticle}
          onCancel={() => setIsNewArticleOpen(false)}
          submitLabel="انتشار مقاله"
        />
      </Modal>
    </div>
  );
}
