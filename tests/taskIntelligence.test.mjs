import assert from 'node:assert/strict';
import { classifyTask, scoreTask, checkDailyCapacity, findNextAvailableSlot, assignSla, groupMissionBatch, proposeOverflow } from '../src/services/taskIntelligence.ts';
const date = '2026-11-02'; // Monday
assert.equal(classifyTask({title:'وصول چک مشتری'}), 'FINANCE');
assert.equal(classifyTask({title:'تحویل دستگاه پوز'}), 'LOGISTICS');
assert.equal(classifyTask({title:'ویزیت و پیگیری فروش'}), 'SALES');
assert.ok(scoreTask({priority:'URGENT', amountDue:1000000, debtAgeDays:20}) > scoreTask({priority:'LOW'}));
const tasks = [
 {id:'a', assigneeId:'u1', dueDate:date, status:'OPEN', priority:'HIGH', urgencyScore:50},
 {id:'b', assigneeId:'u1', dueDate:date, status:'COMPLETED', priority:'URGENT', urgencyScore:90},
];
assert.equal(checkDailyCapacity(tasks,'u1',date,[{priority:'NORMAL',urgencyScore:10}],{maxDailyTasks:2,maxDailyScore:100}).fits,true);
assert.equal(checkDailyCapacity(tasks,'u1',date,[{priority:'NORMAL',urgencyScore:10}],{maxDailyTasks:1,maxDailyScore:100}).fits,false);
const slot = findNextAvailableSlot(tasks,'u1',date,[{priority:'NORMAL',urgencyScore:10}],{maxDailyTasks:1,maxDailyScore:100,workingDays:[1,2,3,4,5,6,0]});
assert.equal(slot.date,'2026-11-03'); // the requested date is full; next working day is suggested
const overflow = proposeOverflow(tasks,'u1',date,[{priority:'URGENT',urgencyScore:80}],{maxDailyTasks:1,maxDailyScore:100,workingDays:[1,2,3,4,5,6,0]},['u2']);
assert.equal(overflow.capacity.fits,false); assert.equal(overflow.suggestedDelegate,'u2');
assert.equal(assignSla({title:'وصول چک'},new Date('2026-01-01T00:00:00Z')).slaDueAt,'2026-01-01T03:00:00.000Z');
assert.equal(groupMissionBatch([{title:'a',region:'east',urgencyScore:2},{title:'b',region:'east',urgencyScore:8}], t=>t.region)[0].tasks[0].title,'b');
console.log('taskIntelligence.test.mjs: PASS');
