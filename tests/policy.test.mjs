// اجرا: node tests/policy.test.mjs
import assert from 'node:assert/strict';
const { getHighValueQuoteThreshold, getDefaultCreditLimit, LEGACY_HIGH_VALUE_QUOTE_THRESHOLD } = await import('../src/lib/orgPolicy.ts');
let n = 0; const eq = (a, b, m) => { assert.equal(a, b, m); n++; };
eq(getHighValueQuoteThreshold({ settings: {} }), LEGACY_HIGH_VALUE_QUOTE_THRESHOLD, 'بدون تنظیم = پیش‌فرض تاریخی'); eq(getHighValueQuoteThreshold({ settings: { orgConfig: { highValueQuoteThreshold: 5000 } } }), 5000, 'مقدار تنظیم‌شده');
eq(getHighValueQuoteThreshold({ settings: { orgConfig: { highValueQuoteThreshold: -1 } } }), LEGACY_HIGH_VALUE_QUOTE_THRESHOLD, 'مقدار نامعتبر رد می‌شود'); eq(getDefaultCreditLimit({ settings: { orgConfig: { defaultCreditLimit: 'abc' } } }), 100000000, 'NaN رد می‌شود'); eq(getDefaultCreditLimit(null), 100000000, 'null-safe');
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const cpqSrc = fs.readFileSync(new URL('../src/lib/cpqEngine.ts', import.meta.url), 'utf8'); const blk = cpqSrc.slice(cpqSrc.indexOf('export function canEditQuoteLines'));
const tmpf = path.join(os.tmpdir(), `cpq-${Date.now()}.ts`); fs.writeFileSync(tmpf, blk); const cpq = await import(tmpf);
if (cpq?.canEditQuoteLines) { const c = cpq.canEditQuoteLines; eq(c({ status: 'DRAFT' }).ok, true, 'DRAFT'); eq(c({ status: 'DRAFT', pricingSnapshot: {} }).ok, false, 'Snapshot قفل'); eq(c({ status: 'APPROVED' }).ok, false, 'APPROVED'); eq(c(null).ok, false, 'null'); }
console.log(`PASS: ${n} assertions (policy/cpq)`);
