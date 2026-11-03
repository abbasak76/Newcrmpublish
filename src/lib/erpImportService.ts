import { externalIdentityKey, upsertExternalRecords } from './phase2Flow.ts';

export type ErpEntityType = 'SALES_ORDER' | 'INVOICE';
export interface ErpImportRecord extends Record<string, any> {
  tenantId: string;
  sourceSystemCode: string;
  externalId: string;
  sourceModifiedAtUtc?: string;
}
export interface ErpImportSummary {
  entityType: ErpEntityType;
  received: number;
  inserted: number;
  updated: number;
  skippedStale: number;
  conflicts: number;
  persisted: boolean;
}

const COLLECTIONS: Record<ErpEntityType, string> = {
  SALES_ORDER: 'salesOrders',
  INVOICE: 'invoices',
};

function normalizeRecord(entityType: ErpEntityType, source: ErpImportRecord) {
  const externalId = String(source.externalId ?? source.externalOrderId ?? source.externalInvoiceId ?? source.externalId ?? '').trim();
  const tenantId = String(source.tenantId ?? '').trim();
  const sourceSystemCode = String(source.sourceSystemCode ?? '').trim().toUpperCase();
  const modifiedAt = source.sourceModifiedAtUtc;
  // A supplied source timestamp is part of stale-update protection. Reject malformed
  // timestamps instead of silently letting them bypass the ordering guard.
  if (modifiedAt != null && String(modifiedAt).trim() !== '' && !Number.isFinite(Date.parse(String(modifiedAt)))) return null;
  if (!tenantId || !sourceSystemCode || !externalId) return null;
  return {
    ...source,
    id: String(source.id ?? `${sourceSystemCode}:${entityType}:${externalId}`),
    tenantId,
    sourceSystemCode,
    entityType,
    externalId,
    ...(entityType === 'SALES_ORDER' ? { externalOrderId: externalId, origin: source.origin ?? 'ERP' } : { externalInvoiceId: externalId, isErpMirror: true, readOnlySource: 'ERP' }),
  };
}

/** Pure transaction planner used by the persisted app adapter and deterministic tests. */
export function planErpImport(state: Record<string, any>, entityType: ErpEntityType, incoming: ErpImportRecord[]) {
  const collectionName = COLLECTIONS[entityType];
  const rawExisting = Array.isArray(state[collectionName]) ? state[collectionName] : [];
  const existing = rawExisting.map((record: any) => {
    const externalId = record?.externalId ?? record?.externalOrderId ?? record?.externalInvoiceId;
    if (!externalId || !record?.tenantId || !record?.sourceSystemCode) return record;
    return normalizeRecord(entityType, { ...record, externalId, tenantId: record.tenantId, sourceSystemCode: record.sourceSystemCode });
  }).map((record: any, index: number) => record ?? rawExisting[index]);
  const normalized = incoming.map(record => normalizeRecord(entityType, record));
  const invalid = normalized.filter(record => record === null).length;
  const valid = normalized.filter((record): record is NonNullable<typeof record> => record !== null);
  const result = upsertExternalRecords(existing, valid, {
    externalIdField: 'externalId',
    typeField: 'entityType',
  });
  return {
    nextState: { ...state, [collectionName]: result.records },
    summary: {
      entityType,
      received: incoming.length,
      inserted: result.inserted,
      updated: result.updated,
      skippedStale: result.skippedStale,
      conflicts: result.conflicts + invalid,
      persisted: false,
    } satisfies ErpImportSummary,
  };
}

let importQueue: Promise<unknown> = Promise.resolve();
/** Serializes imports in this browser tab and commits the complete merged app state via Zustand persistence. */
export function importErpRecords(entityType: ErpEntityType, incoming: ErpImportRecord[], adapter: {
  readState: () => Record<string, any>;
  commitState: (nextState: Record<string, any>) => Promise<void> | void;
}): Promise<ErpImportSummary> {
  const run = async () => {
    const current = adapter.readState();
    const planned = planErpImport(current, entityType, incoming);
    if (planned.summary.conflicts > 0 && planned.summary.inserted === 0 && planned.summary.updated === 0 && planned.summary.skippedStale === 0) {
      return planned.summary;
    }
    await adapter.commitState(planned.nextState);
    return { ...planned.summary, persisted: true };
  };
  const result = importQueue.then(run, run);
  importQueue = result.then(() => undefined, () => undefined);
  return result;
}

/** Runtime entry point wired to the app's real persisted Zustand store. */
export async function importErpIntoApp(entityType: ErpEntityType, incoming: ErpImportRecord[]) {
  const { useAppStore } = await import('./storage.ts');
  return importErpRecords(entityType, incoming, {
    readState: () => useAppStore.getState().state as unknown as Record<string, any>,
    commitState: (nextState) => useAppStore.getState().updateState(() => nextState as any),
  });
}

export function getErpIdentity(record: ErpImportRecord, entityType: ErpEntityType) {
  return externalIdentityKey({ tenantId: record.tenantId, sourceSystemCode: record.sourceSystemCode, entityType, externalId: String(record.externalId ?? record.externalOrderId ?? record.externalInvoiceId ?? '') });
}
