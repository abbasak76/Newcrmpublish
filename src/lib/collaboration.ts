import { CustomerTask, AppState, GroupMessage, Mention } from '../types';
import { generateId } from './utils';

export function processTaskCollaborationEvents(
  task: CustomerTask,
  state: AppState,
  draft: AppState,
  isNew: boolean
): void {
  if (!draft.notifications) draft.notifications = [];
  if (isNew && task.assigneeId && task.assigneeId !== state.currentUserId) {
    draft.notifications.push({
      id: generateId(),
      title: 'وظیفه جدید ارجاع شد',
      message: `وظیفه "${task.title}" به شما ارجاع گردید.`,
      type: 'INFO',
      read: false,
      createdAt: new Date().toISOString(),
      linkTab: 'tasks',
      recipientId: task.assigneeType === 'GROUP' ? undefined : task.assigneeId,
    });
  }
}

export function processEntityMentions(
  entityTitle: string,
  entityTypeName: string,
  mentions: Mention[] | undefined,
  state: AppState,
  draft: AppState,
  targetTab: string = 'tasks'
): void {
  if (!mentions || mentions.length === 0) return;
  if (!draft.notifications) draft.notifications = [];

  const currentUser = state.users?.find(u => u.id === state.currentUserId);
  const senderName = currentUser?.name || 'یکی از همکاران';

  mentions.forEach(m => {
    if (m.type === 'USER' && m.id !== state.currentUserId) {
      draft.notifications!.push({
        id: generateId(),
        title: `اشاره به شما در ${entityTypeName}`,
        message: `${senderName} شما را در "${entityTitle}" منشن کرد.`,
        type: 'INFO',
        read: false,
        createdAt: new Date().toISOString(),
        linkTab: targetTab,
        recipientId: m.id
      });
    }
  });
}

export function processMessageMentions(
  message: GroupMessage,
  groupName: string,
  state: AppState,
  draft: AppState
): void {
  if (!message.mentions || message.mentions.length === 0) return;
  if (!draft.notifications) draft.notifications = [];

  const sender = state.users?.find(u => u.id === message.senderId);
  const senderName = sender?.name || 'همکار';

  message.mentions.forEach(m => {
    if (m.type === 'USER' && m.id !== message.senderId) {
      draft.notifications!.push({
        id: generateId(),
        title: `پیام جدید در گروه ${groupName}`,
        message: `${senderName} شما را در پیام گروهی منشن کرد: "${message.content.slice(0, 50)}..."`,
        type: 'INFO',
        read: false,
        createdAt: new Date().toISOString(),
        linkTab: 'groups',
        recipientId: m.id
      });
    }
  });
}
