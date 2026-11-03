import { AppState, Segment, ID, Account } from '../types';

export function getSegmentMembers(segmentId: ID, state: AppState): ID[] {
  const segment = (state.segments || []).find((s: any) => s.id === segmentId);
  if (!segment || !segment.active) return [];

  const matchedAccountIds: ID[] = [];
  (state.accounts || []).forEach(account => {
    const isMatch = evaluateRules(account, segment, state);
    if (isMatch) matchedAccountIds.push(account.id);
  });
  return matchedAccountIds;
}

function evaluateRules(account: Account, segment: Segment, state: AppState): boolean {
  if (!segment.rules || segment.rules.length === 0) return true;
  const results = segment.rules.map(rule => evaluateSingleRule(account, rule, state));
  if (segment.matchType === 'ALL') return results.every(res => res === true);
  else return results.some(res => res === true);
}

function evaluateSingleRule(account: Account, rule: any, state: AppState): boolean {
  let fieldValue: any;
  if (rule.field.startsWith('Account.')) {
    const key = rule.field.split('.')[1] as keyof Account;
    fieldValue = account[key];
  } else if (rule.field === 'Calculated.DaysSinceLastOrder') {
    const quotes = (state.quotes || []).filter(q => q.accountId === account.id && q.status === 'APPROVED');
    if (quotes.length === 0) return rule.operator === 'not_exists';
    const lastDate = new Date(Math.max(...quotes.map(q => new Date(q.createdAt).getTime())));
    const days = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 3600 * 24));
    fieldValue = days;
  } else if (rule.field === 'Calculated.OverdueDebt') {
    const quotes = (state.quotes || []).filter(q => q.accountId === account.id && q.status === 'APPROVED').reduce((sum, q) => sum + q.totalAmount, 0);
    const paid = (state.payments || []).filter(p => p.accountId === account.id && (p.status as any) !== 'BOUNCED').reduce((sum, p) => sum + p.amount, 0);
    fieldValue = Math.max(0, quotes - paid);
  } else if (rule.field in account) {
    fieldValue = (account as any)[rule.field];
  }

  switch (rule.operator) {
    case '=': return fieldValue == rule.value;
    case '!=': return fieldValue != rule.value;
    case '>': return Number(fieldValue) > Number(rule.value);
    case '>=': return Number(fieldValue) >= Number(rule.value);
    case '<': return Number(fieldValue) < Number(rule.value);
    case '<=': return Number(fieldValue) <= Number(rule.value);
    case 'contains': return String(fieldValue || '').includes(String(rule.value));
    case 'not_contains': return !String(fieldValue || '').includes(String(rule.value));
    case 'exists': return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    case 'not_exists': return fieldValue === undefined || fieldValue === null || fieldValue === '';
    default: return false;
  }
}
