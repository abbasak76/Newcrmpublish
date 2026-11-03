import type { AppState, UserAccount } from '../types';

export type TaskAccessLevel = 'NONE' | 'METRICS_ONLY' | 'FULL_DETAILS';
export interface TaskAccessGrant { viewerId: string; targetUserId: string; level: TaskAccessLevel; expiresAt?: string | null; revokedAt?: string | null; taskId?: string | null; }
export interface TaskAccessContext { currentUserId: string; creatorId?: string; assigneeId?: string; parentTaskId?: string; grants?: readonly TaskAccessGrant[]; now?: Date; }

function userManagerId(user: UserAccount): string | undefined { return typeof (user as any).managerId === 'string' ? (user as any).managerId : undefined; }
export function getManagerChain(users: readonly UserAccount[], userId: string, maxDepth = 32): string[] {
  const byId = new Map(users.map(user => [user.id, user])); const seen = new Set<string>(); const chain: string[] = [];
  let cursor = byId.get(userId);
  while (cursor && chain.length < maxDepth) {
    const managerId = userManagerId(cursor);
    if (!managerId || seen.has(managerId) || managerId === userId) break;
    seen.add(managerId); chain.push(managerId); cursor = byId.get(managerId);
  }
  return chain;
}

/** Local policy helper only; server-side authorization must repeat the same checks. */
export function evaluateTaskAccess(state: AppState, context: TaskAccessContext): TaskAccessLevel {
  const uid = context.currentUserId;
  if (!uid) return 'NONE';
  if (uid === context.creatorId || uid === context.assigneeId) return 'FULL_DETAILS';
  const assignee = (state.users || []).find(u => u.id === context.assigneeId);
  if (assignee && getManagerChain(state.users || [], assignee.id).includes(uid)) return 'FULL_DETAILS';
  const now = (context.now || new Date()).getTime();
  const grant = (context.grants || []).find(g => g.viewerId === uid && (g.targetUserId === context.assigneeId || (!!g.taskId && g.taskId === context.parentTaskId)) && !g.revokedAt && (!g.expiresAt || new Date(g.expiresAt).getTime() > now));
  return grant?.level || 'NONE';
}

export function canCreateCrossDepartmentTask(creator: UserAccount | undefined, assignee: UserAccount | undefined, canAssign: boolean): boolean {
  if (!creator || !assignee || (assignee.isActive ?? assignee.active) === false) return false;
  return creator.id === assignee.id || canAssign;
}
