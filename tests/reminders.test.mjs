// اجرا: node tests/reminders.test.mjs  (Node >= 22.18، بدون وابستگی)
import assert from 'node:assert/strict';
const { computeTaskReminders, slaFromDue, dayDiff, localDateStr } = await import('../src/lib/reminders.ts');
let n = 0; const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const T0 = new Date('2026-10-22T09:00:00Z'); const base = { users: [{ id: 'u1', managerId: 'boss' }, { id: 'boss' }, { id: 'u2', isActive: false }], reminderLog: {} };
const mk = (due, extra = {}) => ({ ...base, tasks: [{ id: 't1', title: 'پیگیری', dueDate: due, status: 'OPEN', assigneeType: 'USER', assigneeId: 'u1', ...extra }] });
eq(dayDiff('2026-10-29', '2026-10-22'), 7, 'dayDiff 7'); eq(slaFromDue('2026-10-21', '2026-10-22'), 'BREACHED', 'breached'); eq(slaFromDue('2026-10-23', '2026-10-22'), 'AT_RISK', 'at risk'); eq(slaFromDue('2026-10-30', '2026-10-22'), 'ON_TRACK', 'on track');
eq(computeTaskReminders(mk('2026-10-29'), T0, 'Asia/Tehran').map(e => e.stage), ['D7'], '7 روز قبل');
eq(computeTaskReminders(mk('2026-10-24'), T0, 'Asia/Tehran').map(e => e.stage), ['D2'], '2 روز قبل');
eq(computeTaskReminders(mk('2026-10-22'), T0, 'Asia/Tehran').map(e => e.stage), ['D0'], 'روز سررسید');
eq(computeTaskReminders(mk('2026-10-25'), T0, 'Asia/Tehran').length, 0, '3 روز قبل: هیچ');
const od = computeTaskReminders(mk('2026-10-20'), T0, 'Asia/Tehran'); eq(od.map(e => e.stage).sort(), ['ESCALATION', 'OVERDUE'], 'معوق + Escalation'); eq(od.find(e => e.stage === 'ESCALATION').recipientId, 'boss', 'Escalation به مدیر مستقیم'); eq(od.find(e => e.stage === 'OVERDUE').recipientId, 'u1', 'معوق به مسئول');
// ضدتکرار
const s = mk('2026-10-24'); const ev = computeTaskReminders(s, T0, 'Asia/Tehran'); s.reminderLog[ev[0].key] = 'x'; eq(computeTaskReminders(s, T0, 'Asia/Tehran').length, 0, 'ضدتکرار با reminderLog');
// تغییر مهلت = کلید جدید
s.tasks[0].dueDate = '2026-10-29'; eq(computeTaskReminders(s, T0, 'Asia/Tehran').map(e => e.stage), ['D7'], 'تغییر مهلت → یادآوری جدید');
// تکمیل/لغو/حذف نرم/بدون مهلت
eq(computeTaskReminders(mk('2026-10-22', { status: 'COMPLETED' }), T0).length, 0, 'تکمیل‌شده'); eq(computeTaskReminders(mk('2026-10-22', { status: 'CANCELLED' }), T0).length, 0, 'لغوشده'); eq(computeTaskReminders(mk('2026-10-22', { deletedAt: 'x' }), T0).length, 0, 'حذف نرم'); eq(computeTaskReminders(mk(undefined), T0).length, 0, 'بدون مهلت');
// Escalation بدون مدیر قابل‌تعیین = ساخته نمی‌شود (نه جعل)
const noBoss = { ...mk('2026-10-20'), users: [{ id: 'u1' }] }; eq(computeTaskReminders(noBoss, T0, 'Asia/Tehran').map(e => e.stage), ['OVERDUE'], 'بدون مدیر: فقط معوق');
// مدیر غیرفعال
const inactiveBoss = { ...mk('2026-10-20'), users: [{ id: 'u1', managerId: 'u2' }, { id: 'u2', isActive: false }] }; eq(computeTaskReminders(inactiveBoss, T0, 'Asia/Tehran').map(e => e.stage), ['OVERDUE'], 'مدیر غیرفعال');
// منطقه زمانی: ۲۲:۳۰ UTC = ۰۲:۰۰ بعد از نیمه‌شب تهران → تاریخ محلی روز بعد
eq(localDateStr(new Date('2026-10-22T22:30:00Z'), 'Asia/Tehran'), '2026-10-23', 'تایم‌زون تهران'); eq(localDateStr(new Date('2026-10-22T22:30:00Z'), 'UTC'), '2026-10-22', 'UTC');
// ارجاع به گروه: گیرنده تعیین‌شده ندارد (نه به کاربر اشتباه)
eq(computeTaskReminders(mk('2026-10-22', { assigneeType: 'GROUP', assigneeId: 'g1' }), T0).map(e => e.recipientId), [undefined], 'گروه');
console.log(`PASS: ${n} assertions (reminders)`);
