/** Shared lifecycle predicates for locally managed CRM records. ERP mirrors remain source-owned. */
export function isRecordDeleted(record: unknown): boolean {
  if (!record || typeof record !== 'object') return false;
  const value = record as Record<string, unknown>;
  return value.isDeleted === true || value.deleted === true || Boolean(value.deletedAt || value.deletedAtUtc || value.DeletedAtUtc);
}

export function activeRecords<T>(records: readonly T[] | null | undefined): T[] {
  return (Array.isArray(records) ? records : []).filter(record => !isRecordDeleted(record));
}

/** Marks a CRM-owned record as deleted without physically removing it or mutating ERP-owned data. */
export function markRecordDeleted<T extends Record<string, unknown>>(record: T, actorId: string, at = new Date().toISOString()): T {
  return { ...record, isDeleted: true, deleted: true, deletedAt: at, deletedBy: actorId, updatedAt: at };
}

/** Restore is explicit and preserves the historical actor/time in audit fields. */
export function restoreRecord<T extends Record<string, unknown>>(record: T, actorId: string, at = new Date().toISOString()): T {
  return { ...record, isDeleted: false, deleted: false, deletedAt: null, deletedBy: null, restoredAt: at, restoredBy: actorId, updatedAt: at };
}
