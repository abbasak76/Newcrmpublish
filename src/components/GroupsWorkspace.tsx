import { guard } from '../hooks/useCan';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppState, UserGroup, GroupMessage, Mention, ID, CustomerTask } from '../types';
import { generateId } from '../lib/utils';
import { processMessageMentions, processTaskCollaborationEvents } from '../lib/collaboration';
import {
  Users, Send, Building2, CheckSquare, Search, Plus, MessageCircle, Paperclip, Check, CheckCheck, UserPlus, FileText, TrendingUp,
  ShieldAlert, Activity, ArrowRight, Pin, PinOff, Reply, Pencil, Trash2, X, MessageSquarePlus, ImageIcon, Download, ListPlus, AtSign
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Avatar } from './ui/Avatar';
import { RBACService } from '../lib/rbac';
import { haptics } from '../lib/haptics';
import { useCan } from '../hooks/useCan';
import { cn } from '../lib/utils';
import { searchMentions, createMentionReference, MentionEntity } from '../services/mentionEngine';
import { assignSla, proposeOverflow } from '../services/taskIntelligence';
import { OPERATIONS_CONFIG } from '../config/operations';

interface Props { state: AppState; updateState: (updater: (draft: AppState) => AppState | void) => void; setActiveTab?: (tab: any) => void }
type Filter = 'ALL' | 'UNREAD' | 'MENTIONS' | 'GROUPS' | 'DIRECT';
type EntityType = 'ACCOUNT' | 'TASK' | 'QUOTE' | 'OPPORTUNITY' | 'CASE' | 'REQUEST';

