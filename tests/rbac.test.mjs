// اجرا: node tests/rbac.test.mjs  (Node >= 22؛ بدون وابستگی) — تست واقعی ماتریس مجوز روی RBACService
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import assert from 'node:assert/strict';
const src = fs.readFileSync(new URL('../src/lib/rbac.ts', import.meta.url), 'utf8').replace(/import \{[^}]*\} from '\.\.\/types';/, '');
const tmp = path.join(os.tmpdir(), `rbac-${Date.now()}.ts`); fs.writeFileSync(tmp, 'type AppState=any;type CapabilityPermission=string;type UserAccount=any;type NavigationTab=string;\n' + src);
const { RBACService, PERMISSION_MATRIX, PERMISSION_ACTIONS } = await import(tmp);

const permSets = [
  { id: 'ps_ceo', permissions: ['accounts.view','accounts.edit','accounts.delete','leads.view','leads.edit','quotes.view','quotes.create','quotes.approve','finance.view','finance.manage','cases.view','cases.edit','internal.view','internal.manage','settings.manage','users.manage','roles.manage'] },
  { id: 'ps_mgr', permissions: ['accounts.view','accounts.edit','leads.view','leads.edit','quotes.view','quotes.create','quotes.approve','finance.view','internal.view'] },
  { id: 'ps_sup', permissions: ['accounts.view','accounts.edit','leads.view','quotes.view','quotes.create','internal.view'] },
  { id: 'ps_vis', permissions: ['accounts.view','leads.view','quotes.view','internal.view'] },
  { id: 'ps_explicit', permissions: ['accounts.view','tasks.assign'] },
];
const roles = [{ id: 'r_ceo', visibilityScope: 'ORG' }, { id: 'r_mgr', visibilityScope: 'BRANCH' }, { id: 'r_sup', visibilityScope: 'TEAM' }, { id: 'r_vis', visibilityScope: 'OWNER' }, { id: 'r_ter', visibilityScope: 'TERRITORY' }];
const users = [
  { id: 'ceo', roleId: 'r_ceo', permissionSetId: 'ps_ceo' },
  { id: 'mgr', roleId: 'r_mgr', permissionSetId: 'ps_mgr', branchId: 'b1' },
  { id: 'sup', roleId: 'r_sup', permissionSetId: 'ps_sup', teamId: 't1' },
  { id: 'vis', roleId: 'r_vis', permissionSetId: 'ps_vis' },
  { id: 'ter', roleId: 'r_ter', permissionSetId: 'ps_vis', territoryId: 'z1' },
  { id: 'off', roleId: 'r_ceo', permissionSetId: 'ps_ceo', isActive: false },
  { id: 'xpl', roleId: 'r_vis', permissionSetId: 'ps_explicit' },
  { id: 'orphan', roleId: 'r_missing', permissionSetId: 'ps_ceo' },
];
const as = (id, extra = {}) => new RBACService({ users, roles, permissionSets: permSets, currentUserId: id, ...extra });
let n = 0; const eq_ = (a, b, m) => { assert.equal(a, b, m); n++; }; const ok = (c, m) => { assert.ok(c, m); n++; }; const no = (c, m) => { assert.ok(!c, m); n++; };

