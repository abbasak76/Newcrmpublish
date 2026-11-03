// اجرا: node tests/financeRequests.test.mjs
import assert from 'node:assert/strict';
const { checkFinanceRequest, buildFinanceRequest, decideFinanceRequest, resubmitFinanceRequest, requestKey } = await import('../src/lib/financeRequests.ts');
let n = 0; const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; }; const T = new Date('2026-10-23T08:00:00Z');
const st = () => ({ accounts: [{ id: 'a1' }], financeRequests: [] });
const base = { kind: 'PAYMENT_ORDER', payeeName: 'شرکت حمل‌ونقل الف', amount: 5000000, reason: 'کرایه حمل', dueDate: '2026-11-01', requestedBy: 'mgr' };
eq(checkFinanceRequest(st(), base).ok, true, 'معتبر'); eq(checkFinanceRequest(st(), { ...base, amount: 0 }).ok, false, 'مبلغ صفر'); eq(checkFinanceRequest(st(), { ...base, payeeName: ' ' }).ok, false, 'بدون ذی‌نفع'); eq(checkFinanceRequest(st(), { ...base, reason: '' }).ok, false, 'بدون شرح'); eq(checkFinanceRequest(st(), { ...base, kind: 'X' }).ok, false, 'نوع نامعتبر'); eq(checkFinanceRequest(st(), { ...base, accountId: 'zz' }).ok, false, 'مشتری ناموجود');
const s = st(); const r = buildFinanceRequest(base, 'r1', T); s.financeRequests.push(r);
eq([r.status, r.erpStatus], ['SUBMITTED', 'NOT_CONFIGURED'], 'وضعیت اولیه'); eq(checkFinanceRequest(s, { ...base, payeeName: ' شرکت حمل‌ونقل الف ' }).ok, false, 'ضدتکرار فعال'); eq(requestKey(base), r.idempotencyKey, 'کلید');
eq(decideFinanceRequest(s, 'r1', 'APPROVE', '', 'mgr', T).ok, false, 'خودتأییدی ممنوع'); eq(decideFinanceRequest(s, 'r1', 'REJECT', '', 'acct', T).ok, false, 'رد بدون یادداشت'); eq(decideFinanceRequest(s, 'r1', 'APPROVE', '', undefined, T).ok, false, 'بدون کاربر');
eq(decideFinanceRequest(s, 'r1', 'NEEDS_INFO', 'شماره شبا؟', 'acct', T).ok, true, 'نیازمند اطلاعات'); eq(s.financeRequests[0].status, 'NEEDS_INFO', 'وضعیت');
eq(resubmitFinanceRequest(s, 'r1', { reason: 'کرایه حمل + شبا' }, 'other', T).ok, false, 'غیرثبت‌کننده'); eq(resubmitFinanceRequest(s, 'r1', { reason: 'کرایه حمل + شبا' }, 'mgr', T).ok, true, 'ارسال مجدد'); eq(s.financeRequests[0].status, 'SUBMITTED', 'برگشت به صف');
eq(decideFinanceRequest(s, 'r1', 'APPROVE', '', 'acct', T).ok, true, 'تایید'); eq([s.financeRequests[0].status, s.financeRequests[0].erpStatus], ['ERP_PENDING', 'NOT_CONFIGURED'], 'اجرا در ERP، نه CRM');
eq(decideFinanceRequest(s, 'r1', 'REJECT', 'x', 'acct', T).ok, false, 'تصمیم مجدد'); eq(checkFinanceRequest(s, base).ok, false, 'پس از تایید هنوز فعال (تکراری)');
s.financeRequests[0].status = 'REJECTED'; eq(checkFinanceRequest(s, base).ok, true, 'پس از رد دوباره مجاز');
console.log(`PASS: ${n} assertions (finance requests)`);
