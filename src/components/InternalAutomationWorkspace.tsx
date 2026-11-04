import { useDeepLinkCreate } from '../hooks/useDeepLinkCreate';
import { useCan } from '../hooks/useCan';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AppState, InternalRequest, RequestType, Priority, InternalMeeting, 
  WorkflowRule, ID, ActionItem 
} from '../types';
import { generateId, formatAppDate, parsePersianNumber, formatCurrency } from '../lib/utils';
import { 
  routeInternalRequest, evaluateRequestIntelligence, notifyMeetingParticipants, 
  addMeetingActionItem, reassignInternalRequest, updateInternalRequestStatus 
} from '../lib/internalAutomation';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { EmptyState } from './ui/EmptyState';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { 
  CalendarDays, FileText, CheckCircle2, Inbox, Activity, 
  AlertTriangle, AlertCircle, RefreshCcw, Plus, Sliders, 
  Clock, UserCheck, Shield, ChevronDown, Check, X, MessageSquare, 
  ListChecks, ArrowRight, UserPlus
} from 'lucide-react';
import { RBACService } from '../lib/rbac';
import { DynamicFormRenderer } from './shared/DynamicFormRenderer';
import { createInternalRequestFormSchema } from '../services/dynamicFormEngine';

interface InternalAutomationProps {
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
  setActiveTab?: (tab: any) => void;
}

const REQUEST_TYPE_LABELS: Record<RequestType, { title: string; category: 'PERSONNEL' | 'ORG' }> = {
  LEAVE: { title: 'مرخصی (استحقاقی/استعلاجی/ساعتی)', category: 'PERSONNEL' },
  MISSION: { title: 'مأموریت کاری', category: 'PERSONNEL' },
  OVERTIME: { title: 'اضافه کاری و تردد', category: 'PERSONNEL' },
  ADVANCE: { title: 'مساعده مالی', category: 'PERSONNEL' },
  ATTENDANCE: { title: 'اصلاح تردد / فراموشی کارت', category: 'PERSONNEL' },
  CERTIFICATE: { title: 'گواهی اشتغال / معرفی‌نامه', category: 'PERSONNEL' },
  PAYMENT: { title: 'درخواست پرداخت و تسویه', category: 'ORG' },
  EXPENSE: { title: 'تنخواه و فاکتور هزینه', category: 'ORG' },
  PURCHASE: { title: 'خرید کالا و ملزومات', category: 'ORG' },
  EQUIPMENT: { title: 'تجهیزات و ابزار کار', category: 'ORG' },
  IT_SUPPORT: { title: 'پشتیبانی فنی و سیستم‌ها', category: 'ORG' },
  GENERAL: { title: 'درخواست اداری و عمومی', category: 'ORG' }
};

