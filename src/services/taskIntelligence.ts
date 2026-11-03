import { OPERATIONS_CONFIG } from '../config/operations.ts';

export type OperationalTaskKind = 'FINANCE' | 'LOGISTICS' | 'SALES' | 'GENERAL';
export interface TaskLike {
  id?: string; title?: string; description?: string; status?: string; priority?: string;
  dueDate?: string; targetDate?: string; assigneeId?: string; assigneeType?: string;
  urgencyScore?: number; estimatedMinutes?: number; amountDue?: number; debtAgeDays?: number;
  customerImportance?: number; routeDistanceKm?: number; deliveryDeadlineHours?: number;
  kind?: OperationalTaskKind; slaDueAt?: string; [key: string]: unknown;
}
export interface CapacityConfig { maxDailyTasks?: number; maxDailyScore?: number; workingDays?: number[]; workingHoursStart?: string; workingHoursEnd?: string; }
export interface CapacityResult { fits: boolean; currentCount: number; incomingCount: number; currentScore: number; incomingScore: number; maxDailyTasks: number; maxDailyScore: number; }
export interface SlotSuggestion { date: string; capacity: CapacityResult; scannedDays: number; }

export function classifyTask(task: Pick<TaskLike, 'title' | 'description' | 'kind'>): OperationalTaskKind {
  if (task.kind) return task.kind;
  const text = `${task.title || ''} ${task.description || ''}`.toLocaleLowerCase('fa-IR');
  if (/چک|وصول|مطالبات|بدهی|نقدی|پرداخت|مانده حساب|تسویه/.test(text)) return 'FINANCE';
  if (/پوز|دستگاه|مرجوع|تحویل بار|انبار|حواله|ارسال بار|توزیع/.test(text)) return 'LOGISTICS';
  if (/ویزیت|فروش|پیش.?فاکتور|مذاکره|سفارش|مشتری/.test(text)) return 'SALES';
  return 'GENERAL';
}

export function scoreTask(task: TaskLike): number {
  const priority = OPERATIONS_CONFIG.taskWeights[String(task.priority || 'NORMAL').toUpperCase()] || 3;
  const amount = Math.max(0, Number(task.amountDue || 0));
  const debtAge = Math.max(0, Number(task.debtAgeDays || 0));
  const customerImportance = Math.max(0, Math.min(5, Number(task.customerImportance || 0)));
  const routeDistance = Math.max(0, Number(task.routeDistanceKm || 0));
  const deliveryDeadline = Number(task.deliveryDeadlineHours);
  const overdue = task.dueDate ? Math.max(0, (Date.now() - new Date(task.dueDate).getTime()) / 86_400_000) : 0;
  const score = priority * 5 + Math.min(25, Math.log10(amount + 1) * 3) + Math.min(20, debtAge * 0.5)
    + customerImportance * 4 + (Number.isFinite(deliveryDeadline) ? Math.max(0, 20 - deliveryDeadline * 2) : 0)
    + Math.min(10, routeDistance * 0.2) + Math.min(20, overdue * 3);
  return Math.round(Math.min(100, Math.max(0, score)));
}

function dateKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function taskDate(task: TaskLike): string { const raw = task.targetDate || task.dueDate || ''; if (!raw) return ''; const d = new Date(raw); return Number.isNaN(d.getTime()) ? raw.slice(0,10) : dateKey(d); }
function active(task: TaskLike): boolean { return !['COMPLETED','CANCELLED','CANCELED','VOID','DELETED'].includes(String(task.status || '').toUpperCase()); }

export function checkDailyCapacity(tasks: readonly TaskLike[], assigneeId: string, date: string, incoming: readonly TaskLike[] = [], config: CapacityConfig = {}): CapacityResult {
  const maxDailyTasks = Math.max(1, config.maxDailyTasks ?? OPERATIONS_CONFIG.defaultDailyTaskCapacity);
  const maxDailyScore = Math.max(1, config.maxDailyScore ?? OPERATIONS_CONFIG.defaultDailyScoreCapacity);
  const assigned = tasks.filter(t => active(t) && t.assigneeId === assigneeId && taskDate(t) === date);
  const currentCount = assigned.length;
  const incomingCount = incoming.length;
  const currentScore = assigned.reduce((sum, t) => sum + (Number(t.urgencyScore) || scoreTask(t)), 0);
  const incomingScore = incoming.reduce((sum, t) => sum + (Number(t.urgencyScore) || scoreTask(t)), 0);
  return { fits: currentCount + incomingCount <= maxDailyTasks && currentScore + incomingScore <= maxDailyScore, currentCount, incomingCount, currentScore, incomingScore, maxDailyTasks, maxDailyScore };
}

