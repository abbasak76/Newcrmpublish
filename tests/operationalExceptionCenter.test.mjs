import assert from 'node:assert/strict';
import { buildOperationalExceptionCenter } from '../src/services/operationalExceptionCenter.ts';
const now = new Date('2026-10-29T12:00:00.000Z');
const state = {
  accounts: [{ id: 'A1', name: 'مشتری نمونه', creditLimit: 1000, balance: 500, phone: '000' }],
  invoices: [{ id: 'I1', customerId: 'A1', accountId: 'A1', totalAmount: 500, paidAmount: 0, balance: 500, status: 'UNPAID', date: '2026-09-01', dueDate: '2026-09-01' }],
  cheques: [{ id: 'C1', accountId: 'A1', amount: 500, status: 'BOUNCED' }],
  tasks: [
    { id: 'T1', title: 'وظیفه متوقف', status: 'BLOCKED', blockReason: 'انتظار', dueDate: '2026-10-20', assigneeId: 'U1' },
    { id: 'T2', title: 'وظیفه سالم', status: 'OPEN', dueDate: '2026-11-20', assigneeId: 'U1', priority: 'NORMAL' },
    { id: 'T3', title: 'وظیفه بسته', status: 'COMPLETED', dueDate: '', assigneeId: '' }
  ],
  settings: { orgConfig: { defaultCreditLimit: 1000 } }
};
const profiles = [{ accountId: 'A1', accountName: 'مشتری نمونه', overdueBalance: 500, maxDaysOverdue: 58, overdueInvoices: [{ id: 'I1' }], riskLevel: 'CRITICAL', riskScore: 80, bouncedChequesCount: 1, recommendedAction: 'پیگیری فوری', activePromises: [{ id: 'P1', promisedDate: '2026-10-01', promisedAmount: 250, status: 'BROKEN' }] }];
const items = buildOperationalExceptionCenter(state, now, profiles);
assert.ok(items.some(item => item.id === 'TASK:T1'));
assert.ok(!items.some(item => item.id === 'TASK:T2'));
assert.ok(!items.some(item => item.id === 'TASK:T3'));
assert.ok(items.some(item => item.kind === 'OVERDUE_RECEIVABLE' && item.accountId === 'A1'));
assert.ok(items.some(item => item.kind === 'BOUNCED_CHEQUE' && item.severity === 'CRITICAL'));
assert.ok(items.some(item => item.kind === 'BROKEN_COLLECTION_PROMISE' && item.id === 'PROMISE:P1'), 'explicitly broken promises must appear even when due date comparison is not needed');
assert.equal(items[0].severity, 'CRITICAL');
assert.ok(items.every(item => item.source === 'TASK_WORKFLOW' || item.source === 'COLLECTION_ENGINE'));
console.log('operationalExceptionCenter.test.mjs: PASS (8 assertions)');
