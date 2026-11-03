import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync('src/components/GroupsWorkspace.tsx','utf8');
for (const type of ['CUSTOMER','STAFF','CHECK','INVOICE','PRODUCT','TASK','QUOTE']) {
  assert.ok(source.includes(type), `chat entity preview supports ${type}`);
}
assert.match(source,/رکوردهای ارجاع‌شده/,'preview section is labelled accessibly');
assert.match(source,/ref\.source === 'ERP_MIRROR'/,'preview distinguishes ERP mirror from CRM');
assert.match(source,/goEntity\(\{ type: entityType, id: ref\.entityId \}\)/,'preview exposes navigation action');
console.log('PASS: 10 chat entity preview contracts');
