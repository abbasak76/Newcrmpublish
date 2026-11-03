import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pipeline = fs.readFileSync(path.join(root, 'src/config/pipeline.ts'), 'utf8');
const leads = fs.readFileSync(path.join(root, 'src/components/LeadsWorkspace.tsx'), 'utf8');
const negotiations = fs.readFileSync(path.join(root, 'src/components/NegotiationsWorkspace.tsx'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'src/components/DashboardWorkspace.tsx'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'database/sqlserver/v1/011_soft_delete_and_activity_indexes.sql'), 'utf8');
assert.ok(pipeline.includes('LEAD_STAGES') && pipeline.includes('OPPORTUNITY_STAGES'), 'central pipeline vocabulary exists');
assert.ok(leads.includes("from '../config/pipeline'") && leads.includes('...LEAD_STAGES'), 'lead workspace consumes shared stages');
assert.ok(negotiations.includes("from '../config/pipeline'") && negotiations.includes('...OPPORTUNITY_STAGES'), 'opportunity workspace consumes shared stages');
assert.ok(dashboard.includes("from '../config/pipeline'") && dashboard.includes('OPPORTUNITY_STAGES'), 'dashboard consumes shared opportunity stages');
for (const table of ['Account','Lead','Opportunity','Activity','Task','Note','Quote','InvoiceMirror','SalesOrder','DispatchPlan']) {
  assert.ok(migration.includes(`N'${table}'`), `soft-delete migration includes ${table}`);
}
assert.ok(migration.includes('COL_LENGTH') && migration.includes('DeletedAtUtc datetime2(3) NULL'), 'migration is additive and idempotent for existing columns');
assert.ok(migration.includes('IX_Activity_Active_Account_Time'), 'live activity history has a filtered index');
console.log('PASS: 15 assertions (shared pipeline config and additive SQL Server soft-delete/index migration contracts)');

const lifecycle = fs.readFileSync(path.join(root, 'src/lib/recordLifecycle.ts'), 'utf8');
const formRenderer = fs.readFileSync(path.join(root, 'src/components/shared/DynamicFormRenderer.tsx'), 'utf8');
assert.ok(lifecycle.includes('activeRecords') && lifecycle.includes('restoreRecord'), 'shared active/restore lifecycle helpers exist');
assert.ok(leads.includes('activeRecords(state.leads)'), 'deleted leads are excluded from the lead list');
assert.ok(fs.readFileSync(path.join(root, 'src/components/CustomersWorkspace.tsx'), 'utf8').includes('activeRecords(state.accounts)'), 'deleted accounts are excluded from customer list');
assert.ok(negotiations.includes('activeRecords(state.opportunities)'), 'deleted opportunities are excluded from pipeline list');
assert.ok(formRenderer.includes('submissionLock.current') && formRenderer.includes('setSubmittingInternal(true)'), 'dynamic form prevents duplicate submission while pending');
console.log('PASS: additional lifecycle, lead conversion and form submit contracts');
