import { AppState } from '../types';

export function emitBusinessEvent(
  eventType: string,
  entityType: string,
  entityId: string,
  payload: any,
  state: AppState,
  updateState: (updater: (draft: AppState) => AppState | void) => void
): void {
  updateState(draft => {
    if (!draft.businessEvents) draft.businessEvents = [];
    draft.businessEvents.push({
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: eventType,
      title: `${entityType}: ${eventType}`,
      timestamp: new Date().toISOString(),
      entityId,
      payload,
    });
  });
}
