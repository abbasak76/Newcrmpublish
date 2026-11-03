import { AppState, AIAgentLog, ID } from '../types';
import { generateId } from './utils';
import { enqueueJob } from './automation';

export function triggerAgentHooks(event: any, state: AppState, updateState: any) {
  if (state.settings?.aiKillSwitch) return;

  if (event.type === 'OPPORTUNITY_CREATED') {
    const salesAgent = (state.agents || []).find((a: any) => a.type === 'SALES' && a.active);
    if (salesAgent && salesAgent.allowedTools.includes('createTask')) {
      const payload = event.payload;
      if (salesAgent.requiresHumanApproval) {
        logAgentAction(salesAgent.id, event.type, 'createTask', 'AWAITING_APPROVAL', 'سیاست امنیتی نیازمند تایید ناظر انسانی است.', updateState);
      } else {
        enqueueJob('CREATE_TASK', {
          title: `پیگیری سیستمی فرصت: ${payload?.title || 'فرصت جدید'}`,
          accountId: payload?.accountId,
          priority: 'HIGH',
          assigneeType: 'USER',
          assigneeId: state.currentUserId
        }, state, updateState);
        logAgentAction(salesAgent.id, event.type, 'createTask', 'QUEUED', 'وظیفه در صف اجرای داخلی ثبت شد؛ تکمیل پس از پردازش job تأیید می‌شود.', updateState);
      }
    }
  }

  if (event.type === 'PAYMENT_BOUNCED') {
    const collAgent = (state.agents || []).find((a: any) => a.type === 'COLLECTION' && a.active);
    if (collAgent && collAgent.allowedTools.includes('createTask')) {
      enqueueJob('CREATE_TASK', {
        title: `هشدار وصول چک برگشتی: حساب ${event.payload?.accountId}`,
        accountId: event.payload?.accountId,
        priority: 'URGENT',
        assigneeType: 'GROUP'
      }, state, updateState);
      logAgentAction(collAgent.id, event.type, 'createTask', 'QUEUED', 'وظیفه فوری در صف اجرای داخلی ثبت شد؛ تکمیل پس از پردازش job تأیید می‌شود.', updateState);
    }
  }
}

export function executeAgentAction(agentId: string, trigger: string, proposedTool: string, payload: any, state: AppState, updateState: any) {
  const agent = (state.agents || []).find((a: any) => a.id === agentId);
  if (!agent || !agent.active || state.settings?.aiKillSwitch) return;

  if (!agent.allowedTools.includes(proposedTool)) {
    logAgentAction(agentId, trigger, proposedTool, 'REJECTED', 'ابزار درخواستی خارج از ابزارهای مجاز ایجنت است.', updateState);
    return;
  }

  if (agent.requiresHumanApproval) {
    logAgentAction(agentId, trigger, proposedTool, 'AWAITING_APPROVAL', 'نیازمند تایید ناظر انسانی (Human-in-the-loop).', updateState);
    return;
  }

  if (proposedTool === 'createTask' && payload && typeof payload.title === 'string' && payload.title.trim()) {
    enqueueJob('CREATE_TASK', payload, state, updateState);
    logAgentAction(agentId, trigger, proposedTool, 'QUEUED', 'وظیفه در صف اجرای داخلی ثبت شد؛ هنوز تکمیل‌شده محسوب نمی‌شود.', updateState);
    return;
  }

  // Tools without a concrete implementation must never be logged as executed.
  logAgentAction(agentId, trigger, proposedTool, 'NOT_CONFIGURED', `اجرای ابزار «${proposedTool}» در این نسخه handler اجرایی قابل‌راستی‌آزمایی ندارد.`, updateState);
}

function logAgentAction(agentId: ID, trigger: string, actionProposed: string, status: AIAgentLog['status'], reason: string, updateState: any) {
  updateState((draft: AppState) => {
    if (!draft.agentLogs) draft.agentLogs = [];
    draft.agentLogs.push({
      id: generateId(),
      agentId,
      trigger,
      actionProposed,
      actionTaken: status === 'EXECUTED' ? actionProposed : 'NONE',
      status,
      timestamp: new Date().toISOString(),
      reason
    });
  });
}
