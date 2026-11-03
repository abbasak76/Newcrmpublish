import { useEffect, useRef } from 'react';
import { AppState } from '../types';
import { generateId } from '../lib/utils';
import { processPendingJobs, evaluateAutomations } from '../lib/automation';
import { triggerAgentHooks } from '../lib/agents';
import { getHighValueQuoteThreshold } from '../lib/orgPolicy';
import { computeTaskReminders, localDateStr, slaFromDue } from '../lib/reminders';

export function useWorkflowEngine(state: AppState, updateState: any) {
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let timeoutId: number;

    const runEngine = async () => {
      if (!stateRef.current) return;

      // ارزیابی قوانین اتوماسیون برای رویدادهای تازه (یک‌بار؛ رویدادهای قدیمی‌تر از ۲۴ ساعت بی‌صدا علامت می‌خورند تا انبوه اجرا نشود)
      {
        const nowMs = Date.now();
        const fresh = (stateRef.current.businessEvents || []).filter((e: any) => !e.automationProcessedAt);
        if (fresh.length > 0) {
          const ids = new Set(fresh.map((e: any) => e.id));
          updateState((draft: AppState) => {
            (draft.businessEvents || []).forEach((e: any) => { if (ids.has(e.id)) e.automationProcessedAt = new Date().toISOString(); });
          });
          fresh
            .filter((e: any) => !e.timestamp || nowMs - new Date(e.timestamp).getTime() < 86400000)
            .forEach((e: any) => {
              evaluateAutomations(e, stateRef.current, updateState);
              triggerAgentHooks({ type: e.type, payload: e.payload }, stateRef.current, updateState); // کلید توقف AI داخل خود تابع بررسی می‌شود
            });
        }
      }

      await processPendingJobs(stateRef.current, updateState);

      updateState((draft: AppState) => {
        let stateChanged = false;
        const tz = (draft.settings as any)?.timeZone as string | undefined;
        const now = new Date();
        const today = localDateStr(now, tz);

        if (!draft.notifications) draft.notifications = [];
        if (!draft.tasks) draft.tasks = [];

        draft.tasks.filter(t => t.status !== 'COMPLETED').forEach(task => {
          const calculatedSla = slaFromDue(task.dueDate, today);

          if (task.slaStatus !== calculatedSla) {
            task.slaStatus = calculatedSla;
            stateChanged = true;
          }
        });

        // یادآوری‌های ۷/۲/۰ روز، معوق و Escalation — ضدتکرار با reminderLog؛ گیرنده واقعی روی اعلان ثبت می‌شود
        if (!draft.reminderLog) draft.reminderLog = {};
        computeTaskReminders(draft, now, tz).forEach(ev => {
          draft.reminderLog![ev.key] = now.toISOString();
          draft.notifications!.push({ id: generateId(), title: ev.title, message: ev.message, type: ev.type, read: false, createdAt: now.toISOString(), linkTab: 'tasks', recipientId: ev.recipientId, dedupeKey: ev.key, entityId: ev.taskId });
          stateChanged = true;
        });
        // لغو یادآوری‌های خوانده‌نشده برای وظایف تکمیل‌شده
        const doneIds = new Set((draft.tasks || []).filter(t => t.status === 'COMPLETED').map(t => t.id));
        draft.notifications!.forEach(n => { if (!n.read && n.dedupeKey && n.entityId && doneIds.has(n.entityId)) { n.read = true; stateChanged = true; } });

        const threshold = getHighValueQuoteThreshold(draft);
        (draft.quotes || []).filter(q => q.totalAmount > threshold && q.status === 'DRAFT').forEach(quote => {
          const alreadyNotified = draft.notifications!.some(n => n.title?.includes(quote.quoteNumber));
          if (!alreadyNotified) {
            draft.notifications!.push({
              id: generateId(),
              title: `پیش‌فاکتور با ارزش بالا (${quote.quoteNumber})`,
              message: `پیش‌فاکتور جدید به ارزش ${new Intl.NumberFormat('fa-IR').format(quote.totalAmount)} ریال ثبت شده است.`,
              type: 'INFO',
              read: false,
              createdAt: new Date().toISOString(),
              linkTab: 'quotes'
            });
            stateChanged = true;
          }
        });

        return stateChanged ? draft : false;
      });

      timeoutId = window.setTimeout(runEngine, 30000);
    };

    timeoutId = window.setTimeout(runEngine, 5000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [updateState]);
}
