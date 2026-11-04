import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_TOUR_STEPS,
  WHATS_NEW_ITEMS,
  getStepsForModuleAndRole,
  getAvailableModules
} from '../src/services/tourEngine.ts';

test('Tour Engine: ALL_TOUR_STEPS has valid step structure and non-empty content', () => {
  assert.ok(ALL_TOUR_STEPS.length >= 7, `Expected at least 7 steps, found ${ALL_TOUR_STEPS.length}`);
  ALL_TOUR_STEPS.forEach(step => {
    assert.ok(step.id, 'Step must have an id');
    assert.ok(step.module, 'Step must specify a module');
    assert.ok(step.title, 'Step must have a title');
    assert.ok(step.content, 'Step must have content');
  });
});

test('Tour Engine: role-based step filtering returns appropriate steps for admin vs sales vs finance', () => {
  const adminSteps = getStepsForModuleAndRole('global', 'مدیر سیستم');
  assert.ok(adminSteps.length >= 3, 'Admin should have access to global steps');

  const financeSteps = getStepsForModuleAndRole('finance', 'کارشناس مالی و خزانه‌داری');
  assert.ok(financeSteps.length >= 1, 'Finance user should receive finance steps');
  assert.ok(financeSteps.every(s => s.module === 'finance'), 'All returned steps must belong to finance');

  const salesAccountSteps = getStepsForModuleAndRole('accounts', 'کارشناس فروش');
  assert.ok(salesAccountSteps.some(s => s.id === 'acc-churn-prediction'), 'Sales user should see Churn Prediction step');
});

test('Tour Engine: WHATS_NEW_ITEMS contains b56 new features', () => {
  assert.ok(WHATS_NEW_ITEMS.length >= 2);
  const churnItem = WHATS_NEW_ITEMS.find(i => i.id === 'wn-churn-engine');
  assert.ok(churnItem, 'What\'s new must highlight Churn Prediction engine');
  assert.equal(churnItem.tag, 'NEW');
  assert.ok(churnItem.description.includes('ریزش'));
});

test('Tour Engine: getAvailableModules returns all 7 core modules with valid labels', () => {
  const modules = getAvailableModules();
  assert.equal(modules.length, 7);
  const ids = modules.map(m => m.id);
  assert.ok(ids.includes('global'));
  assert.ok(ids.includes('dashboard'));
  assert.ok(ids.includes('accounts'));
  assert.ok(ids.includes('finance'));
  assert.ok(ids.includes('operations'));
  assert.ok(ids.includes('quotes'));
  assert.ok(ids.includes('tasks'));
});