export function findNextAvailableSlot(tasks: readonly TaskLike[], assigneeId: string, requestedDate: string, incoming: readonly TaskLike[] = [], config: CapacityConfig = {}, maxScanDays = 90): SlotSuggestion | null {
  const start = new Date(`${requestedDate}T12:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const workingDays = config.workingDays || [...OPERATIONS_CONFIG.defaultWorkingDays];
  for (let offset = 0; offset <= maxScanDays; offset++) {
    const candidate = new Date(start); candidate.setDate(candidate.getDate() + offset);
    if (!workingDays.includes(candidate.getDay())) continue;
    const date = dateKey(candidate);
    const capacity = checkDailyCapacity(tasks, assigneeId, date, incoming, config);
    if (capacity.fits) return { date, capacity, scannedDays: offset };
  }
  return null;
}

export function assignSla(task: TaskLike, createdAt = new Date()): TaskLike {
  const kind = classifyTask(task);
  const minutes = OPERATIONS_CONFIG.defaultSlaMinutes[kind] || OPERATIONS_CONFIG.defaultSlaMinutes.GENERAL;
  return { ...task, kind, urgencyScore: task.urgencyScore ?? scoreTask(task), slaDueAt: task.slaDueAt || new Date(createdAt.getTime() + minutes * 60_000).toISOString() };
}

export function groupMissionBatch<T extends TaskLike>(tasks: readonly T[], regionOf: (task: T) => string | undefined): Array<{ region: string; tasks: T[] }> {
  const groups = new Map<string, T[]>();
  for (const task of tasks) {
    if (!active(task)) continue;
    const region = regionOf(task)?.trim() || 'UNASSIGNED_REGION';
    const list = groups.get(region) || []; list.push(task); groups.set(region, list);
  }
  return [...groups.entries()].map(([region, items]) => ({ region, tasks: items.sort((a,b) => (Number(b.urgencyScore)||scoreTask(b)) - (Number(a.urgencyScore)||scoreTask(a))) }));
}

/** Proposes delegation/deferral only; it never silently reassigns or changes dates. */
export function proposeOverflow(tasks: readonly TaskLike[], assigneeId: string, date: string, incoming: readonly TaskLike[], config: CapacityConfig = {}, candidates: readonly string[] = []): { capacity: CapacityResult; nextSlot: SlotSuggestion | null; suggestedDelegate?: string } {
  const capacity = checkDailyCapacity(tasks, assigneeId, date, incoming, config);
  if (capacity.fits) return { capacity, nextSlot: null };
  const nextSlot = findNextAvailableSlot(tasks, assigneeId, date, incoming, config);
  const suggestedDelegate = candidates.find(id => id !== assigneeId && checkDailyCapacity(tasks, id, date, incoming, config).fits);
  return { capacity, nextSlot, ...(suggestedDelegate ? { suggestedDelegate } : {}) };
}

export type TaskSlaState = 'COMPLETED' | 'BREACHED' | 'AT_RISK' | 'ON_TRACK' | 'UNSCHEDULED';
export interface TaskSlaAssessment { state: TaskSlaState; dueAt?: string; minutesRemaining?: number; label: string; reason: string; }

/** Runtime assessment is derived from persisted task dates; it does not mutate records or pretend a background scheduler ran. */
export function assessTaskSla(task: TaskLike, now = new Date()): TaskSlaAssessment {
  if (['COMPLETED', 'CANCELLED', 'CANCELED', 'VOID', 'DELETED'].includes(String(task.status || '').toUpperCase())) {
    return { state: 'COMPLETED', label: 'بسته‌شده', reason: 'وظیفه در وضعیت فعال قرار ندارد.' };
  }
  const dueAt = task.slaDueAt || task.dueDate || task.targetDate;
  if (!dueAt) return { state: 'UNSCHEDULED', label: 'بدون مهلت', reason: 'برای ارزیابی SLA باید مهلت پیگیری تعیین شود.' };
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return { state: 'UNSCHEDULED', label: 'مهلت نامعتبر', reason: 'تاریخ ثبت‌شده قابل تفسیر نیست؛ اصلاح مهلت لازم است.' };
  const minutesRemaining = Math.round((due.getTime() - now.getTime()) / 60_000);
  if (minutesRemaining < 0) return { state: 'BREACHED', dueAt, minutesRemaining, label: 'مهلت گذشته', reason: `مهلت ${Math.abs(minutesRemaining)} دقیقه پیش گذشته است.` };
  if (minutesRemaining <= 120) return { state: 'AT_RISK', dueAt, minutesRemaining, label: 'در آستانه تأخیر', reason: `حدود ${minutesRemaining} دقیقه تا پایان مهلت باقی است.` };
  return { state: 'ON_TRACK', dueAt, minutesRemaining, label: 'در مسیر انجام', reason: `حدود ${minutesRemaining} دقیقه تا پایان مهلت باقی است.` };
}

export interface TaskNextAction { key: 'CLOSE' | 'ESCALATE' | 'START' | 'FOLLOW_UP' | 'SCHEDULE'; title: string; reason: string; urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; }
/** Explainable, rule-based recommendation. It suggests work; it never sends, reassigns, or escalates automatically. */
export function recommendTaskNextAction(task: TaskLike, now = new Date()): TaskNextAction {
  const status = String(task.status || '').toUpperCase();
  const sla = assessTaskSla(task, now);
  if (['COMPLETED', 'CANCELLED', 'CANCELED', 'VOID', 'DELETED'].includes(status)) return { key: 'CLOSE', title: 'بایگانی و مرور نتیجه', reason: 'وظیفه فعال نیست؛ در صورت نیاز نتیجه و شواهد را مرور کنید.', urgency: 'LOW' };
  if (sla.state === 'BREACHED') return { key: 'ESCALATE', title: 'پیگیری فوری و بررسی ارجاع', reason: `${sla.reason} مسئول و علت تأخیر را بررسی کنید؛ ارجاع خودکار انجام نمی‌شود.`, urgency: 'CRITICAL' };
  if (sla.state === 'AT_RISK') return { key: 'FOLLOW_UP', title: 'پیگیری پیش از پایان مهلت', reason: `${sla.reason} وضعیت کار را به‌روزرسانی کنید یا برای ارجاع تصمیم بگیرید.`, urgency: 'HIGH' };
  if (sla.state === 'UNSCHEDULED') return { key: 'SCHEDULE', title: 'تعیین مهلت و SLA', reason: sla.reason, urgency: 'MEDIUM' };
  if (status === 'IN_PROGRESS') return { key: 'FOLLOW_UP', title: 'ثبت پیشرفت و مانع احتمالی', reason: 'کار در جریان است؛ آخرین نتیجه، مانع و اقدام بعدی را ثبت کنید.', urgency: 'MEDIUM' };
  return { key: 'START', title: 'شروع کار و تأیید مسئولیت', reason: 'وظیفه باز است؛ مسئول باید شروع یا زمان پیگیری را تأیید کند.', urgency: 'MEDIUM' };
}

export function rankTasksForAttention<T extends TaskLike>(tasks: readonly T[], now = new Date()): Array<T & { attentionScore: number; slaAssessment: TaskSlaAssessment; nextAction: TaskNextAction }> {
  return tasks.filter(active).map(task => {
    const slaAssessment = assessTaskSla(task, now);
    const nextAction = recommendTaskNextAction(task, now);
    const urgencyBoost = nextAction.urgency === 'CRITICAL' ? 50 : nextAction.urgency === 'HIGH' ? 30 : nextAction.urgency === 'MEDIUM' ? 10 : 0;
    return { ...task, attentionScore: Math.min(150, scoreTask(task) + urgencyBoost), slaAssessment, nextAction };
  }).sort((a, b) => b.attentionScore - a.attentionScore);
}
