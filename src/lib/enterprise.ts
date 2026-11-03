import { Priority, Account, AppState } from '../types';

export function parseTaskIntent(text: string): {
  intent: string;
  reason: string;
  priority: Priority;
} {
  const lower = text.toLowerCase();
  if (lower.includes('فوری') || lower.includes('urgent') || lower.includes('سررسید گذشته')) {
    return { intent: 'URGENT_FOLLOWUP', reason: 'کلمه کلیدی فوری تشخیص داده شد', priority: 'URGENT' };
  }
  if (lower.includes('پیش‌فاکتور') || lower.includes('قرارداد') || lower.includes('مذاکره')) {
    return { intent: 'SALES_OPPORTUNITY', reason: 'مرتبط با فرآیند فروش', priority: 'HIGH' };
  }
  return { intent: 'STANDARD_TASK', reason: 'پیگیری عادی', priority: 'NORMAL' };
}

export function findDuplicateAccounts(accounts: Account[]): Array<{ primary: Account; duplicates: Account[] }> {
  const phoneMap: Record<string, Account[]> = {};
  accounts.forEach(a => {
    if (a.phone && a.phone.trim().length > 6) {
      const p = a.phone.trim();
      if (!phoneMap[p]) phoneMap[p] = [];
      phoneMap[p].push(a);
    }
  });

  const duplicatesList: Array<{ primary: Account; duplicates: Account[] }> = [];
  Object.values(phoneMap).forEach(list => {
    if (list.length > 1) {
      duplicatesList.push({
        primary: list[0],
        duplicates: list.slice(1)
      });
    }
  });

  return duplicatesList;
}

export function mergeAccounts(
  primaryId: string, 
  dupId: string, 
  state: AppState, 
  updateState: (updater: (draft: AppState) => AppState | void) => void
): void {
  updateState(draft => {
    // Re-point quotes
    (draft.quotes || []).forEach((q: any) => {
      if (q.accountId === dupId || q.customerId === dupId) {
        q.accountId = primaryId;
        q.customerId = primaryId;
      }
    });

    // Re-point tasks
    (draft.tasks || []).forEach((t: any) => {
      if (t.accountId === dupId || t.customerId === dupId) {
        t.accountId = primaryId;
        t.customerId = primaryId;
      }
    });

    // Re-point activities
    (draft.activities || []).forEach((a: any) => {
      if (a.accountId === dupId || a.customerId === dupId) {
        a.accountId = primaryId;
        a.customerId = primaryId;
      }
    });

    // Re-point payments
    (draft.payments || []).forEach((p: any) => {
      if (p.accountId === dupId || p.customerId === dupId) {
        p.accountId = primaryId;
        p.customerId = primaryId;
      }
    });

    // Re-point opportunities
    (draft.opportunities || []).forEach((o: any) => {
      if (o.accountId === dupId) {
        o.accountId = primaryId;
      }
    });

    // Re-point cases
    (draft.cases || []).forEach((c: any) => {
      if (c.accountId === dupId) {
        c.accountId = primaryId;
      }
    });

    // Remove duplicate account
    draft.accounts = (draft.accounts || []).filter((a: any) => a.id !== dupId);
  });
}

export function exportCsv(rows: any[], headers: string[]): string {
  if (!rows || rows.length === 0) return headers.join(',') + '\n';
  
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    const values = headers.map(h => {
      const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csv += values.join(',') + '\n';
  });
  
  return csv;
}
