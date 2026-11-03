import assert from 'node:assert/strict';
import { buildGeoCollectionReport, collectionReportToCsv, collectionReportDetailsToCsv, filterCollectionTasksByPeriod } from '../src/lib/geoCollectionReporting.ts';
const now = new Date('2026-10-27T12:00:00Z');
const payments = [
  { id: 'p1', customerId: 'c1', amount: 1000, status: 'CLEARED' },
  { id: 'p2', customerId: 'c2', amount: 2500, status: 'PENDING' },
  { id: 'p3', customerId: 'c3', amount: 700, status: 'CLEARED' },
];
const tasks = [
  { id: 't1', taskType: 'COLLECTION', source: 'GEO_ZONE', customerId: 'c1', assigneeId: 'u1', status: 'COMPLETED', resultHistory: [{ outcome: 'PAYMENT_RECORDED', paymentId: 'p1', recordedAt: '2026-10-26T10:00:00Z' }] },
  { id: 't2', taskType: 'COLLECTION', source: 'GEO_ZONE', customerId: 'c1', assigneeId: 'u2', status: 'COMPLETED', resultHistory: [{ outcome: 'PAYMENT_RECORDED', paymentId: 'p1', recordedAt: '2026-10-26T11:00:00Z' }] },
  { id: 't3', taskType: 'COLLECTION', source: 'GEO_ZONE', customerId: 'c2', assigneeId: 'u1', status: 'OPEN', dueDate: '2026-10-20', result: 'PROMISE_TO_PAY' },
  { id: 't4', taskType: 'COLLECTION', source: 'GEO_ZONE', customerId: 'c3', assigneeId: 'u1', status: 'OPEN', dueDate: '2026-11-02', result: 'NO_PAYMENT' },
  { id: 't5', taskType: 'COLLECTION', source: 'GEO_ZONE', customerId: 'c3', assigneeId: 'u3', status: 'CANCELLED', result: 'NO_SHOW' },
];
const report = buildGeoCollectionReport(tasks, payments, [{ id: 'u1', name: 'سرپرست' }, { id: 'u2', name: 'فروشنده' }], now, [{ id: 'c1', name: 'مشتری یک' }, { id: 'c2', name: 'مشتری دو' }, { id: 'c3', name: 'مشتری سه' }]);
assert.equal(report.total, 5);
assert.equal(report.open, 2);
assert.equal(report.completed, 2);
assert.equal(report.overdue, 1);
assert.equal(report.collectedAmount, 1000, 'same payment is counted only once across tasks');
assert.equal(report.distinctPayments, 1);
assert.equal(report.outcomes.PAYMENT_RECORDED, 2, 'outcomes count tasks, not payments');
assert.equal(report.byAssignee.find(row => row.assigneeId === 'u1').overdue, 1);
assert.equal(report.byAssignee.find(row => row.assigneeId === 'u1').collectedAmount, 0, 'duplicate payment is not attributed twice');
assert.equal(report.byAssignee.find(row => row.assigneeId === 'u2').collectedAmount, 1000, 'unique payment is attributed to the latest recorded result');
assert.equal(report.details.length, 5, 'detail report preserves one row per task');
assert.equal(report.details.find(row => row.taskId === 't2').customerName, 'مشتری یک', 'customer names are resolved from visible customer records');
assert.equal(report.details.find(row => row.taskId === 't2').collectedAmount, 1000, 'valid payment appears on only the attributed detail row');
assert.equal(report.details.find(row => row.taskId === 't1').collectedAmount, 0, 'duplicate payment is not repeated in detail export');
const invalidPaymentReport = buildGeoCollectionReport([{ ...tasks[0], customerId: 'other' }], payments, [], now);
assert.equal(invalidPaymentReport.collectedAmount, 0, 'payment for another customer is rejected');
assert.equal(buildGeoCollectionReport([{ ...tasks[0], resultHistory: [{ outcome: 'PAYMENT_RECORDED', paymentId: 'p2' }] }], payments, [], now).collectedAmount, 0, 'pending payment is rejected');
assert.ok(collectionReportToCsv(report).startsWith('\uFEFF'));
assert.ok(collectionReportToCsv(report).includes('سرپرست'));
assert.ok(collectionReportToCsv(buildGeoCollectionReport([{ id: 'unsafe', assigneeId: '=1+1', status: 'OPEN' }], [], [], now)).includes("'=1+1"), 'CSV formula injection is neutralized');
console.log('PASS: 21 assertions (zone collection report aggregation and CSV export)');
