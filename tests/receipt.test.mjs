// اجرا: node tests/receipt.test.mjs
import assert from 'node:assert/strict';
const { checkReceipt, buildReceiptPayment, approveAndAllocate, markNeedsFix, transferToErp } = await import('../src/lib/receiptFlow.ts');
let n = 0; const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; }; const T = new Date('2026-10-22T10:00:00Z'); let c = 0; const id = () => `id${++c}`;
const mk = () => ({ accounts: [{ id: 'a1', balance: 1000 }], payments: [], paymentAllocations: [], invoices: [
  { id: 'i1', accountId: 'a1', customerId: 'a1', totalAmount: 300, paidAmount: 0, balance: 300, status: 'UNPAID', date: '2026-08-01', dueDate: '2026-09-01' },
  { id: 'i2', accountId: 'a1', customerId: 'a1', totalAmount: 500, paidAmount: 0, balance: 500, status: 'UNPAID', date: '2026-08-10', dueDate: '2026-10-01' },
  { id: 'i3', accountId: 'a1', customerId: 'a1', totalAmount: 200, paidAmount: 0, balance: 200, status: 'UNPAID', date: '2026-09-01', dueDate: '2026-08-15' } ] });
// اعتبارسنجی
eq(checkReceipt(mk(), { accountId: 'a1', amount: 0 }).ok, false, 'مبلغ صفر'); eq(checkReceipt(mk(), { accountId: 'a1', amount: NaN }).ok, false, 'NaN'); eq(checkReceipt(mk(), { accountId: 'zz', amount: 5 }).ok, false, 'مشتری ناموجود'); eq(checkReceipt(mk(), { accountId: 'a1', amount: 100 }).ok, true, 'معتبر');
// ضدتکرار
const s = mk(); s.payments.push(buildReceiptPayment({ accountId: 'a1', amount: 100, reference: 'TRK-1', method: 'TRANSFER' }, 'p0', T));
eq(checkReceipt(s, { accountId: 'a1', amount: 100, reference: ' trk-1 ' }).duplicateOf, 'p0', 'مرجع یکسان (حساس به فاصله/حروف) = تکراری قطعی'); eq(checkReceipt(s, { accountId: 'a1', amount: 999, reference: 'TRK-2' }).ok, true, 'مرجع متفاوت');
const s2 = mk(); s2.payments.push(buildReceiptPayment({ accountId: 'a1', amount: 100, method: 'CASH', date: T.toISOString() }, 'p9', T)); eq(checkReceipt(s2, { accountId: 'a1', amount: 100, method: 'CASH', date: T.toISOString() }).probableDuplicateOf, 'p9', 'احتمالی بدون مرجع'); eq(checkReceipt(s2, { accountId: 'a1', amount: 100, method: 'CASH', date: T.toISOString() }).ok, true, 'احتمالی رد نمی‌شود');
const b = buildReceiptPayment({ accountId: 'a1', amount: 100 }, 'p1', T); eq([b.status, b.receiptStatus, b.erpStatus], ['PENDING', 'PENDING_REVIEW', 'NOT_CONFIGURED'], 'وضعیت اولیه صادقانه (نه CLEARED)');
eq(buildReceiptPayment({ accountId: 'a1', amount: 100 }, 'p1', T, 'p9').receiptStatus, 'MISMATCH', 'احتمالی = مغایرت برای بررسی');
// تخصیص FIFO بر اساس سررسید: i3(08-15) → i1(09-01) → i2(10-01)
const d = mk(); d.payments.push(buildReceiptPayment({ accountId: 'a1', amount: 600 }, 'p2', T));
const r = approveAndAllocate(d, 'p2', 'acct', T, id); eq(r.ok, true, 'تخصیص'); eq(r.allocations, [{ invoiceId: 'i3', amount: 200 }, { invoiceId: 'i1', amount: 300 }, { invoiceId: 'i2', amount: 100 }], 'ترتیب FIFO'); eq([r.allocated, r.remainder], [600, 0], 'جمع');
eq(d.invoices.map(i => [i.balance, i.status]), [[0, 'PAID'], [400, 'PARTIAL'], [0, 'PAID']], 'مانده/وضعیت فاکتورها'); eq(d.accounts[0].balance, 400, 'مانده حساب'); eq(d.paymentAllocations.length, 3, 'رکوردهای PaymentAllocation');
eq([d.payments[0].status, d.payments[0].receiptStatus, d.payments[0].erpStatus], ['CLEARED', 'PENDING_ERP', 'NOT_CONFIGURED'], 'پس از تایید: در انتظار ERP');
// idempotent: تخصیص دوباره = رد، بدون تغییر
const again = approveAndAllocate(d, 'p2', 'acct', T, id); eq(again.ok, false, 'تخصیص مجدد رد'); eq(d.paymentAllocations.length, 3, 'تخصیص تکراری ساخته نشد'); eq(d.accounts[0].balance, 400, 'مانده تغییر نکرد');
// اضافه‌پرداخت: بیش از مانده فاکتورها تخصیص نمی‌یابد
const o = mk(); o.payments.push(buildReceiptPayment({ accountId: 'a1', amount: 5000 }, 'p3', T)); const ro = approveAndAllocate(o, 'p3', 'acct', T, id); eq([ro.allocated, ro.remainder], [1000, 4000], 'اضافه‌پرداخت = remainder (نه پرداخت بیش از مجاز)'); eq(o.invoices.every(i => i.balance === 0), true, 'هیچ مانده منفی'); eq(o.payments[0].unallocatedAmount, 4000, 'ثبت تخصیص‌نیافته');
// NEEDS_FIX
const f = mk(); f.payments.push(buildReceiptPayment({ accountId: 'a1', amount: 10 }, 'p4', T)); eq(markNeedsFix(f, 'p4', '', 'u'), false, 'دلیل الزامی'); eq(markNeedsFix(f, 'p4', 'فیش ناخوانا', 'u'), true, 'نیازمند اصلاح'); eq(approveAndAllocate(f, 'p4', 'u', T, id).ok, false, 'NEEDS_FIX تخصیص نمی‌شود');
eq(markNeedsFix(d, 'p2', 'x', 'u'), false, 'تخصیص‌شده قابل برگشت به اصلاح نیست');
eq(approveAndAllocate(mk(), 'nope', 'u', T, id).ok, false, 'پرداخت ناموجود'); eq(transferToErp().status, 'NOT_CONFIGURED', 'ERP صادقانه');
console.log(`PASS: ${n} assertions (receipt flow)`);
