/** Central operational defaults. Override through tenant settings when configured. */
export const OPERATIONS_CONFIG = {
  defaultDailyTaskCapacity: 12,
  defaultDailyScoreCapacity: 100,
  defaultWorkingDays: [0, 1, 2, 3, 4, 6] as number[], // Saturday–Thursday, Sunday is 0
  defaultSlaMinutes: { FINANCE: 180, LOGISTICS: 480, SALES: 1440, GENERAL: 1440 } as Record<string, number>,
  taskWeights: { LOW: 1, NORMAL: 3, HIGH: 6, URGENT: 10 } as Record<string, number>,
  mentionCacheTtlMs: 120_000,
  mentionMaxResults: 12,
  searchDebounceMs: 250,
} as const;
