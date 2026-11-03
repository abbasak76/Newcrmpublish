import { useCan } from '../hooks/useCan';
import React, { useState, useMemo } from 'react';
import { AppState, CustomerTask, ID, Priority } from '../types';
import { processTaskCollaborationEvents } from '../lib/collaboration';
import { CheckSquare, Plus, Search, X } from 'lucide-react';
import { FilterChip } from './ui/Tabs';
import { Modal } from './ui/Modal';
import { useDeepLinkCreate } from '../hooks/useDeepLinkCreate';
import { EmptyState } from './ui/EmptyState';
import { Button } from './ui/Button';
import { TaskCard } from './shared/TaskCard';
import { AttachmentManager } from './ui/AttachmentManager';
import { generateId } from '../lib/utils';
import { parseTaskIntent } from '../lib/enterprise';
import { emitBusinessEvent } from '../lib/events';
import { DynamicFormRenderer } from './shared/DynamicFormRenderer';
import { createTaskWorkspaceFormSchema } from '../services/dynamicFormEngine';
import { assignSla, proposeOverflow, assessTaskSla, rankTasksForAttention, type TaskSlaState } from '../services/taskIntelligence';
import { OPERATIONS_CONFIG } from '../config/operations';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { appendTaskActivity } from '../services/taskActivity';
import { applyTaskWorkflow, type TaskWorkflowAction } from '../services/taskWorkflow';
import { evaluateAllCustomerCollections } from '../services/collectionEngine';
import { buildOperationalExceptionCenter } from '../services/operationalExceptionCenter';

interface TasksWorkspaceProps {
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
}

