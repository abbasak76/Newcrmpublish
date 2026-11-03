import assert from 'node:assert/strict';
import { importErpRecords, planErpImport, getErpIdentity } from '../src/lib/erpImportService.ts';

const base = { salesOrders: [{ id: 'local-1', customerId: 'c1', status: 'DRAFT' }], invoices: [] };
const incoming = { tenantId: 'tenant-a', sourceSystemCode: 'erp-main', externalId: 'SO-100', sourceModifiedAtUtc: '2026-10-27T10:00:00Z', customerId: 'c1', status: 'OPEN', totalAmount: 100 };
let planned = planErpImport(base, 'SALES_ORDER', [incoming]);
assert.equal(planned.summary.inserted, 1);
assert.equal(planned.nextState.salesOrders.length, 2);
assert.equal(planned.nextState.salesOrders[1].origin, 'ERP');
planned = planErpImport(planned.nextState, 'SALES_ORDER', [incoming]);
assert.equal(planned.summary.inserted, 0);
assert.equal(planned.summary.updated, 1);
assert.equal(planned.nextState.salesOrders.length, 2);
planned = planErpImport(planned.nextState, 'SALES_ORDER', [{ ...incoming, totalAmount: 80, sourceModifiedAtUtc: '2026-10-26T10:00:00Z' }]);
assert.equal(planned.summary.skippedStale, 1);
assert.equal(planned.nextState.salesOrders.find(x => x.externalOrderId === 'SO-100').totalAmount, 100);
const otherSource = planErpImport(planned.nextState, 'SALES_ORDER', [{ ...incoming, sourceSystemCode: 'ERP-SECOND' }]);
assert.equal(otherSource.summary.inserted, 1);
assert.equal(getErpIdentity(incoming, 'SALES_ORDER'), getErpIdentity({ ...incoming, sourceSystemCode: 'ERP-MAIN' }, 'SALES_ORDER'));
assert.notEqual(getErpIdentity(incoming, 'SALES_ORDER'), getErpIdentity({ ...incoming, sourceSystemCode: 'ERP-SECOND' }, 'SALES_ORDER'));
const bad = planErpImport(base, 'INVOICE', [{ sourceSystemCode: 'ERP', externalId: 'INV-1' }]);
assert.equal(bad.summary.conflicts, 1);
assert.equal(bad.nextState.invoices.length, 0);
const malformedTimestamp = planErpImport(base, 'SALES_ORDER', [{ ...incoming, externalId: 'SO-BAD-TIME', sourceModifiedAtUtc: 'not-a-date' }]);
assert.equal(malformedTimestamp.summary.conflicts, 1, 'malformed source timestamp is rejected');
assert.equal(malformedTimestamp.summary.inserted, 0, 'malformed timestamp cannot bypass stale-update protection');
assert.equal(malformedTimestamp.nextState.salesOrders.length, base.salesOrders.length, 'invalid row does not mutate state');
const invoice = planErpImport(base, 'INVOICE', [{ ...incoming, externalId: 'INV-1', invoiceNumber: 'INV-1' }]);
assert.equal(invoice.summary.inserted, 1);
assert.equal(invoice.nextState.invoices[0].isErpMirror, true);
assert.equal(invoice.nextState.invoices[0].readOnlySource, 'ERP');

let state = base;
let commits = 0;
const adapter = { readState: () => state, commitState: async next => { state = next; commits++; } };
const [first, second] = await Promise.all([
  importErpRecords('SALES_ORDER', [incoming], adapter),
  importErpRecords('SALES_ORDER', [incoming], adapter),
]);
assert.equal(first.persisted, true);
assert.equal(second.persisted, true);
assert.equal(commits, 2);
assert.equal(state.salesOrders.length, 2, 'repeated import must not duplicate an ERP order');
console.log('erpImportService tests passed');
