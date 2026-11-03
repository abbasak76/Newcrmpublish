import assert from 'node:assert/strict';
import { reconcileReceivables } from '../src/lib/receivableReconciliation.ts';
const invoices = [
  { id: 'i1', invoiceNumber: '1001', customerId: 'c1', totalAmount: 1000, paidAmount: 600, balance: 400, status: 'PARTIAL', date: '2026-10-01' },
  { id: 'i2', customerId: 'c2', totalAmount: 800, paidAmount: 0, balance: 800, status: 'UNPAID', date: '2026-10-02' },
  { id: 'i3', customerId: 'c3', totalAmount: 500, paidAmount: 0, balance: 500, status: 'UNPAID', date: '2026-10-03' },
  { id: 'i4', customerId: 'c4', totalAmount: 100, paidAmount: 0, balance: 100, status: 'VOID', date: '2026-10-03' },
];
const payments = [
  { id: 'p1', customerId: 'c1', accountId: 'c1', amount: 600, status: 'CLEARED', method: 'TRANSFER', date: '2026-10-10' },
  { id: 'p2', customerId: 'c2', accountId: 'c2', amount: 100, status: 'PENDING', method: 'TRANSFER', date: '2026-10-10' },
  { id: 'p3', customerId: 'cX', accountId: 'cX', amount: 200, status: 'CLEARED', method: 'TRANSFER', date: '2026-10-10' },
];
const allocations = [
  { id: 'a1', paymentId: 'p1', invoiceId: 'i1', amount: 600, createdAt: '2026-10-10' },
  { id: 'a2', paymentId: 'p2', invoiceId: 'i2', amount: 100, createdAt: '2026-10-10' },
  { id: 'a3', paymentId: 'p3', invoiceId: 'i3', amount: 200, createdAt: '2026-10-10' },
  { id: 'a4', paymentId: 'missing', invoiceId: 'i2', amount: 10, createdAt: '2026-10-10' },
  { id: 'a5', paymentId: 'p1', invoiceId: 'missing-invoice', amount: 10, createdAt: '2026-10-10' },
  { id: 'a6', paymentId: 'p1', invoiceId: 'i2', amount: -1, createdAt: '2026-10-10' },
  { id: 'a1', paymentId: 'p1', invoiceId: 'i1', amount: 600, createdAt: '2026-10-10' },
];
const report = reconcileReceivables(invoices, payments, allocations);
assert.equal(report.invoiceCount, 3, 'void invoice is excluded from live receivables');
assert.equal(report.totalInvoiceAmount, 2300);
assert.equal(report.totalValidAllocated, 600, 'only cleared same-customer allocations are counted');
assert.equal(report.totalOutstandingBeforeCredits, 1700);
assert.equal(report.customerOutstandingBeforeCredits.c1, 400);
assert.equal(report.customerOutstandingBeforeCredits.c2, 800, 'pending payment allocation is not subtracted');
assert.equal(report.customerOutstandingBeforeCredits.c3, 500, 'cross-customer allocation is not subtracted');
assert.equal(report.validAllocationCount, 1);
assert.ok(report.issues.some(issue => issue.code === 'PAYMENT_NOT_CLEARED'));
assert.ok(report.issues.some(issue => issue.code === 'CUSTOMER_MISMATCH'));
assert.ok(report.issues.some(issue => issue.code === 'PAYMENT_NOT_FOUND'));
assert.ok(report.issues.some(issue => issue.code === 'INVOICE_NOT_FOUND'));
assert.ok(report.issues.some(issue => issue.code === 'INVALID_ALLOCATION_AMOUNT'));
assert.ok(report.issues.some(issue => issue.code === 'DUPLICATE_ALLOCATION_ID'));
assert.equal(report.authoritative, false, 'credit-note source is not modeled so report cannot claim authoritative receivables');
assert.equal(report.creditSourceAvailable, false);
assert.ok(report.blockedReason.includes('Credit Note'));
const mismatch = reconcileReceivables([{ ...invoices[0], balance: 999 }], payments, allocations);
assert.ok(mismatch.issues.some(issue => issue.code === 'INVOICE_BALANCE_MISMATCH'), 'stored balance mismatch is surfaced');
const overallocated = reconcileReceivables([{ ...invoices[0], totalAmount: 500, balance: 0 }], [{ ...payments[0], amount: 700 }], [{ id: 'a', paymentId: 'p1', invoiceId: 'i1', amount: 600, createdAt: '2026-10-10' }]);
assert.ok(overallocated.issues.some(issue => issue.code === 'INVOICE_OVERALLOCATED'));
const paymentOverallocated = reconcileReceivables([invoices[0]], [{ ...payments[0], amount: 500 }], [{ id: 'a1', paymentId: 'p1', invoiceId: 'i1', amount: 600, createdAt: '2026-10-10' }]);
assert.ok(paymentOverallocated.issues.some(issue => issue.code === 'PAYMENT_OVERALLOCATED'));
console.log('PASS: 20 assertions (receivable allocation reconciliation and explicit credit-source blocker)');