export function TasksWorkspace({ state, updateState }: TasksWorkspaceProps) {
  const { can, canOn, denied } = useCan(state, updateState);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'BREACHED' | 'AT_RISK' | 'UNSCHEDULED' | 'BLOCKED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, OPERATIONS_CONFIG.searchDebounceMs);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<CustomerTask | null>(null);
  const [showAttachModalFor, setShowAttachModalFor] = useState<ID | null>(null);
  const [workflowTaskId, setWorkflowTaskId] = useState<ID | null>(null);
  const [workflowReason, setWorkflowReason] = useState('');
  const [workflowResult, setWorkflowResult] = useState('');
  const [workflowNextAction, setWorkflowNextAction] = useState('');
  const [workflowError, setWorkflowError] = useState('');
  const [showExceptions, setShowExceptions] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [capacityWarning, setCapacityWarning] = useState<{ values: Record<string, any>; suggestedDate: string | null; count: number; limit: number } | null>(null);
  const capacityOverrideRef = React.useRef(false);
  
  const activeAccountId = state.activeContextAccountId;

  const filteredTasks = useMemo(() => {
    let list = (state.tasks || []).filter(t => activeAccountId ? (t.accountId === activeAccountId || t.customerId === activeAccountId) : true);

    if (filterStatus === 'OPEN') list = list.filter(t => t.status === 'OPEN');
    if (filterStatus === 'IN_PROGRESS') list = list.filter(t => t.status === 'IN_PROGRESS');
    if (filterStatus === 'COMPLETED') list = list.filter(t => t.status === 'COMPLETED');

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    if (slaFilter === 'BLOCKED') list = list.filter(task => String(task.status).toUpperCase() === 'BLOCKED');
    else if (slaFilter !== 'ALL') list = list.filter(task => assessTaskSla(task).state === (slaFilter as TaskSlaState));
    return rankTasksForAttention(list).map(item => item as typeof list[number]);
  }, [state.tasks, activeAccountId, filterStatus, slaFilter, debouncedSearchQuery]);

  const activeTasks = useMemo(() => (state.tasks || []).filter(task => !['COMPLETED','CANCELLED','CANCELED','VOID','DELETED'].includes(String(task.status || '').toUpperCase()) && (!activeAccountId || task.accountId === activeAccountId || task.customerId === activeAccountId)), [state.tasks, activeAccountId]);
  const collectionProfiles = useMemo(() => evaluateAllCustomerCollections(state).profiles, [state.accounts, state.invoices, state.cheques, state.settings, (state as any).collectionPromises]);
  
  const operationalExceptions = useMemo(() => {
    const all = buildOperationalExceptionCenter(state, new Date(), collectionProfiles);
    return all.filter(item => {
      if (activeAccountId && item.accountId && item.accountId !== activeAccountId) return false;
      if (item.kind === 'TASK') {
        const task = (state.tasks || []).find(candidate => String(candidate.id) === item.taskId);
        if (!task) return false;
        const ownerId = task.assigneeType === 'GROUP'
          ? (state.groups?.find(group => group.id === task.assigneeId)?.memberIds.includes(state.currentUserId || '') ? state.currentUserId : undefined)
          : task.assigneeId;
        return canOn('tasks', 'VIEW', { ownerId, branchId: (task as any).branchId, territoryId: (task as any).territoryId, teamId: (task as any).teamId, tenantId: (task as any).tenantId });
      }
      if (!can('finance', 'VIEW')) return false;
      const account = (state.accounts || []).find(candidate => candidate.id === item.accountId);
      if (!account) return false;
      return canOn('finance', 'VIEW', { ownerId: (account as any).ownerId, branchId: (account as any).branchId, territoryId: (account as any).territoryId, teamId: (account as any).teamId, tenantId: (account as any).tenantId });
    });
  }, [state, activeAccountId, collectionProfiles, can, canOn]);
  
  const slaCounts = useMemo(() => activeTasks.reduce((counts, task) => { const status = assessTaskSla(task).state; if (status === 'BREACHED') counts.breached++; else if (status === 'AT_RISK') counts.atRisk++; else if (status === 'UNSCHEDULED') counts.unscheduled++; if (String(task.status).toUpperCase() === 'BLOCKED') counts.blocked++; return counts; }, { breached: 0, atRisk: 0, unscheduled: 0, blocked: 0 }), [activeTasks]);

  const openNewTaskModalRef = React.useRef<() => void>(() => {});
  useDeepLinkCreate(() => openNewTaskModalRef.current());
  const openNewTaskModal = () => {
    if (!can('tasks', 'CREATE')) return denied('ایجاد وظیفه');
    setEditingTask(null);
    setErrorMsg('');
    setShowTaskModal(true);
  };

  openNewTaskModalRef.current = openNewTaskModal;

  const openEditTaskModal = (task: CustomerTask) => {
    if (!canOn('tasks', 'EDIT', { ownerId: task.assigneeType === 'GROUP' ? (state.groups?.find(g => g.id === task.assigneeId)?.memberIds.includes(state.currentUserId || '') ? state.currentUserId : undefined) : task.assigneeId })) return denied('ویرایش این وظیفه');
    setEditingTask(task);
    setErrorMsg('');
    setShowTaskModal(true);
  };

  const handleSaveTask = (values: Record<string, any>) => {
    if (editingTask ? !canOn('tasks', 'EDIT', { ownerId: editingTask.assigneeType === 'GROUP' ? (state.groups?.find(g => g.id === editingTask.assigneeId)?.memberIds.includes(state.currentUserId || '') ? state.currentUserId : undefined) : editingTask.assigneeId }) : !can('tasks', 'CREATE')) { setErrorMsg('مجوز ثبت یا ویرایش این وظیفه را ندارید.'); return denied('ثبت/ویرایش وظیفه'); }
    if (String(values.assigneeId || '') && String(values.assigneeId) !== state.currentUserId && !can('tasks', 'ASSIGN')) { setErrorMsg('مجوز ارجاع وظیفه به دیگران را ندارید.'); return denied('ارجاع وظیفه به دیگران'); }
    if (values.assigneeType !== 'GROUP' && values.assigneeId && (state.users || []).find(u => u.id === values.assigneeId && (u.isActive ?? u.active) === false)) { setErrorMsg('مسئول انتخاب‌شده غیرفعال است.'); return; }
    setErrorMsg('');
    const isMandatory = state.settings?.formFieldsMandatory !== false;
    const taskTitle = String(values.title || '').trim() || (!isMandatory ? 'پیگیری سریع' : '');
    const taskAccountId = String(values.accountId || '') || (!isMandatory ? (state.accounts?.[0]?.id || 'GENERAL') : '');
    const taskDueDate = String(values.dueDate || '');
    const taskPriority = (values.priority || 'NORMAL') as Priority;
    const assigneeType = (values.assigneeType || 'USER') as 'USER' | 'GROUP';
    const assigneeId = String(values.assigneeId || '') || (!isMandatory ? (state.currentUserId || state.users?.[0]?.id || 'admin') : '');
    const taskDescription = String(values.description || '').trim();
    if (!taskTitle) return setErrorMsg('عنوان وظیفه را تکمیل کنید.');
    if (!taskAccountId) return setErrorMsg('حساب تجاری مربوطه را مشخص کنید.');
    if (!assigneeId) return setErrorMsg('مسئول انجام کار را انتخاب کنید.');

    if (!editingTask && !capacityOverrideRef.current && taskDueDate) {
      const preview = { title: taskTitle, description: taskDescription, priority: taskPriority, assigneeId, dueDate: taskDueDate };
      const settings = (state.settings as any)?.taskWorkloadLimits?.[assigneeId] || {};
      const proposal = proposeOverflow(state.tasks || [], assigneeId, taskDueDate, [preview], {
        maxDailyTasks: settings.maxDailyTasks ?? OPERATIONS_CONFIG.defaultDailyTaskCapacity,
        maxDailyScore: settings.maxDailyScore ?? OPERATIONS_CONFIG.defaultDailyScoreCapacity,
        workingDays: settings.workingDays
      }, (state.users || []).filter(u => (u.isActive ?? u.active) !== false).map(u => u.id));
      if (!proposal.capacity.fits) {
        setCapacityWarning({ values, suggestedDate: proposal.nextSlot?.date || null, count: proposal.capacity.currentCount, limit: proposal.capacity.maxDailyTasks });
        return;
      }
    }
    capacityOverrideRef.current = false;
    setCapacityWarning(null);

    updateState(draft => {
      if (!draft.tasks) draft.tasks = [];
      if (editingTask) {
        const t = draft.tasks.find(x => x.id === editingTask.id);
        if (t) {
          t.title = taskTitle;
          t.description = taskDescription;
          t.accountId = taskAccountId;
          t.customerId = taskAccountId;
          t.dueDate = taskDueDate;
          t.priority = taskPriority;
          const reassigned = t.assigneeId !== assigneeId || t.assigneeType !== assigneeType;
          if (reassigned) {
            if (!t.reassignHistory) t.reassignHistory = [];
            t.reassignHistory.push({ fromId: t.assigneeId || 'UNKNOWN', toId: assigneeId, date: new Date().toISOString(), reason: 'ویرایش و ارجاع' });
            t.assigneeType = assigneeType;
            t.assigneeId = assigneeId;
          }
          const updated = appendTaskActivity(t, { action: reassigned ? 'REASSIGNED' : 'UPDATED', actorId: state.currentUserId || 'UNKNOWN', summary: reassigned ? 'وظیفه ویرایش و به مسئول جدید ارجاع شد' : 'جزئیات وظیفه ویرایش شد', details: reassigned ? `مسئول قبلی: ${editingTask.assigneeId || 'نامشخص'}؛ مسئول جدید: ${assigneeId}` : 'عنوان، توضیحات، حساب، مهلت یا اولویت بازبینی شد' });
          t.activityHistory = updated.activityHistory;
        }
      } else {
        const intentInfo = parseTaskIntent(taskTitle + ' ' + taskDescription);
        const newTask = assignSla({
          id: generateId(), accountId: taskAccountId, customerId: taskAccountId,
          title: taskTitle, description: taskDescription, dueDate: taskDueDate, targetDate: taskDueDate,
          status: 'OPEN', priority: taskPriority === 'NORMAL' && intentInfo.priority !== 'NORMAL' ? intentInfo.priority : taskPriority,
          slaStatus: 'ON_TRACK', assigneeType, assigneeId,
          smartIntent: intentInfo.intent, smartReason: intentInfo.reason, mentions: Array.isArray(values.mentions) ? values.mentions : [], createdAt: new Date().toISOString()
        }) as CustomerTask;
        const withActivity = appendTaskActivity(newTask, { action: 'CREATED', actorId: state.currentUserId || 'UNKNOWN', summary: 'وظیفه ایجاد شد', details: `اولویت: ${taskPriority}؛ مسئول: ${assigneeId}` });
        Object.assign(newTask, withActivity);
        draft.tasks.unshift(newTask);
        processTaskCollaborationEvents(newTask, state, draft, true);
        emitBusinessEvent('TASK_CREATED', 'TASK', newTask.id, newTask, state, updateState);
      }
    });
    setShowTaskModal(false);
  };

  const handleToggleTaskStatus = (taskId: ID) => {
    { const tk = (state.tasks || []).find(x => x.id === taskId); if (!tk || !canOn('tasks', 'EDIT', { ownerId: tk.assigneeType === 'GROUP' ? (state.groups?.find(g => g.id === tk.assigneeId)?.memberIds.includes(state.currentUserId || '') ? state.currentUserId : undefined) : tk.assigneeId })) return denied('تغییر وضعیت این وظیفه'); }
    updateState(draft => {
      const t = draft.tasks?.find(item => item.id === taskId);
      if (t) {
        const wasCompleted = t.status === 'COMPLETED';
        t.status = wasCompleted ? 'OPEN' : 'COMPLETED';
        const withActivity = appendTaskActivity(t, { action: wasCompleted ? 'REOPENED' : 'COMPLETED', actorId: state.currentUserId || 'UNKNOWN', summary: wasCompleted ? 'وظیفه دوباره باز شد' : 'وظیفه به‌عنوان انجام‌شده ثبت شد' });
        t.activityHistory = withActivity.activityHistory;
      }
    });
  };

  const applyWorkflowAction = (action: TaskWorkflowAction) => {
    const task = (state.tasks || []).find(item => item.id === workflowTaskId);
    if (!task) return;
    if (!canOn('tasks', 'EDIT', { ownerId: task.assigneeType === 'GROUP' ? (state.groups?.find(g => g.id === task.assigneeId)?.memberIds.includes(state.currentUserId || '') ? state.currentUserId : undefined) : task.assigneeId })) return denied('تغییر گردش کار این وظیفه');
    const result = applyTaskWorkflow(task, { action, actorId: state.currentUserId || 'UNKNOWN', reason: workflowReason, result: workflowResult, nextAction: workflowNextAction });
    if (!result.ok) { setWorkflowError(result.error || 'تغییر وضعیت انجام نشد.'); return; }
    updateState(draft => { const idx = draft.tasks?.findIndex(item => item.id === task.id) ?? -1; if (idx >= 0 && draft.tasks) draft.tasks[idx] = result.task as CustomerTask; });
    setWorkflowError(''); setWorkflowReason(''); setWorkflowResult(''); setWorkflowNextAction('');
    if (action === 'COMPLETE') setWorkflowTaskId(null);
  };

  const taskFormSchema = createTaskWorkspaceFormSchema(state.users || [], state.groups || [], state.accounts || []);

  return (
    <div className="w-full flex flex-col min-h-0 bg-transparent pb-32" dir="rtl">
      <div className="shrink-0 bg-transparent px-1 sm:px-3 pt-2 pb-3 space-y-3 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" /> مدیریت وظایف
            </h2>
            <span className="text-xs text-text-secondary font-medium mt-0.5 block">پیگیری‌ها، ارجاعات و فایل‌های ضمیمه</span>
          </div>
          <Button variant="primary" onClick={openNewTaskModal} icon={<Plus className="w-4 h-4" />}>تسک جدید</Button>
        </div>
        
        {activeAccountId && (
          <div className="bg-primary/10 border border-primary/20 text-primary text-xs font-bold p-3.5 rounded-2xl flex items-center justify-between">
            <span>در حال نمایش پیگیری‌های اختصاصی حساب: {state.accounts?.find(a=>a.id===activeAccountId)?.name}</span>
            <button onClick={() => updateState(d => { d.activeContextAccountId = null; d.activeContextCustomerId = null; })} className="text-primary hover:text-primary-hover bg-primary/20 p-1.5 rounded-xl cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" aria-label="خلاصه وضعیت و استثناهای وظایف">
          <button type="button" onClick={() => setSlaFilter(slaFilter === 'BREACHED' ? 'ALL' : 'BREACHED')} aria-pressed={slaFilter === 'BREACHED'} className={`rounded-2xl border p-3 text-right transition-colors cursor-pointer ${slaFilter === 'BREACHED' ? 'border-danger-line bg-danger-soft' : 'border-border/70 bg-surface'}`}>
            <span className="block text-[10px] font-bold text-text-secondary">مهلت گذشته</span><strong className="mt-1 block text-lg text-danger tabular-nums">{slaCounts.breached}</strong>
          </button>
          <button type="button" onClick={() => setSlaFilter(slaFilter === 'AT_RISK' ? 'ALL' : 'AT_RISK')} aria-pressed={slaFilter === 'AT_RISK'} className={`rounded-2xl border p-3 text-right transition-colors cursor-pointer ${slaFilter === 'AT_RISK' ? 'border-warning-line bg-warning-soft' : 'border-border/70 bg-surface'}`}>
            <span className="block text-[10px] font-bold text-text-secondary">در آستانه تأخیر</span><strong className="mt-1 block text-lg text-warning tabular-nums">{slaCounts.atRisk}</strong>
          </button>
          <button type="button" onClick={() => setSlaFilter(slaFilter === 'UNSCHEDULED' ? 'ALL' : 'UNSCHEDULED')} aria-pressed={slaFilter === 'UNSCHEDULED'} className={`rounded-2xl border p-3 text-right transition-colors cursor-pointer ${slaFilter === 'UNSCHEDULED' ? 'border-border bg-canvas' : 'border-border/70 bg-surface'}`}>
            <span className="block text-[10px] font-bold text-text-secondary">بدون مهلت معتبر</span><strong className="mt-1 block text-lg text-text-main tabular-nums">{slaCounts.unscheduled}</strong>
          </button>
          <button type="button" onClick={() => setSlaFilter(slaFilter === 'BLOCKED' ? 'ALL' : 'BLOCKED')} aria-pressed={slaFilter === 'BLOCKED'} className={`rounded-2xl border p-3 text-right transition-colors cursor-pointer ${slaFilter === 'BLOCKED' ? 'border-danger-line bg-danger-soft' : 'border-border/70 bg-surface'}`}>
            <span className="block text-[10px] font-bold text-text-secondary">متوقف / نیازمند رفع مانع</span><strong className="mt-1 block text-lg text-danger tabular-nums">{slaCounts.blocked}</strong>
          </button>
        </div>
        <div className="flex justify-start"><button type="button" onClick={() => setShowExceptions(v => !v)} aria-pressed={showExceptions} className={`text-xs font-bold px-3 py-2 rounded-xl border cursor-pointer ${showExceptions ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-text-secondary'}`}>مرکز استثناهای عملیاتی · {operationalExceptions.length}</button></div>
        {showExceptions && <div className="rounded-2xl border border-warning-line bg-warning-soft/50 p-3 space-y-2" aria-label="مرکز استثناهای عملیاتی">{operationalExceptions.length ? operationalExceptions.slice(0, 12).map(item => item.kind === 'TASK' ? <button key={item.id} type="button" onClick={() => { const task = (state.tasks || []).find(t => String(t.id) === item.taskId); if (!task) return; setWorkflowTaskId(task.id); setWorkflowReason(task.blockReason || ''); setWorkflowResult(task.result || ''); setWorkflowNextAction(task.nextAction || ''); setWorkflowError(''); }} className="w-full text-right rounded-xl bg-surface border border-border/70 p-3 cursor-pointer"><span className="flex items-center justify-between gap-2"><span className="text-xs font-black text-text-main">{item.title}</span><span className="text-[10px] font-bold text-warning">{item.severity === 'CRITICAL' ? 'بحرانی' : item.severity === 'HIGH' ? 'زیاد' : 'متوسط'}</span></span><span className="block mt-1 text-[11px] text-warning">وظیفه · {item.description}</span></button> : <div key={item.id} className="rounded-xl bg-surface border border-border/70 p-3"><span className="flex items-center justify-between gap-2"><span className="text-xs font-black text-text-main">{item.title}</span><span className="text-[10px] font-bold text-danger">{item.severity === 'CRITICAL' ? 'بحرانی' : item.severity === 'HIGH' ? 'زیاد' : 'متوسط'}</span></span><span className="block mt-1 text-[11px] text-text-secondary">{item.description}</span><span className="block mt-1 text-[11px] text-primary">اقدام پیشنهادی: {item.recommendedAction}</span></div>) : <p className="text-xs text-text-secondary">مورد استثنایی فعالی در وظایف و مطالبات پیدا نشد.</p>}</div>}
        {slaFilter !== 'ALL' && <div className="flex justify-start"><button type="button" onClick={() => setSlaFilter('ALL')} className="text-xs font-bold text-primary underline underline-offset-4 cursor-pointer">حذف فیلتر SLA</button></div>}

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <FilterChip label="همه وظایف" active={filterStatus === 'ALL'} onClick={() => setFilterStatus('ALL')} />
            <FilterChip label="در انتظار" active={filterStatus === 'OPEN'} onClick={() => setFilterStatus('OPEN')} />
            <FilterChip label="تکمیل‌شده" active={filterStatus === 'COMPLETED'} onClick={() => setFilterStatus('COMPLETED')} />
          </div>
          <div className="relative w-full sm:w-64">
            <input type="text" placeholder="جستجو..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-[42px] bg-surface border border-border/80 rounded-2xl pl-4 pr-11 text-xs font-medium text-text-main outline-none focus:border-primary shadow-subtle" />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-8 pb-32 pt-2">
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map(task => {
              const acc = state.accounts?.find(a => a.id === (task.accountId || task.customerId));
              const isDone = task.status === 'COMPLETED';
              let assigneeName = 'ناشناس';
              if (task.assigneeType === 'GROUP') {
                assigneeName = state.groups?.find(g => g.id === task.assigneeId)?.name || assigneeName;
              } else {
                assigneeName = state.users?.find(u => u.id === task.assigneeId)?.name || assigneeName;
              }
              const attachmentCount = (state.attachments || []).filter(a => a.entityId === task.id).length;

              return (
                <div key={task.id} className="se-card p-4">
                  <TaskCard 
                    task={task}
                    account={acc}
                    assigneeName={assigneeName}
                    isCompleted={isDone}
                    attachmentCount={attachmentCount}
                    onToggleStatus={() => handleToggleTaskStatus(task.id)}
                    onEdit={() => openEditTaskModal(task)}
                    onAttach={() => setShowAttachModalFor(task.id)}
                    onWorkflow={() => { setWorkflowTaskId(task.id); setWorkflowReason(task.blockReason || ''); setWorkflowResult(task.result || ''); setWorkflowNextAction(task.nextAction || ''); setWorkflowError(''); }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            icon={<CheckSquare className="w-8 h-8 text-text-secondary opacity-50" />} 
            title="وظیفه‌ای یافت نشد" 
            description="برای ایجاد تسک پیگیری جدید روی دکمه تسک جدید کلیک کنید." 
            actionLabel="تسک جدید"
            onAction={openNewTaskModal}
          />
        )}
      </div>

      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={editingTask ? 'ویرایش وظیفه' : 'تعریف وظیفه جدید'}
      >
        <div className="space-y-3">
          {errorMsg && <div role="alert" className="bg-danger-soft border border-danger-line text-danger px-4 py-3 rounded-2xl font-bold">{errorMsg}</div>}
          {capacityWarning && <div role="alert" className="space-y-3 rounded-2xl border border-warning-line bg-warning-soft p-4 text-sm">
            <p className="font-black text-text-main">ظرفیت روزانه مسئول انتخاب‌شده تکمیل می‌شود.</p>
            <p className="text-text-secondary">در حال حاضر {capacityWarning.count} تسک فعال ثبت شده است؛ سقف پیش‌فرض {capacityWarning.limit} تسک است. ارجاع خودکار انجام نمی‌شود.</p>
            {capacityWarning.suggestedDate && <Button variant="primary" block onClick={() => { const values = { ...capacityWarning.values, dueDate: capacityWarning.suggestedDate }; setCapacityWarning(null); handleSaveTask(values); }}>انتقال به اولین نوبت پیشنهادی ({capacityWarning.suggestedDate})</Button>}
            {can('tasks', 'ASSIGN') && <Button variant="secondary" block onClick={() => { capacityOverrideRef.current = true; const values = capacityWarning.values; setCapacityWarning(null); handleSaveTask(values); }}>ارجاع اجباری با مسئولیت مدیر</Button>}
            <Button variant="ghost" block onClick={() => setCapacityWarning(null)}>بازگشت به فرم</Button>
          </div>}
          <DynamicFormRenderer
            schema={taskFormSchema}
            initialValues={editingTask ? {
              title: editingTask.title,
              accountId: editingTask.accountId || editingTask.customerId || '',
              dueDate: editingTask.dueDate || '',
              priority: editingTask.priority || 'NORMAL',
              assigneeType: editingTask.assigneeType || 'USER',
              assigneeId: editingTask.assigneeId || '',
              description: editingTask.description || ''
            } : {
              accountId: state.activeContextAccountId || state.accounts?.[0]?.id || '',
              dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
              priority: 'NORMAL', assigneeType: 'USER', assigneeId: state.currentUserId || ''
            }}
            onSubmit={handleSaveTask}
            onCancel={() => setShowTaskModal(false)}
            submitLabel={editingTask ? 'ذخیره تغییرات' : 'ثبت وظیفه'}
          />
        </div>
      </Modal>

      <Modal isOpen={!!workflowTaskId} onClose={() => { setWorkflowTaskId(null); setWorkflowError(''); }} title="گردش کار و نتیجه پیگیری">
        {(() => { const task = (state.tasks || []).find(item => item.id === workflowTaskId); if (!task) return <p className="text-sm text-text-secondary">وظیفه در دسترس نیست.</p>; const status = String(task.status || 'OPEN').toUpperCase(); return <div className="space-y-4">
          <div className="rounded-2xl bg-canvas border border-border p-3"><div className="text-sm font-black text-text-main">{task.title}</div><div className="mt-1 text-xs text-text-secondary">وضعیت: {status} · تاریخچه: {(task.activityHistory || []).length} رویداد</div>{task.blockReason && <div className="mt-2 text-xs text-danger">مانع فعلی: {task.blockReason}</div>}{task.result && <div className="mt-2 text-xs text-text-secondary">آخرین نتیجه: {task.result}</div>}</div>
          {workflowError && <div role="alert" className="rounded-xl border border-danger-line bg-danger-soft p-3 text-xs font-bold text-danger">{workflowError}</div>}
          <label className="block text-xs font-bold text-text-main">شرح مانع / دلیل توقف<textarea value={workflowReason} onChange={e => setWorkflowReason(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-border bg-surface p-3 text-sm" placeholder="برای توقف وظیفه الزامی است" /></label>
          <label className="block text-xs font-bold text-text-main">نتیجه پیگیری<textarea value={workflowResult} onChange={e => setWorkflowResult(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-border bg-surface p-3 text-sm" placeholder="نتیجه واقعی تماس، مراجعه یا اقدام" /></label>
          <label className="block text-xs font-bold text-text-main">اقدام بعدی<textarea value={workflowNextAction} onChange={e => setWorkflowNextAction(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-border bg-surface p-3 text-sm" placeholder="اقدام بعدی و قابل پیگیری" /></label>
          <div className="grid grid-cols-2 gap-2">{status === 'OPEN' || status === 'PENDING' ? <Button variant="secondary" block onClick={() => applyWorkflowAction('START')}>شروع کار</Button> : null}{['OPEN','PENDING','IN_PROGRESS'].includes(status) ? <Button variant="secondary" block onClick={() => applyWorkflowAction('BLOCK')}>ثبت مانع و توقف</Button> : null}{status === 'BLOCKED' ? <Button variant="secondary" block onClick={() => applyWorkflowAction('UNBLOCK')}>رفع مانع و ادامه</Button> : null}{['OPEN','PENDING','IN_PROGRESS'].includes(status) ? <Button variant="primary" block onClick={() => applyWorkflowAction('COMPLETE')}>ثبت نتیجه و تکمیل</Button> : null}{['COMPLETED','CANCELLED','CANCELED'].includes(status) ? <Button variant="secondary" block onClick={() => applyWorkflowAction('REOPEN')}>بازگشایی وظیفه</Button> : null}<Button variant="ghost" block onClick={() => applyWorkflowAction('RECORD_RESULT')}>ثبت نتیجه / اقدام بعدی</Button></div>
          <div className="border-t border-border pt-3 space-y-2"><div className="text-xs font-black text-text-main">تاریخچه فعالیت</div>{[...(task.activityHistory || [])].slice().reverse().slice(0, 10).map((event: any) => <div key={event.id} className="rounded-xl bg-canvas p-2"><div className="text-[11px] font-bold text-text-main">{event.summary}</div><div className="text-[10px] text-text-secondary">{new Date(event.at).toLocaleString('fa-IR')} · {event.actorId}</div>{event.details && <div className="text-[11px] text-text-secondary mt-1">{event.details}</div>}</div>)}</div>
        </div>; })()}
      </Modal>

      <Modal
        isOpen={!!showAttachModalFor}
        onClose={() => setShowAttachModalFor(null)}
        title="مدیریت فایل‌ها و پیوست‌ها"
        footer={<Button variant="primary" onClick={() => setShowAttachModalFor(null)}>بستن</Button>}
      >
        {showAttachModalFor && (
          <AttachmentManager 
            entityId={showAttachModalFor}
            entityType="TASK"
            state={state}
            updateState={updateState}
          />
        )}
      </Modal>
    </div>
  );
}
