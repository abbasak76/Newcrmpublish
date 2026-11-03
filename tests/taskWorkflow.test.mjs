import assert from 'node:assert/strict';
import { applyTaskWorkflow, getTaskExceptions } from '../src/services/taskWorkflow.ts';
const task = { id: 'T-1', status: 'IN_PROGRESS', activityHistory: [] };
assert.equal(applyTaskWorkflow(task, { action: 'BLOCK', actorId: 'U-1' }).ok, false);
const blocked = applyTaskWorkflow(task, { action: 'BLOCK', actorId: 'U-1', reason: 'منتظر پاسخ مشتری' });
assert.equal(blocked.ok, true);
assert.equal(blocked.task.status, 'BLOCKED');
assert.equal(blocked.task.blockReason, 'منتظر پاسخ مشتری');
assert.equal(applyTaskWorkflow(task, { action: 'COMPLETE', actorId: 'U-1' }).ok, false);
const completed = applyTaskWorkflow(task, { action: 'COMPLETE', actorId: 'U-1', result: 'مشتری تأیید کرد' });
assert.equal(completed.task.status, 'COMPLETED');
assert.equal(completed.task.result, 'مشتری تأیید کرد');
assert.equal(applyTaskWorkflow(blocked.task, { action: 'UNBLOCK', actorId: 'U-1' }).task.status, 'IN_PROGRESS');
assert.equal(applyTaskWorkflow(completed.task, { action: 'REOPEN', actorId: 'U-1' }).task.status, 'OPEN');
assert.equal(applyTaskWorkflow(task, { action: 'START', actorId: 'U-1' }).task.status, 'IN_PROGRESS');
assert.equal(applyTaskWorkflow(task, { action: 'RECORD_RESULT', actorId: 'U-1' }).ok, false);
assert.equal(getTaskExceptions([{ status: 'BLOCKED', dueDate: '', assigneeId: '' }]).length, 1);
console.log('taskWorkflow.test.mjs: PASS (10 assertions)');

// Expanded regression matrix: invalid transitions, immutable updates, timestamps, and exception ranking.
const frozen = Object.freeze({ id: 'T-FROZEN', status: 'OPEN', activityHistory: Object.freeze([]) });
const started = applyTaskWorkflow(frozen, { action: 'START', actorId: 'U-2', at: '2026-10-29T08:00:00.000Z' });
assert.equal(started.ok, true);
assert.equal(started.task.status, 'IN_PROGRESS');
assert.equal(frozen.status, 'OPEN');
assert.equal(started.task.activityHistory.length, 1);
assert.equal(started.task.activityHistory[0].actorId, 'U-2');
assert.equal(started.task.activityHistory[0].at, '2026-10-29T08:00:00.000Z');
assert.equal(applyTaskWorkflow(started.task, { action: 'START', actorId: 'U-2' }).ok, false);
assert.equal(applyTaskWorkflow({ id: 'T-X', status: 'COMPLETED' }, { action: 'UNBLOCK', actorId: 'U-2' }).ok, false);
assert.equal(applyTaskWorkflow({ id: 'T-X', status: 'BLOCKED' }, { action: 'COMPLETE', actorId: 'U-2', result: 'انجام شد' }).ok, false);
const blockedWithReason = applyTaskWorkflow(started.task, { action: 'BLOCK', actorId: 'U-2', reason: 'وابسته به تأیید', at: '2026-10-29T08:05:00.000Z' });
assert.equal(blockedWithReason.task.blockReason, 'وابسته به تأیید');
assert.equal(blockedWithReason.task.activityHistory.at(-1).action, 'BLOCKED');
const unblocked = applyTaskWorkflow(blockedWithReason.task, { action: 'UNBLOCK', actorId: 'U-2', at: '2026-10-29T08:10:00.000Z' });
assert.equal(unblocked.task.blockReason, '');
assert.equal(unblocked.task.status, 'IN_PROGRESS');
const resultOnly = applyTaskWorkflow(unblocked.task, { action: 'RECORD_RESULT', actorId: 'U-2', result: 'با مشتری تماس گرفته شد', nextAction: 'فردا پیگیری شود' });
assert.equal(resultOnly.task.status, 'IN_PROGRESS');
assert.equal(resultOnly.task.result, 'با مشتری تماس گرفته شد');
assert.equal(resultOnly.task.nextAction, 'فردا پیگیری شود');
assert.equal(resultOnly.task.activityHistory.at(-1).action, 'RESULT_RECORDED');
assert.match(resultOnly.task.activityHistory.at(-1).details, /اقدام بعدی/);
const completedAt = '2026-10-29T08:15:00.000Z';
const final = applyTaskWorkflow(resultOnly.task, { action: 'COMPLETE', actorId: 'U-2', result: 'تأیید نهایی دریافت شد', at: completedAt });
assert.equal(final.task.completedAt, completedAt);
assert.equal(final.task.status, 'COMPLETED');
assert.equal(final.task.activityHistory.at(-1).action, 'COMPLETED');
const exceptions = getTaskExceptions([
  { id: 'late', status: 'OPEN', dueDate: '2026-10-28T12:00:00.000Z', assigneeId: 'U-1' },
  { id: 'blocked', status: 'BLOCKED', dueDate: 'invalid', assigneeId: '', priority: 'URGENT' },
  { id: 'closed', status: 'COMPLETED', dueDate: '', assigneeId: '' },
  { id: 'scheduled', status: 'OPEN', dueDate: '2026-11-10T12:00:00.000Z', assigneeId: 'U-1' }
], new Date('2026-10-29T12:00:00.000Z'));
assert.equal(exceptions.length, 2);
assert.equal(exceptions[0].task.id, 'blocked');
assert.ok(exceptions[0].reasons.includes('متوقف'));
assert.ok(exceptions[0].reasons.includes('مهلت نامعتبر'));
assert.ok(exceptions[0].reasons.includes('بدون مسئول'));
assert.ok(exceptions[0].reasons.includes('اولویت بالا بدون برنامه زمانی') === false);
assert.equal(exceptions[1].task.id, 'late');
assert.ok(exceptions[1].reasons.includes('مهلت گذشته'));
assert.equal(getTaskExceptions([{ id: 'good', status: 'OPEN', dueDate: '2026-11-10', assigneeId: 'U-1', priority: 'NORMAL' }], new Date('2026-10-29')).length, 0);
console.log('taskWorkflow.test.mjs: expanded regression matrix PASS');
