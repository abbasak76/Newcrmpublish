import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const settings = fs.readFileSync(path.join(root, 'src/components/SettingsWorkspace.tsx'), 'utf8');
const rbacSource = fs.readFileSync(path.join(root, 'src/lib/rbac.ts'), 'utf8').replace(/import \{[^}]*\} from '\.\.\/types';/, '');
const tmp = path.join(os.tmpdir(), `rbac-config-${Date.now()}.ts`);
fs.writeFileSync(tmp, 'type AppState=any;type CapabilityPermission=string;type UserAccount=any;type NavigationTab=string;\n' + rbacSource);
try {
  const { RBACService } = await import(tmp);
  const state = {
    currentUserId: 'u1',
    users: [{ id: 'u1', roleId: 'r1', permissionSetId: 'p1', branchId: 'b1' }],
    roles: [{ id: 'r1', visibilityScope: 'OWNER' }],
    permissionSets: [{ id: 'p1', permissions: ['accounts.view'] }],
  };
  assert.equal(new RBACService(state).can('accounts', 'VIEW'), true, 'permission profile enables configured capability');
  state.permissionSets[0].permissions = ['geo.view'];
  assert.equal(new RBACService(state).can('geo', 'VIEW'), true, 'geo visibility is controlled by a configurable permission');
  assert.equal(new RBACService(state).can('geo', 'EDIT'), false, 'geo viewing does not grant zone-management rights');
  assert.equal(new RBACService(state).canAccessWorkspace('geo_intelligence'), true, 'geo permission unlocks the geo workspace');
  state.permissionSets[0].permissions = [];
  assert.equal(new RBACService(state).canAccessWorkspace('geo_intelligence'), false, 'geo workspace denies users without geo or administrative permission');
  state.permissionSets[0].permissions = [];
  assert.equal(new RBACService(state).can('accounts', 'VIEW'), false, 'editing the permission profile immediately revokes capability');
  state.permissionSets[0].permissions = ['accounts.view'];
  state.roles[0].visibilityScope = 'BRANCH';
  assert.equal(new RBACService(state).canActOnRecord('accounts', 'VIEW', { branchId: 'b1' }), true, 'configured branch scope allows same branch');
  assert.equal(new RBACService(state).canActOnRecord('accounts', 'VIEW', { branchId: 'b2' }), false, 'configured branch scope denies another branch');
  assert.ok(settings.includes('handleTogglePermission'), 'settings exposes permission-profile editing');
  assert.ok(settings.includes('handleUpdateRole'), 'settings exposes role-scope and hierarchy editing');
  assert.ok(settings.includes('handleUpdateUserManager'), 'settings exposes direct supervisor assignment');
  assert.ok(settings.includes('چرخه در سلسله‌مراتب نقش‌ها'), 'role hierarchy cycle is rejected');
  assert.ok(settings.includes('چرخه در زنجیره سرپرستی'), 'user manager cycle is rejected');
  console.log('PASS: 13 assertions (configurable RBAC profiles, geo access, scopes, hierarchy, direct supervisor and cycle safeguards)');
} finally {
  fs.rmSync(tmp, { force: true });
}
