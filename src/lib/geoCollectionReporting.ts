import type { Payment, Task } from '../types';

export interface CollectionReportRow {
  assigneeId: string;
  assigneeName: string;
  total: number;
  open: number;
  completed: number;
  overdue: number;
  outcomes: Record<string, number>;
  collectedAmount: number;
  distinctPayments: number;
}
export interface CollectionReportDetail {
  taskId: string;
  title: string;
  customerId: string;
  customerName: string;
  assigneeName: string;
  status: string;
  dueDate: string;
  outcome: string;
  recordedAt: string;
  paymentId: string;
  collectedAmount: number;
}
export interface CollectionReport {
  total: number;
  open: number;
  completed: number;
  overdue: number;
  collectedAmount: number;
  distinctPayments: number;
  outcomes: Record<string, number>;
  byAssignee: CollectionReportRow[];
  details: CollectionReportDetail[];
}

const latestResult = (task: any) => {
  const history = Array.isArray(task.resultHistory) ? task.resultHistory : [];
  return history.length ? history[history.length - 1] : {
    outcome: task.result,
    paymentId: task.paymentId,
    recordedAt: task.resultAt,
    collectedAmount: task.collectedAmount,
  };
};

/**
 * Build a zone-scoped report from the tasks already visible to the caller.
 * Collection amounts are recalculated from CLEARED payment records, never trusted from task fields.
 * A payment is counted once in the report even if multiple tasks reference it.
 */
export function buildGeoCollectionReport(
  tasks: Array<Partial<Task> & Record<string, any>>,
  payments: Payment[] = [],
  users: Array<{ id: string; name?: string }> = [],
  now: Date = new Date(),
  customers: Array<{ id: string; name?: string }> = [],
): CollectionReport {
  const paymentById = new Map(payments.map(payment => [payment.id, payment]));
  const userNameById = new Map(users.map(user => [user.id, user.name || user.id]));
  const customerNameById = new Map(customers.map(customer => [customer.id, customer.name || customer.id]));
  const countedPaymentIds = new Set<string>();
  const outcomes: Record<string, number> = {};
  const rows = new Map<string, CollectionReportRow>();
  const details: CollectionReportDetail[] = [];
  let open = 0;
  let completed = 0;
  let overdue = 0;
  let collectedAmount = 0;
  const orderedTasks = [...tasks].sort((a, b) => {
    const aTime = Date.parse(String(latestResult(a)?.recordedAt || a.resultAt || a.createdAt || '')) || 0;
    const bTime = Date.parse(String(latestResult(b)?.recordedAt || b.resultAt || b.createdAt || '')) || 0;
    return bTime - aTime; // when a payment is linked to multiple tasks, attribute it once to the latest recorded result
  });

  for (const task of orderedTasks) {
    const assigneeId = String(task.assigneeId || 'UNASSIGNED');
    if (!rows.has(assigneeId)) rows.set(assigneeId, {
      assigneeId,
      assigneeName: userNameById.get(assigneeId) || (assigneeId === 'UNASSIGNED' ? 'بدون مسئول' : assigneeId),
      total: 0, open: 0, completed: 0, overdue: 0, outcomes: {}, collectedAmount: 0, distinctPayments: 0,
    });
    const row = rows.get(assigneeId)!;
    row.total += 1;
    const isCompleted = task.status === 'COMPLETED';
    const isClosed = isCompleted || task.status === 'CANCELLED';
    if (isCompleted) { completed += 1; row.completed += 1; }
    if (!isClosed) { open += 1; row.open += 1; }
    const due = task.dueDate ? new Date(`${String(task.dueDate).slice(0, 10)}T23:59:59`) : null;
    if (!isClosed && due && Number.isFinite(due.getTime()) && due.getTime() < now.getTime()) { overdue += 1; row.overdue += 1; }

    const result = latestResult(task);
    const outcome = typeof result?.outcome === 'string' && result.outcome ? result.outcome : '';
    if (outcome) {
      outcomes[outcome] = (outcomes[outcome] || 0) + 1;
      row.outcomes[outcome] = (row.outcomes[outcome] || 0) + 1;
    }

    let taskCollectedAmount = 0;
    let validPaymentId = '';
    if (outcome === 'PAYMENT_RECORDED' && result?.paymentId) {
      const paymentId = String(result.paymentId);
      const payment = paymentById.get(paymentId);
      const taskCustomerId = String(task.customerId || task.accountId || '');
      const paymentCustomerId = String(payment?.customerId || payment?.accountId || '');
      if (!countedPaymentIds.has(paymentId) && payment && payment.status === 'CLEARED' && Number.isFinite(payment.amount) && payment.amount > 0 && taskCustomerId && taskCustomerId === paymentCustomerId) {
        countedPaymentIds.add(paymentId);
        validPaymentId = paymentId;
        taskCollectedAmount = payment.amount;
        collectedAmount += payment.amount;
        row.collectedAmount += payment.amount;
        row.distinctPayments += 1;
      }
    }
    const customerId = String(task.customerId || task.accountId || '');
    details.push({
      taskId: String(task.id || ''),
      title: String(task.title || 'وظیفه وصول'),
      customerId,
      customerName: customerNameById.get(customerId) || customerId || 'مشتری نامشخص',
      assigneeName: row.assigneeName,
      status: String(task.status || 'UNKNOWN'),
      dueDate: String(task.dueDate || ''),
      outcome,
      recordedAt: String(result?.recordedAt || task.resultAt || ''),
      paymentId: validPaymentId,
      collectedAmount: taskCollectedAmount,
    });
  }

  return {
    total: tasks.length,
    open,
    completed,
    overdue,
    collectedAmount,
    distinctPayments: countedPaymentIds.size,
    outcomes,
    byAssignee: [...rows.values()].sort((a, b) => b.overdue - a.overdue || b.open - a.open || a.assigneeName.localeCompare(b.assigneeName, 'fa')),
    details: details.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt) || a.customerName.localeCompare(b.customerName, 'fa')),
  };
}