export function InternalAutomationWorkspace({ state, updateState }: InternalAutomationProps) {
  const { can, canOn, denied } = useCan(state, updateState);
  const navigate = useNavigate();
  const [activeTab, setLocalTab] = useState<'INBOX' | 'MY_REQUESTS' | 'ORG_REQUESTS' | 'MEETINGS' | 'RULES'>('INBOX');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PERSONNEL' | 'ORG'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const rbac = new RBACService(state);
  const isAdmin = rbac.hasPermission('internal.manage');
  const currentUserId = state.currentUserId || '';

  const userGroupIds = (state.groups || []).filter(g => g.memberIds.includes(currentUserId)).map(g => g.id);

  const filterRequestList = (list: InternalRequest[]) => {
    return list.filter(r => {
      if (categoryFilter !== 'ALL') {
        const cat = REQUEST_TYPE_LABELS[r.type]?.category;
        if (cat !== categoryFilter) return false;
      }
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'IN_REVIEW' && r.status !== 'IN_REVIEW' && r.status !== 'SUBMITTED') return false;
        if (statusFilter === 'APPROVED' && r.status !== 'APPROVED') return false;
        if (statusFilter === 'REJECTED' && r.status !== 'REJECTED') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const creator = state.users.find(u => u.id === r.creatorId)?.name.toLowerCase() || '';
        return r.title.toLowerCase().includes(q) || creator.includes(q);
      }
      return true;
    });
  };

  const myInbox = filterRequestList((state.internalRequests || []).filter((r: any) => 
    (r.currentAssigneeId === currentUserId || (r.currentGroupId && userGroupIds.includes(r.currentGroupId))) 
    && r.status !== 'COMPLETED' && r.status !== 'REJECTED' && r.status !== 'CANCELLED'
  ));

  const myRequests = filterRequestList((state.internalRequests || []).filter((r: any) => r.creatorId === currentUserId));
  const orgRequests = isAdmin ? filterRequestList(state.internalRequests || []) : [];
  const myMeetings = (state.internalMeetings || []).filter((m: any) => 
    m.organizerId === currentUserId || 
    (m.participantIds || []).includes(currentUserId) || 
    (m.groupIds || []).some((gid: any) => userGroupIds.includes(gid))
  );

  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  useDeepLinkCreate(() => setIsNewRequestOpen(true));
  const [formError, setFormError] = useState('');
  const requestFormSchema = createInternalRequestFormSchema(Object.entries(REQUEST_TYPE_LABELS).map(([value, item]) => ({ value, label: item.title })));

  const handleApprove = (reqId: string) => {
    if (!can('internal', 'APPROVE')) return denied('تایید درخواست سازمانی');
    updateState(draft => {
      const r = (draft.internalRequests || []).find((x: any) => x.id === reqId);
      if (r) {
        r.status = 'APPROVED';
        r.updatedAt = new Date().toISOString();
        if (!draft.notifications) draft.notifications = [];
        draft.notifications.push({
          id: generateId(),
          title: `درخواست تأیید شد`,
          message: `درخواست "${r.title}" توسط مدیر مربوطه با موفقیت تأیید گردید.`,
          type: 'SUCCESS',
          read: false,
          createdAt: new Date().toISOString(),
          linkTab: 'internal_automation'
        });
      }
    });
  };

  const handleReject = (reqId: string) => {
    if (!can('internal', 'APPROVE')) return denied('رد درخواست سازمانی');
    updateState(draft => {
      const r = (draft.internalRequests || []).find((x: any) => x.id === reqId);
      if (r) {
        r.status = 'REJECTED';
        r.updatedAt = new Date().toISOString();
        if (!draft.notifications) draft.notifications = [];
        draft.notifications.push({
          id: generateId(),
          title: `درخواست رد شد`,
          message: `درخواست "${r.title}" توسط بررسی‌کننده رد گردید.`,
          type: 'WARNING',
          read: false,
          createdAt: new Date().toISOString(),
          linkTab: 'internal_automation'
        });
      }
    });
  };

  const handleCreateRequest = (values: Record<string, any>) => {
    if (!can('internal', 'CREATE')) return denied('ثبت درخواست سازمانی');
    setFormError('');
    const type = (values.type || 'GENERAL') as RequestType;
    const title = String(values.title || '').trim();
    const description = String(values.description || '').trim();
    const priority = (values.priority || 'NORMAL') as Priority;
    if (!title) return setFormError('عنوان درخواست را وارد نمایید.');

    const newReq: InternalRequest = {
      id: generateId(),
      type,
      title,
      description,
      creatorId: currentUserId,
      currentAssigneeId: state.users.find(u => u.id !== currentUserId)?.id || currentUserId,
      status: 'IN_REVIEW',
      priority,
      history: [{
        fromStatus: 'DRAFT',
        toStatus: 'IN_REVIEW',
        actorId: currentUserId,
        comment: 'ثبت و ارسال اولیه در سامانه',
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateState(draft => {
      if (!draft.internalRequests) draft.internalRequests = [];
      draft.internalRequests.unshift(newReq);
      if (!draft.notifications) draft.notifications = [];
      draft.notifications.push({
        id: generateId(),
        title: `درخواست اداری جدید ثبت شد`,
        message: `درخواست "${newReq.title}" در اتوماسیون ثبت گردید.`,
        type: 'INFO',
        read: false,
        createdAt: new Date().toISOString(),
        linkTab: 'internal_automation'
      });
    });

    setIsNewRequestOpen(false);
  };

  const renderRequestCard = (req: InternalRequest, isReviewer: boolean) => {
    const creator = (state.users || []).find(u => u.id === req.creatorId);
    const assignedUser = (state.users || []).find(u => u.id === req.currentAssigneeId);
    const assignedGroup = (state.groups || []).find(g => g.id === req.currentGroupId);
    const intelligence = isReviewer ? evaluateRequestIntelligence(req, state) : [];
    const typeMeta = REQUEST_TYPE_LABELS[req.type] || { title: req.type, category: 'ORG' };

    return (
      <Card key={req.id} padding="md" className="space-y-3 border-border hover:shadow-card transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeMeta.category === 'PERSONNEL' ? 'bg-sky-50 dark:bg-sky-950/40 text-info dark:text-sky-300 border border-sky-200 dark:border-sky-800/40' : 'bg-amber-50 dark:bg-amber-950/40 text-warning dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'}`}>
                {typeMeta.category === 'PERSONNEL' ? 'پرسنلی' : 'سازمانی'}
              </span>
              <h4 className="font-bold text-sm text-text-main">{req.title}</h4>
            </div>
            <div className="text-xs text-text-secondary mt-1 flex flex-wrap items-center gap-2">
              <span>درخواست‌دهنده: <strong className="text-text-main">{creator?.name || 'نامشخص'}</strong></span>
              <span>•</span>
              <span className="font-mono">{formatAppDate(req.createdAt, state.settings?.locale)}</span>
              {(assignedGroup || assignedUser) && (
                <>
                  <span>•</span>
                  <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[11px] font-medium">
                    در دست: {assignedGroup ? `گروه ${assignedGroup.name}` : assignedUser?.name}
                  </span>
                </>
              )}
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${req.status === 'APPROVED' ? 'bg-success-soft dark:bg-emerald-950/40 text-success dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' : req.status === 'REJECTED' ? 'bg-red-50 dark:bg-rose-950/40 text-danger dark:text-rose-300 border-rose-200 dark:border-rose-800/40' : req.status === 'WAITING_FOR_INFORMATION' ? 'bg-amber-50 dark:bg-amber-950/40 text-warning dark:text-amber-300 border-amber-200 dark:border-amber-800/40' : 'bg-sky-50 dark:bg-sky-950/40 text-info dark:text-sky-300 border-sky-200 dark:border-sky-800/40'}`}>
            {req.status === 'APPROVED' ? 'تأیید شده' : req.status === 'REJECTED' ? 'رد شده' : req.status === 'WAITING_FOR_INFORMATION' ? 'در انتظار اطلاعات' : 'در حال بررسی'}
          </span>
        </div>

        {req.description && (
          <p className="text-xs text-text-secondary leading-relaxed bg-canvas p-2.5 rounded-xl border border-border">
            {req.description}
          </p>
        )}

        <div className="bg-canvas p-2.5 rounded-xl text-xs space-y-1 border border-border font-medium">
          {req.type === 'LEAVE' && (
            <div className="text-text-main flex justify-between items-center">
              <span>بازه مرخصی: از {formatAppDate(req.data?.startDate, state.settings?.locale)} تا {formatAppDate(req.data?.endDate, state.settings?.locale)}</span>
              {req.data?.substituteName && <span className="text-text-secondary text-[11px]">جانشین: {req.data.substituteName}</span>}
            </div>
          )}
          {req.type === 'ADVANCE' && (
            <div className="text-text-main flex justify-between items-center font-mono">
              <span>مبلغ مساعده: {formatCurrency(req.data?.amount)} ریال</span>
              {req.data?.reason && <span className="text-text-secondary font-sans text-[11px]">{req.data.reason}</span>}
            </div>
          )}
        </div>

        {isReviewer && intelligence.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold text-text-secondary block">سیگنال‌های هوشمندی و تاریخچه مرتبط:</span>
            {intelligence.map((sig, idx) => (
              <div key={idx} className={`p-2 text-[11px] font-medium rounded-lg flex items-start gap-1.5 ${sig.type === 'RISK' ? 'bg-red-50 text-danger border border-red-200' : sig.type === 'ATTENTION' ? 'bg-amber-50 text-warning border border-amber-200' : 'bg-sky-50 text-info border border-sky-200'}`}>
                {sig.type === 'RISK' ? <AlertTriangle size={14} className="shrink-0 text-danger mt-0.5"/> : sig.type === 'ATTENTION' ? <AlertCircle size={14} className="shrink-0 text-warning mt-0.5"/> : <CheckCircle2 size={14} className="shrink-0 text-info mt-0.5"/>}
                <span>{sig.message}</span>
              </div>
            ))}
          </div>
        )}

        {isReviewer && (req.status === 'IN_REVIEW' || req.status === 'SUBMITTED') && (
          <div className="pt-2 border-t border-border flex justify-end gap-2">
            <Button size="sm" variant="danger" onClick={() => handleReject(req.id)} icon={<X size={14} />}>
              رد درخواست
            </Button>
            <Button size="sm" variant="success" onClick={() => handleApprove(req.id)} icon={<Check size={14} />}>
              تأیید نهایی
            </Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-24 font-premium" dir="rtl">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> اتوماسیون اداری و گردش‌کار داخلی
            </h2>
            <span className="text-xs text-text-secondary">مدیریت یکپارچه درخواست‌های پرسنلی، مأموریت، هزینه‌ها، جلسات و قوانین ارجاع</span>
          </div>
          <Button variant="primary" onClick={() => setIsNewRequestOpen(true)} icon={<Plus size={16} />}>
            ثبت درخواست جدید
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-border">
          <button onClick={() => setLocalTab('INBOX')} className={`px-4 py-2 text-sm font-bold whitespace-nowrap border-b-[3px] cursor-pointer transition-colors ${activeTab === 'INBOX' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}>
            کارتابل من ({myInbox.length})
          </button>
          <button onClick={() => setLocalTab('MY_REQUESTS')} className={`px-4 py-2 text-sm font-bold whitespace-nowrap border-b-[3px] cursor-pointer transition-colors ${activeTab === 'MY_REQUESTS' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}>
            درخواست‌های من ({myRequests.length})
          </button>
          <button onClick={() => setLocalTab('MEETINGS')} className={`px-4 py-2 text-sm font-bold whitespace-nowrap border-b-[3px] cursor-pointer transition-colors ${activeTab === 'MEETINGS' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}>
            جلسات و مصوبات ({myMeetings.length})
          </button>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {activeTab === 'INBOX' && (
          <div className="space-y-3">
            {myInbox.length > 0 ? myInbox.map(r => renderRequestCard(r, true)) : (
              <EmptyState 
                icon={<Inbox className="w-8 h-8 text-text-secondary opacity-50"/>} 
                title="کارتابل شما خالی است" 
                description="هیچ درخواستی در حال حاضر منتظر اقدام یا بررسی شما نیست."
                actionLabel="ثبت درخواست جدید"
                onAction={() => setIsNewRequestOpen(true)}
              />
            )}
          </div>
        )}

        {activeTab === 'MY_REQUESTS' && (
          <div className="space-y-3">
            {myRequests.length > 0 ? myRequests.map(r => renderRequestCard(r, false)) : (
              <EmptyState 
                icon={<FileText className="w-8 h-8 text-text-secondary opacity-50"/>} 
                title="درخواستی ثبت نشده است" 
                description="شما تاکنون هیچ درخواست مرخصی، مأموریت یا اداری ثبت نکرده‌اید."
                actionLabel="ثبت درخواست جدید"
                onAction={() => setIsNewRequestOpen(true)}
              />
            )}
          </div>
        )}

        {activeTab === 'MEETINGS' && (
          <div className="space-y-3">
            {myMeetings.length > 0 ? myMeetings.map((m: any) => (
              <Card key={m.id} padding="md" className="space-y-3 border-border hover:shadow-card transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-text-main">{m.title}</h4>
                    <div className="text-xs text-text-secondary mt-1 flex items-center gap-3 font-mono">
                      <span>تاریخ: {m.date}</span>
                      <span>ساعت: {m.startTime} تا {m.endTime}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-sky-50 text-info">
                    {m.status === 'SCHEDULED' ? 'برنامه‌ریزی شده' : 'برگزار شده'}
                  </span>
                </div>
                {m.agenda && <p className="text-xs text-text-secondary bg-canvas p-2 rounded-xl">{m.agenda}</p>}
                {m.actionItems && m.actionItems.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-[10px] font-bold text-text-secondary block mb-1">مصوبات و اقدامات جلسه:</span>
                    <div className="space-y-1">
                      {m.actionItems.map((act: any, idx: number) => (
                        <div key={idx} className="text-xs flex items-center gap-2 text-text-main">
                          <CheckCircle2 size={13} className="text-primary" />
                          <span>{act.title}</span>
                          {act.dueDate && <span className="text-[10px] text-text-secondary font-mono">({act.dueDate})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )) : (
              <EmptyState 
                icon={<CalendarDays className="w-8 h-8 text-text-secondary opacity-50"/>} 
                title="جلسه‌ای یافت نشد" 
                description="جلسه کاری برای شما در این بخش ثبت نشده است."
              />
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isNewRequestOpen}
        onClose={() => setIsNewRequestOpen(false)}
        title="ثبت درخواست جدید در اتوماسیون اداری"
      >
        {formError && <div role="alert" className="mb-3 p-3 bg-red-50 text-danger rounded-xl font-bold border border-red-200">{formError}</div>}
        <DynamicFormRenderer
          schema={requestFormSchema}
          initialValues={{ type: 'LEAVE', priority: 'NORMAL' }}
          onSubmit={handleCreateRequest}
          onCancel={() => setIsNewRequestOpen(false)}
          submitLabel="ثبت و ارسال درخواست"
        />
      </Modal>
    </div>
  );
}
