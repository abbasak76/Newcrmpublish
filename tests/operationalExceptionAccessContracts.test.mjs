import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/components/TasksWorkspace.tsx', import.meta.url), 'utf8');
assert.match(source, /if \(!can\('finance', 'VIEW'\)\) return false;/, 'financial exceptions must fail closed without finance view permission');
assert.match(source, /canOn\('finance', 'VIEW'/, 'financial exception visibility must respect record scope');
assert.match(source, /canOn\('tasks', 'VIEW'/, 'task exception visibility must respect task record scope');
assert.match(source, /if \(activeAccountId && item\.accountId && item\.accountId !== activeAccountId\) return false;/, 'active account context must constrain exception list');
console.log('operationalExceptionAccessContracts.test.mjs: PASS (4 assertions)');
