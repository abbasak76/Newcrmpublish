import { AppState, InternalRequest, InternalMeeting, ActionItem } from '../types';
import { generateId } from './utils';

export function routeInternalRequest(req: InternalRequest, state: AppState) {
  // Finds next assignee or approver
  const currentApprover = state.users?.find(u => u.id !== req.creatorId);
  return currentApprover?.id || state.currentUserId;
}

export function evaluateRequestIntelligence(req: InternalRequest, state: AppState): Array<{ type: 'RISK' | 'ATTENTION' | 'INFO'; message: string }> {
  const signals: Array<{ type: 'RISK' | 'ATTENTION' | 'INFO'; message: string }> = [];

  if (req.type === 'LEAVE') {
    const userLeaves = (state.internalRequests || []).filter((r: InternalRequest) => r.creatorId === req.creatorId && r.type === 'LEAVE' && r.status === 'APPROVED');
    if (userLeaves.length > 5) {
      signals.push({ type: 'ATTENTION', message: `این پرسنل تاکنون ${userLeaves.length} مرخصی تأییدشده در سوابق دارد.` });
    }
  }

  if (req.type === 'ADVANCE') {
    signals.push({ type: 'INFO', message: 'سوابق پرداختی و مساعده در محدوده مجاز برآورد شده است.' });
  }

  return signals;
}

export function notifyMeetingParticipants(meeting: InternalMeeting, state: AppState, updateState: any) {
  updateState((draft: AppState) => {
    if (!draft.notifications) draft.notifications = [];
    (meeting.participantIds || []).forEach(uid => {
      draft.notifications?.push({
        id: generateId(),
        title: `دعوت به جلسه: ${meeting.title}`,
        message: `جلسه کاری در تاریخ ${meeting.date} ساعت ${meeting.startTime} تنظیم شد.`,
        type: 'INFO',
        read: false,
        createdAt: new Date().toISOString(),
        linkTab: 'internal_automation'
      });
    });
  });
}

export function addMeetingActionItem(meetingId: string, item: ActionItem, updateState: any) {
  updateState((draft: AppState) => {
    const meeting = (draft.internalMeetings || []).find((m: InternalMeeting) => m.id === meetingId);
    if (meeting) {
      if (!meeting.actionItems) meeting.actionItems = [];
      meeting.actionItems.push(item);
    }
  });
}

export function reassignInternalRequest(requestId: string, newAssigneeId: string, updateState: any) {
  updateState((draft: AppState) => {
    const req = (draft.internalRequests || []).find((r: InternalRequest) => r.id === requestId);
    if (req) {
      req.currentAssigneeId = newAssigneeId;
      req.updatedAt = new Date().toISOString();
    }
  });
}

export function updateInternalRequestStatus(requestId: string, status: InternalRequest['status'], updateState: any) {
  updateState((draft: AppState) => {
    const req = (draft.internalRequests || []).find((r: InternalRequest) => r.id === requestId);
    if (req) {
      req.status = status;
      req.updatedAt = new Date().toISOString();
    }
  });
}
