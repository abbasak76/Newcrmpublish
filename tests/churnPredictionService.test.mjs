import test from 'node:test';
import assert from 'node:assert/strict';
import {
  predictAccountChurn,
  evaluatePortfolioChurn,
  generateChurnMitigationTask
} from '../src/services/churnPredictionService.ts';

test('Customer Churn Prediction Engine: empty state and active account returns LOW risk', () => {
  const account = { id: 'acc-1', name: 'فروشگاه تستی ۱', status: 'ACTIVE', ownerId: 'user-1' };
  const state = {
    accounts: [account],
    quotes: [
      { id: 'q-1', accountId: 'acc-1', status: 'ACCEPTED', totalAmount: 50000000, createdAt: new Date().toISOString() }
    ],
    invoices: [],
    activities: [
      { id: 'a-1', accountId: 'acc-1', dateTime: new Date().toISOString() }
    ],
    cheques: [],
    cases: []
  };

  const result = predictAccountChurn(account, state);
  assert.equal(result.accountId, 'acc-1');
  assert.equal(result.riskTier, 'LOW');
  assert.ok(result.churnScore < 25, `Expected score < 25, got ${result.churnScore}`);
  assert.ok(result.reasons.length > 0);
  assert.ok(result.recommendations.length > 0);
});

test('Customer Churn Prediction Engine: order inactivity > 90 days pushes tier to HIGH / CRITICAL', () => {
  const oldDate = new Date(Date.now() - 100 * 86400000).toISOString();
  const account = { id: 'acc-2', name: 'شرکت پگاه اصفهان', status: 'ACTIVE', ownerId: 'user-2' };
  const state = {
    accounts: [account],
    quotes: [
      { id: 'q-2', accountId: 'acc-2', status: 'ACCEPTED', totalAmount: 100000000, createdAt: oldDate }
    ],
    invoices: [
      { id: 'inv-2', accountId: 'acc-2', balance: 40000000, dueDate: new Date(Date.now() - 70 * 86400000).toISOString().split('T')[0], status: 'UNPAID' }
    ],
    activities: [],
    cheques: [
      { id: 'chq-1', accountId: 'acc-2', status: 'BOUNCED', amount: 20000000 }
    ],
    cases: []
  };

  const result = predictAccountChurn(account, state);
  assert.ok(result.churnScore >= 75, `Expected churnScore >= 75, got ${result.churnScore}`);
  assert.equal(result.riskTier, 'CRITICAL');
  assert.ok(result.reasons.some(r => r.includes('روز')));
  assert.ok(result.reasons.some(r => r.includes('چک')));
  assert.equal(result.suggestedAction.priority, 'CRITICAL');
});

test('Customer Churn Prediction Engine: portfolio evaluation groups and sorts at-risk accounts', () => {
  const acc1 = { id: 'acc-a', name: 'مشتری الف', status: 'ACTIVE' };
  const acc2 = { id: 'acc-b', name: 'مشتری ب', status: 'ACTIVE' };
  const state = {
    accounts: [acc1, acc2],
    quotes: [
      { id: 'q-a', accountId: 'acc-a', status: 'ACCEPTED', totalAmount: 1000000, createdAt: new Date().toISOString() },
      { id: 'q-b', accountId: 'acc-b', status: 'ACCEPTED', totalAmount: 1000000, createdAt: new Date(Date.now() - 95 * 86400000).toISOString() }
    ],
    invoices: [],
    activities: [],
    cheques: [],
    cases: []
  };

  const portfolio = evaluatePortfolioChurn(state);
  assert.equal(portfolio.totalAccounts, 2);
  assert.ok(portfolio.atRiskAccounts.length >= 1);
  assert.equal(portfolio.atRiskAccounts[0].accountId, 'acc-b');
});

test('Customer Churn Prediction Engine: generateChurnMitigationTask creates valid CustomerTask', () => {
  const account = { id: 'acc-x', name: 'هایپرمارکت باران', ownerId: 'user-sales-1' };
  const churnResult = {
    accountId: 'acc-x',
    accountName: 'هایپرمارکت باران',
    churnScore: 85,
    riskTier: 'CRITICAL',
    riskTierLabel: 'بحرانی',
    reasons: ['بیش از ۹۰ روز بدون خرید جدید', 'مطالبات معوق بالای ۶۰ روز'],
    recommendations: ['ارائه تخفیف بازگشت', 'برگزاری جلسه حضوری'],
    suggestedAction: {
      title: 'مداخله فوری جلوگیری از ریزش مشتری: هایپرمارکت باران',
      taskType: 'RETENTION_URGENT',
      priority: 'CRITICAL'
    }
  };

  const task = generateChurnMitigationTask(account, churnResult, 'user-sales-1');
  assert.ok(task.id);
  assert.equal(task.accountId, 'acc-x');
  assert.equal(task.priority, 'CRITICAL');
  assert.equal(task.slaStatus, 'WARNING');
  assert.ok(task.description.includes('بحرانی'));
  assert.ok(task.description.includes('هایپرمارکت باران') || task.title.includes('هایپرمارکت باران'));
});
