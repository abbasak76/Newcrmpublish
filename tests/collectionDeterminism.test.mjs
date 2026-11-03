import assert from 'node:assert/strict';
import { calculateDaysOverdue } from '../src/services/collectionDateUtils.ts';

const reference = new Date('2026-10-29T02:00:00.000Z');
assert.equal(calculateDaysOverdue('2026-10-28T23:59:00.000Z', reference), 1, 'calendar-day aging should be stable across hours');
assert.equal(calculateDaysOverdue('2026-10-29', reference), 0, 'due today is not overdue');
assert.equal(calculateDaysOverdue('not-a-date', reference), 0, 'invalid dates must not produce NaN');
assert.equal(calculateDaysOverdue(undefined, reference), 0, 'missing dates are not overdue');
console.log('collectionDeterminism.test.mjs: PASS (4 assertions)');