// --- عملیات مستقل ---
ok(as('ceo').can('accounts', 'VIEW'), 'CEO VIEW accounts'); ok(as('ceo').can('accounts', 'SOFT_DELETE'), 'CEO soft-delete accounts');
no(as('mgr').can('accounts', 'SOFT_DELETE'), 'مدیر فروش حذف حساب ندارد'); ok(as('mgr').can('quotes', 'APPROVE'), 'مدیر فروش تایید پیش‌فاکتور');
no(as('sup').can('quotes', 'APPROVE'), 'سرپرست تایید ندارد'); ok(as('sup').can('quotes', 'CREATE'), 'سرپرست صدور دارد');
no(as('vis').can('quotes', 'CREATE'), 'ویزیتور صدور ندارد'); no(as('vis').can('finance', 'VIEW'), 'ویزیتور مالی نمی‌بیند');
no(as('mgr').can('finance', 'ALLOCATE'), 'تخصیص پرداخت جدا از مشاهده است'); ok(as('ceo').can('payments', 'ALLOCATE'), 'CEO تخصیص');
no(as('vis').can('tasks', 'ASSIGN'), 'ویزیتور ارجاع وظیفه ندارد'); ok(as('xpl').can('tasks', 'ASSIGN'), 'کلید صریح tasks.assign کار می‌کند');
no(as('vis').can('groups', 'CREATE'), 'ساخت گروه نیازمند مجوز مدیریتی'); ok(as('ceo').can('groups', 'CREATE'), 'CEO ساخت گروه');
no(as('vis').can('reports', 'EDIT'), 'ترکیب تعریف‌نشده = رد'); no(as('ceo').can('reports', 'APPROVE'), 'ترکیب تعریف‌نشده حتی برای CEO = رد');
no(as('off').can('accounts', 'VIEW'), 'کاربر غیرفعال'); no(as('orphan').canActOnRecord('accounts', 'VIEW', {}), 'نقش ناموجود = رد');
no(as(undefined).can('accounts', 'VIEW'), 'بدون کاربر جاری'); no(as('nobody').can('accounts', 'VIEW'), 'کاربر ناشناس (بدون fallback به اولین کاربر)');
// --- Scope ---
ok(as('ceo').canActOnRecord('accounts', 'EDIT', { ownerId: 'x' }), 'ORG همه چیز'); ok(as('mgr').canActOnRecord('accounts', 'EDIT', { branchId: 'b1' }), 'BRANCH همان شعبه');
no(as('mgr').canActOnRecord('accounts', 'EDIT', { branchId: 'b2' }), 'BRANCH شعبه دیگر'); no(as('mgr').canActOnRecord('accounts', 'EDIT', {}), 'BRANCH بدون branchId رکورد = رد امن');
ok(as('sup').canActOnRecord('accounts', 'EDIT', { teamId: 't1' }), 'TEAM همان تیم'); no(as('sup').canActOnRecord('accounts', 'EDIT', { teamId: 't2' }), 'TEAM تیم دیگر');
no(as('sup').canActOnRecord('accounts', 'VIEW', { ownerId: 'sup' }), 'TEAM از مالکیت استنباط نمی‌شود (teamId رکورد الزامی است)');
ok(as('vis').canActOnRecord('accounts', 'VIEW', { ownerId: 'vis' }), 'OWNER مال خودش'); no(as('vis').canActOnRecord('accounts', 'VIEW', { ownerId: 'other' }), 'OWNER مال دیگری');
ok(as('ter').canActOnRecord('accounts', 'VIEW', { territoryId: 'z1' }), 'TERRITORY'); no(as('ter').canActOnRecord('accounts', 'VIEW', { territoryId: 'z2' }), 'TERRITORY دیگر');
// --- Tenant / حذف منطقی ---
no(as('ceo').canActOnRecord('accounts', 'VIEW', { tenantId: 'A' }), 'رکورد دارای tenant و کاربر بدون tenant = رد');
ok(as('ceo', { tenantId: 'A' }).canActOnRecord('accounts', 'VIEW', { tenantId: 'A' }), 'tenant یکسان'); no(as('ceo', { tenantId: 'A' }).canActOnRecord('accounts', 'VIEW', { tenantId: 'B' }), 'tenant متفاوت');
no(as('ceo').canActOnRecord('accounts', 'EDIT', { deletedAt: '2026-01-01' }), 'ویرایش رکورد حذف‌شده'); ok(as('ceo').canActOnRecord('accounts', 'VIEW', { deletedAt: '2026-01-01' }), 'مشاهده رکورد حذف‌شده (سابقه)');
// --- چت: عضویت و مالکیت پیام ---
const grp = { memberIds: ['vis', 'sup'], managerId: 'sup' };
no(as('ceo').canActOnRecord('groups', 'VIEW', grp), 'مدیرعامل عضو نیست = گفتگو را نمی‌بیند'); no(as('ceo').canActOnRecord('messages', 'VIEW', grp), 'مدیر سیستم پیام خصوصی را نمی‌بیند');
ok(as('vis').canActOnRecord('messages', 'VIEW', grp), 'عضو می‌بیند'); ok(as('vis').canActOnRecord('messages', 'EDIT', { ...grp, ownerId: 'vis' }), 'ویرایش پیام خود');
no(as('vis').canActOnRecord('messages', 'EDIT', { ...grp, ownerId: 'sup' }), 'ویرایش پیام دیگران'); no(as('vis').canActOnRecord('messages', 'SOFT_DELETE', { ...grp, ownerId: 'sup' }), 'عضو عادی پیام دیگران را حذف نمی‌کند');
ok(as('sup').canActOnRecord('messages', 'SOFT_DELETE', { ...grp, ownerId: 'vis' }), 'مدیر گفتگو (صریح) حذف نرم');
no(as('vis').canActOnRecord('groups', 'EDIT', grp), 'عضویت = مجوز مدیریتی نیست'); ok(as('sup').canActOnRecord('groups', 'EDIT', grp), 'مدیر گروه');
// --- Field visibility (fail-closed وقتی پیکربندی شده) ---
const fpSets = [...permSets, { id: 'ps_fp', permissions: ['accounts.view'], fieldPermissions: { 'account.phone': 'SEE', 'account.*': 'HIDDEN', 'quote.*': 'DO' } }];
const fpUsers = [...users, { id: 'fp', roleId: 'r_vis', permissionSetId: 'ps_fp' }];
const asFp = id => new RBACService({ users: fpUsers, roles, permissionSets: fpSets, currentUserId: id });
eq_(asFp('fp').getFieldVisibility('account', 'phone'), 'SEE', 'کلید صریح'); eq_(asFp('fp').getFieldVisibility('account', 'creditLimit'), 'HIDDEN', 'entity.* = HIDDEN'); eq_(asFp('fp').getFieldVisibility('quote', 'anything'), 'DO', 'entity.* = DO'); eq_(asFp('fp').getFieldVisibility('invoice', 'x'), 'HIDDEN', 'ناشناخته در مجموعه پیکربندی‌شده = HIDDEN');
eq_(as('ceo').getFieldVisibility('account', 'phone'), 'DO', 'fieldPermissions پیکربندی نشده = رفتار قبلی'); eq_(as('nobody').getFieldVisibility('account', 'phone'), 'HIDDEN', 'بدون کاربر');
// --- ماتریس کامل: هر ترکیب فقط با مجوز مصوب ---
let combos = 0; for (const m of Object.keys(PERMISSION_MATRIX)) for (const a of PERMISSION_ACTIONS) { combos++; const r = as('off').can(m, a); no(r, `inactive ${m}.${a}`); }
console.log(`PASS: ${n} assertions, ${combos} matrix combos (inactive-user deny sweep)`);
