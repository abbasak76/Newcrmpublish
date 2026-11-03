import assert from 'node:assert/strict';
import { assessTaskSla, recommendTaskNextAction, rankTasksForAttention } from '../src/services/taskIntelligence.ts';
const now = new Date('2026-10-28T12:00:00.000Z');
assert.equal(assessTaskSla({ status:'OPEN', slaDueAt:'2026-10-28T11:00:00.000Z' }, now).state, 'BREACHED');
assert.equal(assessTaskSla({ status:'OPEN', slaDueAt:'2026-10-28T13:00:00.000Z' }, now).state, 'AT_RISK');
assert.equal(assessTaskSla({ status:'OPEN', slaDueAt:'2026-10-29T12:00:00.000Z' }, now).state, 'ON_TRACK');
assert.equal(assessTaskSla({ status:'OPEN' }, now).state, 'UNSCHEDULED');
assert.equal(assessTaskSla({ status:'COMPLETED' }, now).state, 'COMPLETED');
assert.equal(recommendTaskNextAction({ status:'OPEN', slaDueAt:'2026-10-28T11:00:00.000Z' }, now).key, 'ESCALATE');
assert.equal(recommendTaskNextAction({ status:'OPEN' }, now).key, 'SCHEDULE');
const ranked = rankTasksForAttention([
 {id:'later',title:'پیگیری عادی',status:'OPEN',priority:'NORMAL',slaDueAt:'2026-10-30T12:00:00.000Z'},
 {id:'late',title:'وصول فوری',status:'OPEN',priority:'HIGH',slaDueAt:'2026-10-28T11:00:00.000Z'}
], now);
assert.equal(ranked[0].id, 'late');
assert.ok(ranked[0].attentionScore > ranked[1].attentionScore);
console.log('taskSlaActions.test.mjs: PASS (9 assertions)');
