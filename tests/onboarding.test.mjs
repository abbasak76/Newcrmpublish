// اجرا: node tests/onboarding.test.mjs
import assert from 'node:assert/strict';
const O = await import('../src/lib/onboarding.ts');
let n = 0; const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; }; const ok = (c, m) => { assert.ok(c, m); n++; };
const T = new Date('2026-10-24T08:00:00Z'); let c = 0; const id = () => `i${++c}`;
// اعتبارسنجی
ok(O.isValidNationalCode('0012345679') === false || true, 'smoke'); ok(O.isValidNationalCode('0499370899'), 'کد ملی معتبر'); ok(!O.isValidNationalCode('1111111111'), 'تکراری'); ok(!O.isValidNationalCode('0499370890'), 'چک‌سام غلط'); ok(O.isValidNationalCode('۰۴۹۹۳۷۰۸۹۹'), 'ارقام فارسی');
eq(O.normalizeMobile('+989121234567'), '09121234567', '+98'); eq(O.normalizeMobile('۰۹۱۲۱۲۳۴۵۶۷'), '09121234567', 'فارسی'); eq(O.normalizeMobile('0912123'), null, 'کوتاه'); eq(O.normalizeMobile('09121234567'), '09121234567', 'عادی');
ok(O.isValidIranIban('IR062960000000100324200001'), 'شبا معتبر'); ok(!O.isValidIranIban('IR062960000000100324200002'), 'شبا چک‌سام غلط'); ok(!O.isValidIranIban('IR12'), 'شبا کوتاه');
// درخواست همکاری
const mk = () => ({ settings: { orgConfig: { tenantName: 'شرکت نمونه' } }, users: [{ id: 'hr', name: 'مدیر منابع انسانی' }, { id: 'int', name: 'مصاحبه‌کننده' }, { id: 'off', name: 'غیرفعال', isActive: false }], onboardingApplications: [], tasks: [], messagingLogs: [], notifications: [], auditLogs: [] });
const input = { firstName: 'علی', lastName: 'رضایی', mobile: '09121234567', nationalId: '0499370899', desiredRole: 'ویزیتور' };
const docs = [{ kind: 'photo', attachmentId: 'a1' }, { kind: 'birthCertificate', attachmentId: 'a2' }, { kind: 'nationalCard', attachmentId: 'a3' }];
let s = mk(); eq(O.submitApplication(s, { ...input, nationalId: '123' }, 'x', T, docs).ok, false, 'کد ملی نامعتبر'); eq(O.submitApplication(s, input, 'x', T, docs.slice(1)).errors.some(e => e.includes('عکس پرسنلی')), true, 'مدرک الزامی');
eq(O.submitApplication(s, input, 'app1', T, docs).ok, true, 'ثبت'); eq(O.submitApplication(s, input, 'app2', T, docs).ok, false, 'ضدتکرار فعال'); eq(s.onboardingApplications.length, 1, 'یک رکورد');
eq(O.transitionApplication(s, 'app1', 'REJECTED', '', 'hr', T).ok, false, 'رد بدون یادداشت'); eq(O.transitionApplication(s, 'app1', 'UNDER_REVIEW', '', 'hr', T).ok, true, 'در حال بررسی');
// ارجاع به مصاحبه
const iv = { date: '2026-10-30', time: '10:30', interviewerId: 'int', address: 'خیابان نمونه' };
eq(O.referToInterview(s, 'app1', { ...iv, interviewerId: 'off' }, 'hr', T, id).ok, false, 'مصاحبه‌کننده غیرفعال'); eq(O.referToInterview(s, 'app1', { ...iv, time: '25:00' }, 'hr', T, id).ok, false, 'ساعت نامعتبر'); eq(O.referToInterview(s, 'app1', { ...iv, address: '' }, 'hr', T, id).ok, false, 'بدون آدرس');
const r = O.referToInterview(s, 'app1', iv, 'hr', T, id); eq(r.ok, true, 'ارجاع'); eq(s.tasks.length, 1, 'تسک واقعی ساخته شد'); eq([s.tasks[0].assigneeId, s.tasks[0].dueDate, s.tasks[0].sourceApplicationId], ['int', '2026-10-30', 'app1'], 'مشخصات تسک'); eq(s.tasks[0].title, 'مصاحبه استخدامی — علی رضایی', 'عنوان');
eq(s.messagingLogs.length, 1, 'پیامک ثبت شد'); eq([s.messagingLogs[0].status, s.messagingLogs[0].reason], ['LOCAL_ONLY', 'NOT_CONFIGURED'], 'ارسال نشده (صادقانه)'); ok(s.messagingLogs[0].content.includes('شرکت نمونه') && s.messagingLogs[0].content.includes('خیابان نمونه'), 'متن از تنظیمات/فرم'); eq(s.notifications[0].recipientId, 'int', 'اعلان به مصاحبه‌کننده');
eq(O.referToInterview(s, 'app1', iv, 'hr', T, id).ok, false, 'ارجاع تکراری رد'); eq([s.tasks.length, s.messagingLogs.length], [1, 1], 'تسک/پیامک تکراری ساخته نشد');
eq(O.queueSms(s, { to: '09121234567', text: 'x', key: 'interview|app1' }, T, id).duplicate, true, 'dedupe پیامک');
// نتیجه مصاحبه
eq(O.recordInterviewResult(s, 'app1', 'ACCEPT', '', 'hr', T).ok, false, 'غیرمصاحبه‌کننده'); eq(O.recordInterviewResult(s, 'app1', 'REJECT', '', 'int', T).ok, false, 'رد بدون یادداشت');
eq(O.recordInterviewResult(s, 'app1', 'ACCEPT', '', 'int', T).ok, true, 'قبول'); eq(s.onboardingApplications[0].status, 'ACCEPTED', 'پذیرفته'); eq(s.tasks[0].status, 'COMPLETED', 'تسک بسته شد'); eq(O.recordInterviewResult(s, 'app1', 'REJECT', 'x', 'int', T).ok, false, 'نتیجه مجدد');
ok(!('permissionSetId' in s.users[0]) && s.users.every(u => !u.createdFromApplication), 'پذیرش، حساب/نقش نمی‌سازد');
// پیامک اطلاعات ورود: بدون رمز موقت = مسدود
eq(O.prepareCredentialsSms(s, { username: '0499370899' }).status, 'BLOCKED', 'بدون رمز موقت از سرور = مسدود'); eq(O.prepareCredentialsSms(s, { username: 'u', tempPassword: 'Tmp#123' }).status, 'READY', 'با رمز موقت');
eq(O.composeSms('{a} {b}', { a: '1' }).missing, ['b'], 'متغیر ناقص');
// پرونده پرسنلی
const p = { ...mk(), users: [{ id: 'u1', name: 'کارمند قدیمی', role: 'SALES', permissionSetId: 'ps1', roleId: 'r1', isActive: true }, { id: 'boss', name: 'مدیر' }] };
const f1 = O.ensurePersonnelFile(p, 'u1', T); const f2 = O.ensurePersonnelFile(p, 'u1', T); eq(p.personnelFiles.length, 1, 'بدون رکورد تکراری'); ok(f1 === f2, 'همان پرونده'); eq(O.ensurePersonnelFile(p, 'ghost', T), null, 'کاربر ناموجود');
const cfg = O.getOnboardingConfig(p); ok(O.computeMissing(f1, cfg).length >= 8, 'ناقص: فهرست موارد'); eq(O.submitPersonnelFile(p, 'u1', T).ok, false, 'ارسال ناقص رد');
O.savePersonnelStep(p, 'u1', 'identity', { fullName: 'کارمند قدیمی', mobile: '09121234567', nationalId: '0499370899' }, T); O.savePersonnelStep(p, 'u1', 'bank', { bankName: 'بانک', iban: 'IR062960000000100324200001', accountHolder: 'کارمند' }, T); O.savePersonnelStep(p, 'u1', 'address', { province: 'تهران', city: 'تهران', full: 'خیابان ...' }, T);
['photo', 'birthCertificate', 'nationalCard'].forEach((k, i) => O.setPersonnelDocument(p, 'u1', k, `d${i}`, T)); eq(O.computeMissing(p.personnelFiles[0], cfg), [], 'کامل');
eq(O.submitPersonnelFile(p, 'u1', T).ok, true, 'ارسال برای بررسی'); eq(O.savePersonnelStep(p, 'u1', 'bank', { iban: 'x' }, T).ok, false, 'حین بررسی قابل ویرایش نیست');
eq(O.reviewPersonnelFile(p, 'u1', 'APPROVE', '', 'u1', T).ok, false, 'بررسی پرونده خود ممنوع'); eq(O.reviewPersonnelFile(p, 'u1', 'NEEDS_CORRECTION', '', 'boss', T).ok, false, 'اصلاح بدون یادداشت');
const before = JSON.stringify(p.users[0]); eq(O.reviewPersonnelFile(p, 'u1', 'APPROVE', '', 'boss', T).ok, true, 'تأیید'); eq(JSON.stringify(p.users[0]), before, 'تأیید مدارک نقش/مجوز/فعال‌بودن را تغییر نمی‌دهد');
eq(O.reviewPersonnelFile(p, 'u1', 'APPROVE', '', 'boss', T).ok, false, 'تأیید مجدد'); O.savePersonnelStep(p, 'u1', 'address', { city: 'کرج' }, T); eq(p.personnelFiles[0].status, 'INCOMPLETE', 'تغییر پس از تأیید → ناقص');
// پیکربندی: بدون نام شرکت هاردکد
eq(O.getOnboardingConfig({ settings: { orgConfig: { onboarding: { requiredDocs: [{ key: 'x', label: 'مدرک X', required: true }] } } } }).requiredDocs[0].key, 'x', 'مدارک قابل‌پیکربندی');
console.log(`PASS: ${n} assertions (onboarding)`);
