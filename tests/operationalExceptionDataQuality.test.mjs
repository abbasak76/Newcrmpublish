import assert from 'node:assert/strict';
import { buildOperationalExceptionCenter } from '../src/services/operationalExceptionCenter.ts';
const now = new Date('2026-10-29T12:00:00.000Z');
const state = { tasks: [
  { id: 'LIVE', title: 'فعال', status: 'BLOCKED', blockReason: 'منتظر', dueDate: '2026-10-20' },
  { id: 'DELETED', title: 'حذف نرم‌افزاری', status: 'BLOCKED', blockReason: 'منتظر', dueDate: '2026-10-20', isDeleted: true },
] };
const profiles = [
  { accountId: 'A1', accountName: 'مشتری', overdueBalance: 120, maxDaysOverdue: 20, overdueInvoices: [{}], riskLevel: 'HIGH', riskScore: 50, bouncedChequesCount: 1, recommendedAction: 'پیگیری', activePromises: [] },
  { accountId: 'A1', accountName: 'تکراری', overdueBalance: 999, maxDaysOverdue: 90, overdueInvoices: [{}], riskLevel: 'CRITICAL', riskScore: 99, bouncedChequesCount: 9, recommendedAction: 'نامعتبر', activePromises: [] },
  { accountId: 'A2', accountName: 'مقادیر خراب', overdueBalance: Number.NaN, maxDaysOverdue: Number.NaN, overdueInvoices: null, riskLevel: 'CRITICAL', riskScore: Number.NaN, bouncedChequesCount: Number.NaN, recommendedAction: 'پیگیری', activePromises: [{ id: 'P-NAN', promisedDate: 'invalid-date', promisedAmount: Number.NaN, status: 'PENDING' }] },
  { accountId: '', accountName: 'بدون شناسه', overdueBalance: 100, maxDaysOverdue: 30, overdueInvoices: [{}], riskLevel: 'HIGH', riskScore: 20, bouncedChequesCount: 1, recommendedAction: 'پیگیری', activePromises: [] },
];
const items = buildOperationalExceptionCenter(state, now, profiles);
assert.ok(items.some(x => x.id === 'TASK:LIVE'));
assert.ok(!items.some(x => x.id === 'TASK:DELETED'), 'soft-deleted task must not surface');
assert.equal(items.filter(x => x.accountId === 'A1').length, 3, 'duplicate account profile must not duplicate exception signals');
assert.ok(!items.some(x => x.accountId === 'A2'), 'malformed numeric signals must fail closed');
assert.ok(items.every(x => x.amount === undefined || Number.isFinite(x.amount)), 'exception amounts must be finite');
assert.ok(items.every(x => x.id !== 'RECEIVABLE:' && x.id !== 'RISK:' && x.id !== 'BOUNCED:'), 'records without account IDs must be ignored');
console.log('operationalExceptionDataQuality.test.mjs: PASS (6 assertions)');