/** Filter report tasks by latest-result date; tasks without a result use creation date. Dates are inclusive ISO calendar dates. */
export function filterCollectionTasksByPeriod(
  tasks: Array<Partial<Task> & Record<string, any>>,
  dateFrom = '',
  dateTo = '',
): Array<Partial<Task> & Record<string, any>> {
  if (!dateFrom && !dateTo) return [...tasks];
  return tasks.filter(task => {
    const result = latestResult(task);
    const day = String(result?.recordedAt || task.resultAt || task.createdAt || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
    return (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
  });
}

const csvEscape = (value: unknown) => {
  let text = String(value ?? '');
  if (/^[\s]*[=+@\-]/.test(text)) text = `'${text}`; // prevent spreadsheet formula execution for untrusted labels
  return `"${text.replace(/"/g, '""')}"`;
};
const csv = (rows: unknown[][]) => '\uFEFF' + rows.map(row => row.map(csvEscape).join(',')).join('\r\n');

export function collectionReportToCsv(report: CollectionReport): string {
  const header = ['مسئول', 'کل وظایف', 'باز', 'تکمیل‌شده', 'معوق', 'مبلغ وصول معتبر', 'تعداد پرداخت یکتا'];
  const rows = report.byAssignee.map(row => [row.assigneeName, row.total, row.open, row.completed, row.overdue, row.collectedAmount, row.distinctPayments]);
  return csv([header, ...rows]);
}

export function collectionReportDetailsToCsv(report: CollectionReport): string {
  const header = ['شناسه وظیفه', 'عنوان', 'شناسه مشتری', 'مشتری', 'مسئول', 'وضعیت', 'مهلت', 'نتیجه آخر', 'زمان ثبت نتیجه', 'شناسه پرداخت معتبر یکتا', 'مبلغ وصول معتبر'];
  const rows = report.details.map(row => [row.taskId, row.title, row.customerId, row.customerName, row.assigneeName, row.status, row.dueDate, row.outcome, row.recordedAt, row.paymentId, row.collectedAmount]);
  return csv([header, ...rows]);
}