const MAX_FILE = 1.5 * 1024 * 1024;
const fa = (n: number) => n.toLocaleString('fa-IR');
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
const dayOf = (iso: string) => new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();
const shortWhen = (iso: string) => (sameDay(iso, new Date().toISOString()) ? timeOf(iso) : new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short' }).format(new Date(iso)));
const ENTITY_ICON: Record<string, React.ElementType> = { ACCOUNT: Building2, CUSTOMER: Building2, STAFF: Users, CHECK: FileText, INVOICE: FileText, PRODUCT: FileText, TASK: CheckSquare, QUOTE: FileText, OPPORTUNITY: TrendingUp, CASE: ShieldAlert, REQUEST: Activity };

export function GroupsWorkspace({ state, updateState }: Props) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const me = state.currentUserId || '';
  const rbac = useMemo(() => new RBACService(state), [state]);
  const { denied } = useCan(state, updateState);
  const canCreateGroup = rbac.can('groups', 'CREATE');
  const users = state.users || [];
  const userOf = (id: string) => users.find(u => u.id === id);

  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [fileError, setFileError] = useState('');
  const [attachedEntity, setAttachedEntity] = useState<{ type: EntityType; id: ID; display: string } | undefined>();
  const [pendingMentions, setPendingMentions] = useState<Mention[]>([]);
  const [pendingEntityMentions, setPendingEntityMentions] = useState<ReturnType<typeof createMentionReference>[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [modal, setModal] = useState<null | 'group' | 'dm' | 'members' | 'record' | 'task'>(null);
  const [taskFrom, setTaskFrom] = useState<any | null>(null);
  const [taskAssignee, setTaskAssignee] = useState(me);
  const [taskDue, setTaskDue] = useState(new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
  const [taskPriority, setTaskPriority] = useState('NORMAL');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [pickQuery, setPickQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const unreadAnchor = useRef<{ id: string; msgId: string | null } | null>(null);

  const activeId = params.get('c');
  const openConv = (id: string | null) => { const n = new URLSearchParams(params); if (id) n.set('c', id); else n.delete('c'); setParams(n, { replace: false }); setSelectedMsg(null); setReplyTo(null); setEditing(null); setText(''); };

  // ---- مجموعه گفتگوهایی که کاربر اجازه دیدن دارد (پیام مستقیم فقط برای طرفین) ----
  const allGroups = (state.groups || []) as any[];
  // Conversation confidentiality is membership-based. Admin privileges manage groups; they do not grant implicit access to every private conversation.
  const convs = useMemo(() => allGroups.filter(g => Array.isArray(g.memberIds) && g.memberIds.includes(me) && g.active !== false), [allGroups, me]);
  const msgsOf = (gid: string) => ((state.messages || []) as any[]).filter(m => m.groupId === gid).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const nameOf = (g: any) => (g.kind === 'DIRECT' ? userOf(g.memberIds.find((i: string) => i !== me) || me)?.name || 'کاربر' : g.name);
  const previewOf = (m: any) => (!m ? 'هنوز پیامی نیست' : m.deleted ? 'پیام حذف شد' : (m.senderId === me ? 'شما: ' : '') + (m.content || (m.attachments?.length ? '📎 فایل پیوست' : m.relatedEntity ? '🔗 رکورد CRM' : '')));
  const rows = useMemo(() => convs.map(g => {
    const ms = msgsOf(g.id); const last = ms[ms.length - 1];
    const unread = ms.filter(m => !m.deleted && m.senderId !== me && !m.readBy?.includes(me));
    const mentioned = unread.filter(m => m.mentions?.some((x: Mention) => x.id === me)).length;
    return { g, last, unread: unread.length, mentioned, pinned: !!g.pinnedBy?.includes(me), name: nameOf(g), ms };
  }), [convs, state.messages, users, me]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = query.trim().toLowerCase();
  const visible = rows.filter(r => {
    if (filter === 'UNREAD' && r.unread === 0) return false;
    if (filter === 'MENTIONS' && r.mentioned === 0) return false;
    if (filter === 'GROUPS' && r.g.kind === 'DIRECT') return false;
    if (filter === 'DIRECT' && r.g.kind !== 'DIRECT') return false;
    if (q && !(r.name.toLowerCase().includes(q) || r.ms.some(m => !m.deleted && String(m.content || '').toLowerCase().includes(q)))) return false;
    return true;
  }).sort((a, b) => (+b.pinned - +a.pinned) || (+new Date(b.last?.createdAt || 0) - +new Date(a.last?.createdAt || 0)));

  const active = rows.find(r => r.g.id === activeId);
  const activeGroup: any = active?.g;
  const messages = active?.ms || [];
  const members: any[] = activeGroup ? activeGroup.memberIds.map((id: string) => userOf(id)).filter(Boolean) : [];

  // ---- نقطه «پیام‌های جدید» قبل از علامت‌گذاری خوانده‌شده ----
  if (activeId && unreadAnchor.current?.id !== activeId) {
    const firstUnread = messages.find((m: any) => !m.deleted && m.senderId !== me && !m.readBy?.includes(me));
    unreadAnchor.current = { id: activeId, msgId: firstUnread?.id || null };
  }
  useEffect(() => { if (!activeId) unreadAnchor.current = null; }, [activeId]);

  useEffect(() => {
    if (!activeId || !me) return;
    const has = messages.some((m: any) => m.senderId !== me && !m.readBy?.includes(me));
    if (!has) return;
    updateState((d: AppState) => { (d.messages || []).forEach((m: any) => { if (m.groupId === activeId && !m.readBy?.includes(me)) { if (!m.readBy) m.readBy = []; m.readBy.push(me); } }); });
  }, [activeId, messages.length, me]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages.length, activeId]);
  useEffect(() => { const el = inputRef.current; if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; } }, [text]);

  // ---- ارسال / ویرایش ----
  const onTextChange = (v: string, caret: number) => {
    setText(v);
    const m = v.slice(0, caret).match(/(?:^|\s)@([^\s@]*)$/);
    setMentionQuery(m ? m[1] : null);
  };
  const mentionOptions = mentionQuery === null ? [] : members.filter(u => u.id !== me && ((u.name || '').toLowerCase().includes(mentionQuery.toLowerCase()) || (u.username || '').toLowerCase().includes(mentionQuery.toLowerCase()))).slice(0, 5);
  const entityMentionOptions: MentionEntity[] = mentionQuery === null ? [] : searchMentions(state, mentionQuery, { maxResults: 8 }).filter(entity => entity.entityType !== 'STAFF').slice(0, 6);
  const pickEntityMention = (entity: MentionEntity) => {
    const el = inputRef.current; const caret = el?.selectionStart ?? text.length; const beforeText = text.slice(0, caret); const at = beforeText.lastIndexOf('@');
    if (at < 0) return; const before = text.slice(0, at); const after = text.slice(caret); const token = `@${entity.displayText}`;
    setText(`${before}${token} ${after}`); setPendingEntityMentions(previous => previous.some(x => x.entityType === entity.entityType && x.entityId === entity.entityId) ? previous : [...previous, createMentionReference(entity)]); setMentionQuery(null); setTimeout(() => el?.focus(), 0);
  };
  const pickMention = (u: any) => {
    const el = inputRef.current; const caret = el?.selectionStart ?? text.length;
    const before = text.slice(0, caret).replace(/@([^\s@]*)$/, ''); const after = text.slice(caret);
    const token = `@${u.name}`; setText(`${before}${token} ${after}`); setMentionQuery(null);
    setPendingMentions(p => (p.some(x => x.id === u.id) ? p : [...p, { id: u.id, type: 'USER', display: token } as Mention]));
    setTimeout(() => el?.focus(), 0);
  };

  const readFiles = (list: FileList | null) => {
    if (!list) return; setFileError('');
    Array.from(list).slice(0, 4 - files.length).forEach(f => {
      if (f.size > MAX_FILE) { setFileError(`«${f.name}» بزرگ‌تر از ۱٫۵ مگابایت است و اضافه نشد.`); return; }
      const r = new FileReader();
      r.onload = () => setFiles(p => (p.length >= 4 ? p : [...p, { id: generateId(), fileName: f.name, fileType: f.type, fileSize: f.size, base64Data: String(r.result) }]));
      r.readAsDataURL(f);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const send = () => {
    if (!activeGroup) return;
    const content = text.trim();
    if (editing) {
      if (!content) return;
      if (!rbac.canActOnRecord('messages', 'EDIT', scopeOf(editing.senderId))) return denied('ویرایش این پیام');
      updateState(d => { const m: any = (d.messages || []).find((x: any) => x.id === editing.id && x.groupId === activeGroup.id); if (m && m.senderId === me && !m.deleted) { m.content = content; m.editedAt = new Date().toISOString(); } });
      setEditing(null); setText(''); haptics.light(); return;
    }
    if (!content && !attachedEntity && files.length === 0) return;
    const mentions = pendingMentions.filter(p => content.includes(p.display) && activeGroup.memberIds.includes(p.id) && (userOf(p.id)?.isActive ?? userOf(p.id)?.active) !== false);
    const msg: any = {
      id: generateId(), groupId: activeGroup.id, senderId: me, content, mentions, entityMentions: pendingEntityMentions.filter(ref => content.includes(`@${ref.displayText}`)), relatedEntity: attachedEntity,
      attachments: files.length ? files : undefined, replyToId: replyTo?.id, createdAt: new Date().toISOString(), readBy: [me],
    };
    updateState(d => {
      if (!d.messages) d.messages = [];
      d.messages.push(msg);
      processMessageMentions(msg as GroupMessage, nameOf(activeGroup), state, d);
      if (activeGroup.kind === 'DIRECT') {
        const other = activeGroup.memberIds.find((i: string) => i !== me);
        if (other) { if (!d.notifications) d.notifications = []; d.notifications.push({ id: generateId(), title: 'پیام جدید', message: `${userOf(me)?.name || 'همکار'}: ${(content || 'پیوست').slice(0, 60)}`, type: 'INFO', read: false, createdAt: new Date().toISOString(), linkTab: 'groups', recipientId: other }); }
      }
    });
    setText(''); setAttachedEntity(undefined); setFiles([]); setReplyTo(null); setPendingMentions([]); setPendingEntityMentions([]); setMentionQuery(null); haptics.selection();
  };
  const removeMsg = (m: any) => { if (!rbac.canActOnRecord('messages', 'SOFT_DELETE', scopeOf(m.senderId))) return denied('حذف این پیام'); updateState(d => { const x: any = (d.messages || []).find((y: any) => y.id === m.id && y.groupId === activeGroup?.id); if (x && !x.deleted) { x.deletedBy = me; x.deleted = true; x.deletedAt = new Date().toISOString(); x.content = ''; x.attachments = undefined; x.relatedEntity = undefined; x.mentions = []; } }); setSelectedMsg(null); };

  // ---- ایجاد وظیفه از پیام (جلوگیری از تکرار با taskId روی پیام) ----
  const openTaskFrom = (m: any) => { setTaskFrom(m); setTaskAssignee(me); setModal('task'); };
  const createTask = () => {
    if (!taskFrom || taskFrom.taskId) return;
    if (!rbac.can('tasks', 'CREATE')) return denied('ایجاد وظیفه');
    if (taskAssignee !== me && !rbac.can('tasks', 'ASSIGN')) return denied('ارجاع وظیفه به دیگران');
    if (!activeGroup?.memberIds.includes(taskAssignee)) return;
    const mentionedCustomer = (taskFrom.entityMentions || []).find((ref: any) => ref.entityType === 'CUSTOMER');
    const acc = taskFrom.relatedEntity?.type === 'ACCOUNT' ? taskFrom.relatedEntity.id : mentionedCustomer?.entityId;
    const task: any = assignSla({
      id: generateId(), accountId: acc, customerId: acc, title: String(taskFrom.content || 'پیگیری از گفتگو').slice(0, 80), description: `ایجادشده از پیام گروه «${nameOf(activeGroup)}»`,
      dueDate: taskDue, targetDate: taskDue, status: 'OPEN', priority: taskPriority, slaStatus: 'ON_TRACK', assigneeType: 'USER', assigneeId: taskAssignee,
      mentions: Array.isArray(taskFrom.entityMentions) ? taskFrom.entityMentions : [], sourceMessageId: taskFrom.id, createdAt: new Date().toISOString(),
    });
    const settings = (state.settings as any)?.taskWorkloadLimits?.[taskAssignee] || {};
    const capacityProposal = proposeOverflow(state.tasks || [], taskAssignee, taskDue, [task], {
      maxDailyTasks: settings.maxDailyTasks ?? OPERATIONS_CONFIG.defaultDailyTaskCapacity,
      maxDailyScore: settings.maxDailyScore ?? OPERATIONS_CONFIG.defaultDailyScoreCapacity,
      workingDays: settings.workingDays,
    }, (state.users || []).filter(u => (u.isActive ?? u.active) !== false).map(u => u.id));
    if (!capacityProposal.capacity.fits) {
      window.alert(`ظرفیت روزانه این مسئول تکمیل است. اولین تاریخ پیشنهادی: ${capacityProposal.nextSlot?.date || 'در بازه ۹۰ روزه یافت نشد'}. لطفاً تاریخ را اصلاح کنید یا مسئول دیگری انتخاب کنید.`);
      return;
    }
    updateState(d => {
      // Idempotent: اگر پیام قبلاً وظیفه ساخته (دوبار کلیک/ارسال مجدد)، رکورد دوم ساخته نمی‌شود
      const m: any = (d.messages || []).find((x: any) => x.id === taskFrom.id);
      if (!m || m.taskId || m.deleted) return;
      m.taskId = task.id;
      if (!d.tasks) d.tasks = []; d.tasks.unshift(task as CustomerTask);
      processTaskCollaborationEvents(task, state, d, true);
      if (!d.auditLogs) d.auditLogs = [];
      d.auditLogs.push({ id: generateId(), action: 'TASK_CREATED', entityType: 'TASK', entityId: task.id, details: `وظیفه «${task.title}» از پیام گروهی ساخته شد`, actor: userOf(me)?.name || 'System', createdAt: new Date().toISOString() });
    });
    setModal(null); setTaskFrom(null); haptics.success();
  };

  // ---- گروه / پیام مستقیم / سنجاق ----
  const createGroup = () => {
    if (!guard(state, updateState, 'groups', 'CREATE', 'ایجاد گروه')) return;
    if (!newGroupName.trim()) return;
    const g: any = { id: generateId(), name: newGroupName.trim(), description: newGroupDesc.trim(), managerId: me, memberIds: [...new Set([...selectedMembers, me])], active: true };
    updateState(d => { if (!d.groups) d.groups = []; d.groups.push(g); });
    setNewGroupName(''); setNewGroupDesc(''); setSelectedMembers([]); setModal(null); openConv(g.id);
  };
  const startDirect = (uid: string) => {
    const ex = allGroups.find(g => g.kind === 'DIRECT' && g.memberIds.length === 2 && g.memberIds.includes(me) && g.memberIds.includes(uid));
    setModal(null); setPickQuery('');
    if (ex) { openConv(ex.id); return; }
    const g: any = { id: generateId(), name: '', kind: 'DIRECT', memberIds: [me, uid], active: true, managerId: me };
    updateState(d => { if (!d.groups) d.groups = []; d.groups.push(g); });
    openConv(g.id);
  };
  const togglePin = (g: any) => updateState(d => { const x: any = (d.groups || []).find((y: any) => y.id === g.id); if (!x) return; const s = new Set<string>(x.pinnedBy || []); s.has(me) ? s.delete(me) : s.add(me); x.pinnedBy = [...s]; });
  const toggleMember = (uid: string) => {
    if (!activeGroup || activeGroup.kind === 'DIRECT') return;
    updateState(d => { const g: any = (d.groups || []).find((x: any) => x.id === activeGroup.id); if (!g) return; if (g.memberIds.includes(uid)) { if (g.memberIds.length > 1) g.memberIds = g.memberIds.filter((i: string) => i !== uid); } else g.memberIds.push(uid); });
  };
  const canManage = !!activeGroup && activeGroup.kind !== 'DIRECT' && rbac.canActOnRecord('groups', 'EDIT', { memberIds: activeGroup.memberIds, managerId: activeGroup.managerId });
  const scopeOf = (ownerId?: string) => ({ memberIds: activeGroup?.memberIds || [], managerId: activeGroup?.managerId, ownerId });

  const goEntity = (e: { type: string; id: ID }) => {
    if (e.type === 'ACCOUNT' || e.type === 'CUSTOMER') { updateState(d => { d.activeContextAccountId = e.id; d.activeContextCustomerId = e.id; }); navigate(`/accounts/${e.id}`); return; }
    const destination: Record<string, string> = { TASK: '/tasks', QUOTE: '/quotes', OPPORTUNITY: '/opportunities', CASE: '/cases', REQUEST: '/internal_automation', STAFF: '/personnel-file', CHECK: '/finance', INVOICE: '/finance', PRODUCT: '/command', WAREHOUSE: '/operations' };
    navigate(destination[e.type] || '/');
  };

  const recordOptions = useMemo(() => {
    const s: any = state; const ql = pickQuery.trim().toLowerCase();
    const all: { type: EntityType; id: ID; display: string }[] = [
      ...(s.accounts || []).map((x: any) => ({ type: 'ACCOUNT' as const, id: x.id, display: `مشتری: ${x.name}` })),
      ...(s.tasks || []).map((x: any) => ({ type: 'TASK' as const, id: x.id, display: `وظیفه: ${x.title}` })),
      ...(s.opportunities || []).map((x: any) => ({ type: 'OPPORTUNITY' as const, id: x.id, display: `فرصت: ${x.title}` })),
      ...(s.quotes || []).map((x: any) => ({ type: 'QUOTE' as const, id: x.id, display: `پیش‌فاکتور: ${x.number || x.quoteNumber || x.id}` })),
      ...(s.cases || []).map((x: any) => ({ type: 'CASE' as const, id: x.id, display: `پرونده: ${x.title || x.subject || x.id}` })),
    ];
    return all.filter(o => !ql || o.display.toLowerCase().includes(ql)).slice(0, 30);
  }, [state, pickQuery]);

  // ---- نمایش متن پیام با هایلایت منشن ----
  const renderContent = (m: any, mine: boolean) => {
    let parts: React.ReactNode[] = [m.content]; const mentions: Mention[] = m.mentions || [];
    mentions.forEach(mn => { parts = parts.flatMap((p, i) => (typeof p === 'string' && p.includes(mn.display) ? p.split(mn.display).flatMap((seg, k, arr) => (k < arr.length - 1 ? [seg, <mark key={`${mn.id}-${i}-${k}`} className={cn('rounded px-1 font-bold', mine ? 'bg-white/25 text-white' : 'bg-primary/10 text-primary')}>{mn.display}</mark>] : [seg])) : [p])); });
    return <>{parts}</>;
  };

  const peopleForDM = users.filter(u => u.id !== me && (u.isActive ?? u.active) !== false && (!pickQuery || u.name?.includes(pickQuery) || u.username?.toLowerCase().includes(pickQuery.toLowerCase())));
  const totalUnread = rows.reduce((s, r) => s + r.unread, 0);
  const FILTERS: [Filter, string][] = [['ALL', 'همه'], ['UNREAD', 'خوانده‌نشده'], ['MENTIONS', 'منشن'], ['GROUPS', 'گروه‌ها'], ['DIRECT', 'مستقیم']];

  // ============================ UI ============================
  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-0 gap-3 p-3 sm:p-4 lg:h-[calc(100dvh-80px)]" dir="rtl">
      {/* ---------------- Inbox ---------------- */}
      <section aria-label="صندوق گفتگوها" className={cn('se-card flex min-h-0 w-full flex-col overflow-hidden md:w-[340px] md:shrink-0', activeId ? 'hidden md:flex' : 'flex pb-[88px] md:pb-0')}>
        <div className="space-y-3 border-b border-border p-3.5">
          <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-base font-extrabold text-text-main"><MessageCircle className="h-5 w-5 text-primary" />تعاملات{totalUnread > 0 && <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold text-white">{fa(totalUnread)}</span>}</h1>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setPickQuery(''); setModal('dm'); }} aria-label="پیام جدید" title="پیام مستقیم جدید" className="se-float-btn se-interactive se-pressable"><MessageSquarePlus size={18} /></button>
              {canCreateGroup && <button onClick={() => setModal('group')} aria-label="گروه جدید" title="گروه جدید" className="se-float-btn se-interactive se-pressable"><Users size={18} /></button>}
            </div>
          </div>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو در گفتگوها و پیام‌ها" aria-label="جستجو در گفتگوها"
              className="min-h-[44px] w-full rounded-full border border-border bg-canvas pe-10 ps-4 text-xs font-medium text-text-main outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
          </div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto" role="tablist" aria-label="فیلتر گفتگوها">
            {FILTERS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
                className={cn('se-interactive min-h-[36px] shrink-0 cursor-pointer rounded-full px-3.5 text-[11px] font-bold', filter === id ? 'bg-primary text-white shadow-lux' : 'border border-border bg-surface text-text-secondary hover:bg-canvas')}>{label}</button>
            ))}
          </div>
        </div>
        <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {visible.map((r, i) => {
            const on = r.g.id === activeId; const isDm = r.g.kind === 'DIRECT'; const other = isDm ? userOf(r.g.memberIds.find((x: string) => x !== me)) : null;
            return (
              <li key={r.g.id}>
                <button onClick={() => openConv(r.g.id)} aria-current={on ? 'true' : undefined} style={{ ['--i' as any]: Math.min(i, 8) }}
                  className={cn('se-interactive anim-rise flex min-h-[64px] w-full cursor-pointer items-center gap-3 rounded-2xl border p-2.5 text-start', on ? 'border-primary/25 bg-primary/[.07]' : 'border-transparent hover:bg-canvas')}>
                  {isDm ? <Avatar name={r.name} src={other?.avatar} size="sm" /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Users size={16} /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <strong className={cn('flex min-w-0 items-center gap-1 truncate text-xs text-text-main', r.unread ? 'font-black' : 'font-bold')}>{r.pinned && <Pin size={11} className="shrink-0 text-gold" />}<span className="truncate">{r.name}</span></strong>
                      <span className="shrink-0 text-[10px] text-text-secondary">{r.last ? shortWhen(r.last.createdAt) : ''}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className={cn('truncate text-[11px]', r.unread ? 'font-bold text-text-main' : 'text-text-secondary')}>{previewOf(r.last)}</span>
                      <span className="flex shrink-0 items-center gap-1">
                        {r.mentioned > 0 && <span aria-label="منشن شده‌اید" className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-black text-primary-dark"><AtSign size={11} /></span>}
                        {r.unread > 0 && <span aria-label={`${r.unread} پیام خوانده‌نشده`} className="grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[10px] font-bold text-white">{fa(r.unread)}</span>}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="px-4 py-12 text-center text-xs text-text-secondary">
              <MessageCircle size={34} className="mx-auto mb-2 opacity-25" />
              {convs.length === 0 ? 'هنوز گفتگویی ندارید. با دکمه «پیام جدید» شروع کنید.' : 'گفتگویی با این فیلتر یا جستجو پیدا نشد.'}
            </li>
          )}
        </ul>
      </section>

      {/* ---------------- Conversation ---------------- */}
      <section aria-label="گفتگو" className={cn('se-card min-h-0 flex-1 flex-col overflow-hidden', activeId ? 'flex' : 'hidden md:flex')}>
        {activeGroup ? (
          <>
            <header className="flex items-center gap-2.5 border-b border-border p-3">
              <button onClick={() => openConv(null)} aria-label="بازگشت به صندوق" className="se-float-btn se-interactive se-pressable md:hidden"><ArrowRight size={18} /></button>
              {activeGroup.kind === 'DIRECT' ? <Avatar name={active!.name} src={userOf(activeGroup.memberIds.find((i: string) => i !== me))?.avatar} size="sm" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"><Users size={17} /></span>}
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-extrabold text-text-main">{active!.name}</h2>
                <p className="truncate text-[11px] text-text-secondary">{activeGroup.kind === 'DIRECT' ? 'پیام مستقیم' : `${fa(activeGroup.memberIds.length)} عضو${activeGroup.description ? ' · ' + activeGroup.description : ''}`}</p>
              </div>
              <button onClick={() => togglePin(activeGroup)} aria-label={active!.pinned ? 'برداشتن سنجاق' : 'سنجاق گفتگو'} title={active!.pinned ? 'برداشتن سنجاق' : 'سنجاق'} className="se-float-btn se-interactive se-pressable">{active!.pinned ? <PinOff size={17} /> : <Pin size={17} />}</button>
              {activeGroup.kind !== 'DIRECT' && <button onClick={() => setModal('members')} aria-label="اعضا" title="اعضا" className="se-float-btn se-interactive se-pressable"><UserPlus size={17} /></button>}
            </header>

            <div ref={scrollRef} className="flex-1 space-y-1.5 overflow-y-auto bg-canvas/60 p-3 sm:p-4" role="log" aria-live="polite" onClick={() => setSelectedMsg(null)}>
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-xs text-text-secondary"><MessageCircle size={38} className="opacity-25" /><p className="font-semibold">هنوز پیامی ثبت نشده است.</p><p className="text-[11px]">اولین پیام را بنویسید؛ با @ همکاران را منشن کنید.</p></div>
              )}
              {messages.map((m: any, i: number) => {
                const mine = m.senderId === me; const sender = userOf(m.senderId); const prev = messages[i - 1];
                const newDay = !prev || !sameDay(prev.createdAt, m.createdAt);
                const grouped = prev && !newDay && prev.senderId === m.senderId && !prev.deleted;
                const next = messages[i + 1]; const groupedNext = !!next && sameDay(next.createdAt, m.createdAt) && next.senderId === m.senderId && !next.deleted && !m.deleted;
                const reply = m.replyToId ? messages.find((x: any) => x.id === m.replyToId) : null;
                const others = activeGroup.memberIds.filter((id: string) => id !== m.senderId);
                const seen = others.filter((id: string) => m.readBy?.includes(id)).length;
                const sel = selectedMsg === m.id;
                return (
                  <React.Fragment key={m.id}>
                    {newDay && <div className="se-day-sticky my-3"><span>{dayOf(m.createdAt)}</span></div>}
                    {unreadAnchor.current?.msgId === m.id && <div className="my-2 flex items-center gap-2 text-[10px] font-bold text-coral"><span className="h-px flex-1 bg-coral/30" />پیام‌های جدید<span className="h-px flex-1 bg-coral/30" /></div>}
                    <div className={cn('flex items-end gap-2', mine ? 'flex-row-reverse' : 'flex-row', grouped ? 'mt-0.5' : 'mt-2')}>
                      {!mine && (grouped ? <span className="w-8 shrink-0" /> : <Avatar name={sender?.name || 'کاربر'} src={sender?.avatar} size="sm" className="shrink-0" />)}
                      <SwipeReply disabled={!!m.deleted} onReply={() => { setReplyTo(m); inputRef.current?.focus(); }} className={cn('flex max-w-[84%] flex-col', mine ? 'items-end' : 'items-start')}>
                        {!mine && !grouped && activeGroup.kind !== 'DIRECT' && <span className="mb-0.5 px-1 text-[10px] font-bold text-text-secondary">{sender?.name}</span>}
                        <div onClick={e => { e.stopPropagation(); if (!m.deleted) setSelectedMsg(sel ? null : m.id); }} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setSelectedMsg(sel ? null : m.id); }}
                          className={cn('relative cursor-pointer rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-subtle outline-none focus-visible:ring-2 focus-visible:ring-accent', m.deleted ? 'border border-dashed border-border bg-transparent italic text-text-secondary' : mine ? cn('bg-primary text-white', grouped && 'rounded-te-md', groupedNext && 'rounded-be-md', !groupedNext && 'rounded-be-md') : cn('border border-[var(--glass-border)] bg-[var(--glass-bg)] text-text-main backdrop-blur-md', grouped && 'rounded-ts-md', groupedNext && 'rounded-bs-md', !groupedNext && 'rounded-bs-md'))}>
                          {m.deleted ? 'این پیام حذف شد' : (
                            <>
                              {reply && <div className={cn('mb-1.5 rounded-lg border-s-2 px-2 py-1 text-[11px]', mine ? 'border-white/60 bg-white/15' : 'border-primary bg-primary/[.06]')}><b>{userOf(reply.senderId)?.name}</b><div className="line-clamp-2 opacity-90">{reply.deleted ? 'پیام حذف شد' : reply.content || 'پیوست'}</div></div>}
                              {m.content && <p className="whitespace-pre-wrap break-words">{renderContent(m, mine)}</p>}
                              {Array.isArray(m.entityMentions) && m.entityMentions.length > 0 && (
                                <div className="mt-2 grid w-full gap-1.5" aria-label="رکوردهای ارجاع‌شده">
                                  {m.entityMentions.map((ref: any) => {
                                    const entityType = String(ref.entityType || 'UNKNOWN');
                                    const Icon = ENTITY_ICON[entityType] || FileText;
                                    const pools: Record<string, any[]> = { CUSTOMER: (state as any).accounts || [], STAFF: state.users || [], CHECK: (state as any).cheques || [], INVOICE: (state as any).invoices || [], PRODUCT: (state as any).externalProducts || [], TASK: state.tasks || [], QUOTE: state.quotes || [] };
                                    const record = (pools[entityType] || []).find((x: any) => String(x.id ?? x.code ?? x.erpId ?? '') === String(ref.entityId));
                                    const subtitle = record ? String(record.status || record.dueDate || record.accountName || record.subtitle || ref.source || 'رکورد محلی') : String(ref.source || 'مرجع ذخیره‌شده');
                                    return <button key={`${entityType}:${ref.entityId}`} type="button" onClick={e => { e.stopPropagation(); goEntity({ type: entityType, id: ref.entityId }); }} className={cn('flex min-h-[44px] w-full items-center gap-2 rounded-xl border p-2 text-start', mine ? 'border-white/30 bg-white/10 text-white hover:bg-white/15' : 'border-border bg-canvas text-text-main hover:bg-sand')} aria-label={`بازکردن ${ref.displayText || entityType}`}>
                                      <Icon size={15} className="shrink-0" />
                                      <span className="min-w-0 flex-1"><b className="block truncate text-[11px]">{ref.displayText || ref.entityId}</b><span className="block truncate text-[10px] opacity-75">{entityType} · {subtitle}</span></span>
                                      <span className="text-[9px] opacity-70">{ref.source === 'ERP_MIRROR' ? 'آینه ERP' : 'CRM'}</span>
                                    </button>;
                                  })}
                                </div>
                              )}
                              {(m.attachments || []).map((a: any) => a.fileType?.startsWith('image/') ? (
                                <img key={a.id} src={a.base64Data} alt={a.fileName} className="mt-1.5 max-h-52 rounded-xl object-cover" />
                              ) : (
                                <a key={a.id} href={a.base64Data} download={a.fileName} onClick={e => e.stopPropagation()} className={cn('mt-1.5 flex min-h-[40px] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold', mine ? 'border-white/30 bg-white/10 text-white' : 'border-border bg-canvas text-text-main')}><Download size={14} /><span className="truncate" dir="ltr">{a.fileName}</span></a>
                              ))}
                              {m.relatedEntity && (() => { const I = ENTITY_ICON[m.relatedEntity.type] || FileText; return (
                                <button type="button" onClick={e => { e.stopPropagation(); goEntity(m.relatedEntity); }} className={cn('mt-1.5 flex min-h-[40px] w-full cursor-pointer items-center gap-2 rounded-xl border p-2 text-start text-[11px] font-bold', mine ? 'border-white/30 bg-white/10 text-white' : 'border-border bg-canvas text-text-main hover:bg-sand')}><I size={14} className="shrink-0" /><span className="truncate">{m.relatedEntity.display}</span></button>); })()}
                              {m.taskId && <button type="button" onClick={e => { e.stopPropagation(); navigate('/tasks'); }} className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success"><CheckSquare size={11} />وظیفه ساخته شد</button>}
                            </>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 px-1 text-[10px] text-text-secondary">
                          <span>{timeOf(m.createdAt)}</span>{m.editedAt && <span>· ویرایش‌شده</span>}
                          {mine && !m.deleted && (seen >= others.length && others.length > 0 ? <CheckCheck size={13} className="text-success" aria-label="دیده شد" /> : seen > 0 ? <span className="flex items-center gap-0.5"><CheckCheck size={13} aria-hidden />{fa(seen)}/{fa(others.length)}</span> : <Check size={13} aria-label="ارسال شد" />)}
                        </div>
                        {sel && !m.deleted && (
                          <div className="se-panel-enter mt-1 flex flex-wrap items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-card" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setReplyTo(m); setSelectedMsg(null); inputRef.current?.focus(); }} className="se-interactive flex min-h-[36px] cursor-pointer items-center gap-1 rounded-full px-3 text-[11px] font-bold text-text-main hover:bg-canvas"><Reply size={13} />پاسخ</button>
                            {m.content && !m.taskId && <button onClick={() => { openTaskFrom(m); setSelectedMsg(null); }} className="se-interactive flex min-h-[36px] cursor-pointer items-center gap-1 rounded-full px-3 text-[11px] font-bold text-text-main hover:bg-canvas"><ListPlus size={13} />ساخت وظیفه</button>}
                            {mine && m.content && <button onClick={() => { setEditing(m); setText(m.content); setSelectedMsg(null); inputRef.current?.focus(); }} className="se-interactive flex min-h-[36px] cursor-pointer items-center gap-1 rounded-full px-3 text-[11px] font-bold text-text-main hover:bg-canvas"><Pencil size={13} />ویرایش</button>}
                            {mine && <button onClick={() => removeMsg(m)} className="se-interactive flex min-h-[36px] cursor-pointer items-center gap-1 rounded-full px-3 text-[11px] font-bold text-danger hover:bg-danger-soft"><Trash2 size={13} />حذف</button>}
                          </div>
                        )}
                      </SwipeReply>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Composer */}
            <div className="relative space-y-2 border-t border-border bg-surface p-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
              {entityMentionOptions.length > 0 && (
                <ul role="listbox" aria-label="منشن موجودیت‌های CRM" className="se-panel-enter absolute inset-x-3 bottom-full mb-1 max-h-64 overflow-y-auto rounded-2xl border border-border bg-surface shadow-raised">
                  {entityMentionOptions.map(entity => <li key={`${entity.entityType}:${entity.entityId}`}><button role="option" aria-selected={false} onMouseDown={e => e.preventDefault()} onClick={() => pickEntityMention(entity)} className="flex min-h-[44px] w-full cursor-pointer items-center gap-2 px-3 text-start text-xs hover:bg-canvas"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary"><AtSign size={14} /></span><span className="min-w-0 flex-1"><b className="block truncate text-text-main">{entity.displayText}</b><span className="block truncate text-[10px] text-text-secondary">{entity.entityType} · {entity.subtitle || entity.entityId}</span></span><span className="text-[10px] text-text-secondary">{entity.source === 'ERP_MIRROR' ? 'نمایه ERP' : 'CRM'}</span></button></li>)}
                </ul>
              )}
              {mentionOptions.length > 0 && (
                <ul role="listbox" aria-label="منشن همکار" className="se-panel-enter absolute inset-x-3 bottom-full mb-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-raised">
                  {mentionOptions.map(u => <li key={u.id}><button role="option" aria-selected={false} onMouseDown={e => e.preventDefault()} onClick={() => pickMention(u)} className="flex min-h-[44px] w-full cursor-pointer items-center gap-2 px-3 text-start text-xs hover:bg-canvas"><Avatar name={u.name} src={u.avatar} size="sm" /><b className="text-text-main">{u.name}</b><span className="text-text-secondary" dir="ltr">@{u.username}</span></button></li>)}
                </ul>
              )}
              {(replyTo || editing) && (
                <div className="flex items-center justify-between rounded-xl border-s-2 border-primary bg-primary/[.06] px-3 py-1.5 text-[11px]">
                  <span className="min-w-0 truncate"><b className="text-primary">{editing ? 'ویرایش پیام' : `پاسخ به ${userOf(replyTo.senderId)?.name}`}</b> · {(editing || replyTo).content || 'پیوست'}</span>
                  <button aria-label="لغو" onClick={() => { setReplyTo(null); setEditing(null); setText(''); }} className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-ink/10"><X size={14} /></button>
                </div>
              )}
              {attachedEntity && <div className="flex items-center justify-between rounded-xl bg-gold/15 px-3 py-1.5 text-[11px] font-bold text-text-main"><span className="flex items-center gap-1.5 truncate"><Paperclip size={13} />{attachedEntity.display}</span><button aria-label="حذف رکورد" onClick={() => setAttachedEntity(undefined)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-full hover:bg-ink/10"><X size={14} /></button></div>}
              {files.length > 0 && <div className="flex flex-wrap gap-1.5">{files.map(f => <span key={f.id} className="flex items-center gap-1 rounded-full border border-border bg-canvas px-2.5 py-1 text-[11px] font-bold">{f.fileType?.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}<span className="max-w-[120px] truncate" dir="ltr">{f.fileName}</span><button aria-label="حذف فایل" onClick={() => setFiles(p => p.filter(x => x.id !== f.id))} className="cursor-pointer"><X size={12} /></button></span>)}</div>}
              {fileError && <p role="alert" className="text-[11px] font-bold text-danger">{fileError}</p>}
              <div className="flex items-end gap-1.5">
                <input ref={fileRef} type="file" multiple hidden onChange={e => readFiles(e.target.files)} />
                <button onClick={() => fileRef.current?.click()} disabled={files.length >= 4 || !!editing} aria-label="پیوست فایل" title="پیوست فایل (حداکثر ۴ فایل، هر کدام ۱٫۵ مگابایت)" className="se-float-btn se-interactive se-pressable shrink-0 disabled:opacity-40"><Paperclip size={18} /></button>
                <button onClick={() => { setPickQuery(''); setModal('record'); }} disabled={!!editing} aria-label="اتصال رکورد CRM" title="اتصال رکورد CRM" className="se-float-btn se-interactive se-pressable shrink-0 disabled:opacity-40"><Building2 size={18} /></button>
                <textarea ref={inputRef} rows={1} value={text} aria-label="متن پیام" placeholder="پیام بنویسید… (@ برای منشن، Enter برای ارسال)"
                  onChange={e => onTextChange(e.target.value, e.target.selectionStart)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } if (e.key === 'Escape') { setReplyTo(null); setEditing(null); setMentionQuery(null); } }}
                  className="min-h-[44px] max-h-[140px] flex-1 resize-none rounded-2xl border border-border bg-canvas px-4 py-3 text-xs font-medium text-text-main outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
                <button onClick={send} disabled={!text.trim() && !attachedEntity && files.length === 0} aria-label={editing ? 'ثبت ویرایش' : 'ارسال'} className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-primary text-white shadow-lux transition active:scale-95 disabled:opacity-40"><Send size={17} className="-scale-x-100" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden h-full flex-col items-center justify-center gap-3 p-8 text-center text-xs text-text-secondary md:flex"><MessageCircle size={44} className="opacity-20" /><p className="font-bold text-text-main">یک گفتگو را انتخاب کنید</p><p>یا با دکمه «پیام جدید» گفتگوی مستقیم شروع کنید.</p></div>
        )}
      </section>

      {/* ---------------- Modals ---------------- */}
      {modal === 'group' && (
        <Modal isOpen onClose={() => setModal(null)} title="ایجاد گروه کاری جدید" footer={<><Button variant="ghost" size="sm" onClick={() => setModal(null)}>انصراف</Button><Button variant="primary" size="sm" onClick={createGroup} disabled={!newGroupName.trim()}>ثبت گروه</Button></>}>
          <div className="space-y-4 text-xs">
            <Input label="نام گروه *" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="مثال: تیم فروش" required />
            <Input label="شرح و هدف گروه" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} placeholder="توضیحات کوتاه" />
            <fieldset><legend className="mb-1 font-bold text-text-main">انتخاب اعضا</legend>
              <div className="max-h-48 space-y-1 overflow-y-auto">{users.filter(u => u.id !== me).map(u => <label key={u.id} className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3 hover:bg-canvas"><input type="checkbox" className="accent-primary" checked={selectedMembers.includes(u.id)} onChange={e => setSelectedMembers(p => e.target.checked ? [...p, u.id] : p.filter(x => x !== u.id))} /><Avatar name={u.name} src={u.avatar} size="sm" /><span className="font-bold text-text-main">{u.name}</span></label>)}</div>
            </fieldset>
          </div>
        </Modal>
      )}
      {modal === 'dm' && (
        <Modal isOpen onClose={() => setModal(null)} title="پیام مستقیم جدید" footer={<Button variant="ghost" size="sm" onClick={() => setModal(null)}>بستن</Button>}>
          <div className="space-y-3 text-xs">
            <Input label="جستجوی همکار" value={pickQuery} onChange={e => setPickQuery(e.target.value)} placeholder="نام یا نام کاربری" />
            <div className="max-h-72 space-y-1 overflow-y-auto">{peopleForDM.map(u => <button key={u.id} onClick={() => startDirect(u.id)} className="flex min-h-[48px] w-full cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3 text-start hover:bg-canvas"><Avatar name={u.name} src={u.avatar} size="sm" /><span><b className="block text-text-main">{u.name}</b><span className="text-[10px] text-text-secondary" dir="ltr">@{u.username}</span></span></button>)}{peopleForDM.length === 0 && <p className="py-6 text-center text-text-secondary">همکاری پیدا نشد.</p>}</div>
          </div>
        </Modal>
      )}
      {modal === 'members' && activeGroup && (
        <Modal isOpen onClose={() => setModal(null)} title={`اعضای گروه: ${activeGroup.name}`} footer={<Button variant="primary" size="sm" onClick={() => setModal(null)}>بستن</Button>}>
          <div className="max-h-80 space-y-2 overflow-y-auto text-xs">
            {users.map(u => { const isM = activeGroup.memberIds.includes(u.id); return (
              <div key={u.id} className="flex min-h-[48px] items-center justify-between rounded-xl border border-border bg-canvas p-2.5">
                <span className="flex items-center gap-2"><Avatar name={u.name} src={u.avatar} size="sm" /><span><b className="block text-text-main">{u.name}</b><span className="text-[10px] text-text-secondary" dir="ltr">@{u.username}</span></span></span>
                {canManage && <Button size="sm" variant={isM ? 'outline' : 'primary'} onClick={() => toggleMember(u.id)}>{isM ? 'حذف عضویت' : 'افزودن'}</Button>}
                {!canManage && isM && <span className="text-[10px] font-bold text-success">عضو</span>}
              </div>); })}
          </div>
        </Modal>
      )}
      {modal === 'record' && (
        <Modal isOpen onClose={() => setModal(null)} title="اتصال رکورد CRM به پیام" footer={<Button variant="ghost" size="sm" onClick={() => setModal(null)}>انصراف</Button>}>
          <div className="space-y-3 text-xs">
            <Input label="جستجو در مشتریان، وظایف، فرصت‌ها، پیش‌فاکتورها و پرونده‌ها" value={pickQuery} onChange={e => setPickQuery(e.target.value)} />
            <div className="max-h-72 space-y-1 overflow-y-auto">{recordOptions.map(o => { const I = ENTITY_ICON[o.type]; return <button key={`${o.type}-${o.id}`} onClick={() => { setAttachedEntity(o); setModal(null); }} className="flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-start hover:bg-canvas"><I size={15} className="shrink-0 text-primary" /><span className="truncate font-bold text-text-main">{o.display}</span></button>; })}{recordOptions.length === 0 && <p className="py-6 text-center text-text-secondary">رکوردی پیدا نشد.</p>}</div>
          </div>
        </Modal>
      )}
      {modal === 'task' && taskFrom && (
        <Modal isOpen onClose={() => setModal(null)} title="ساخت وظیفه از پیام" footer={<><Button variant="ghost" size="sm" onClick={() => setModal(null)}>انصراف</Button><Button variant="primary" size="sm" onClick={createTask}>ثبت وظیفه</Button></>}>
          <div className="space-y-3 text-xs">
            <p className="rounded-xl bg-canvas p-3 text-text-main">{taskFrom.content}</p>
            <label className="block font-bold text-text-main">مسئول انجام<select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-xl border border-border bg-canvas px-3 font-medium">{(members.length ? members : users).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block font-bold text-text-main">مهلت<input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-xl border border-border bg-canvas px-3 font-medium" /></label>
              <label className="block font-bold text-text-main">اولویت<select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-xl border border-border bg-canvas px-3 font-medium"><option value="LOW">کم</option><option value="NORMAL">معمولی</option><option value="HIGH">بالا</option><option value="URGENT">فوری</option></select></label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** کشیدن حباب برای پاسخ: فیزیک فنری (رها کردن = برگشت کشسان). فقط transform. */
function SwipeReply({ children, onReply, disabled, className }: { children: React.ReactNode; onReply: () => void; disabled?: boolean; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null); const start = React.useRef<{ x: number; y: number } | null>(null); const fired = React.useRef(false);
  const set = (dx: number, released = false) => { const el = ref.current; if (!el) return; el.classList.toggle('is-released', released); el.style.transform = dx ? `translateX(${dx}px)` : ''; };
  return (
    <div ref={ref} className={cn('se-swipe', className)}
      onPointerDown={e => { if (disabled || e.pointerType === 'mouse' || (e.target as HTMLElement).closest('button,a,input,textarea')) return; start.current = { x: e.clientX, y: e.clientY }; fired.current = false; set(0, false); }}
      onPointerMove={e => { const s = start.current; if (!s) return; const dx = e.clientX - s.x; if (Math.abs(e.clientY - s.y) > 24 && Math.abs(dx) < 12) { start.current = null; set(0, true); return; } const lim = Math.max(-72, Math.min(72, dx * 0.6)); set(lim); if (Math.abs(lim) > 44 && !fired.current) { fired.current = true; haptics.light(); } }}
      onPointerUp={() => { if (fired.current) onReply(); start.current = null; set(0, true); }} onPointerCancel={() => { start.current = null; set(0, true); }}>
      {children}
    </div>
  );
}
