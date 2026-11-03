export type TaskActivityAction = 'CREATED' | 'UPDATED' | 'REASSIGNED' | 'STARTED' | 'COMPLETED' | 'REOPENED' | 'BLOCKED' | 'UNBLOCKED' | 'RESULT_RECORDED';
export interface TaskActivityEvent {
  id: string;
  action: TaskActivityAction;
  actorId: string;
  at: string;
  summary: string;
  details?: string;
}
export interface TaskActivityLike {
  id?: string;
  activityHistory?: TaskActivityEvent[];
  [key: string]: unknown;
}

/** Append-only local activity helper. Server-side audit remains required for tamper resistance. */
export function appendTaskActivity<T extends TaskActivityLike>(task: T, event: Omit<TaskActivityEvent, 'id' | 'at'> & { id?: string; at?: string }): T {
  const history = Array.isArray(task.activityHistory) ? task.activityHistory : [];
  const id = event.id || `${task.id || 'task'}:${event.action}:${event.at || new Date().toISOString()}:${history.length}`;
  if (history.some(item => item.id === id)) return task;
  const nextEvent: TaskActivityEvent = {
    id,
    action: event.action,
    actorId: String(event.actorId || 'UNKNOWN'),
    at: event.at || new Date().toISOString(),
    summary: String(event.summary || event.action),
    ...(event.details ? { details: String(event.details) } : {})
  };
  return { ...task, activityHistory: [...history, nextEvent] };
}

export function getLatestTaskActivity(task: TaskActivityLike): TaskActivityEvent | null {
  const history = Array.isArray(task.activityHistory) ? task.activityHistory : [];
  if (!history.length) return null;
  return history.reduce((latest, event) => Date.parse(event.at) >= Date.parse(latest.at) ? event : latest);
}
