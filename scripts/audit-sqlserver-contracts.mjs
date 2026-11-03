#!/usr/bin/env node
/**
 * Static guardrail for the SQL Server v1 model. This does not execute SQL and
 * cannot replace SQL Server integration/security tests; it catches common
 * source-level drift before a migration is reviewed or applied.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const sqlDir = path.join(root, 'database', 'sqlserver', 'v1');
const files = fs.readdirSync(sqlDir).filter((name) => name.endsWith('.sql')).sort();
const errors = [];
const warnings = [];
const tables = new Map();
const allSql = [];

if (files.length === 0) {
  console.error(`FAIL: no SQL files found at ${sqlDir}`);
  process.exit(2);
}

for (const file of files) {
  const source = fs.readFileSync(path.join(sqlDir, file), 'utf8');
  allSql.push(source);
  // Permit indentation before a closing parenthesis. Migration 008 intentionally nests CREATE TABLE inside IF/BEGIN blocks.
  const tableRegex = /CREATE\s+TABLE\s+([\w]+\.[\w]+)\s*\(([\s\S]*?)\n\s*\);/gi;
  for (const match of source.matchAll(tableRegex)) {
    const name = match[1];
    const body = match[2];
    if (tables.has(name)) errors.push(`Duplicate CREATE TABLE: ${name} (${file}, first in ${tables.get(name).file})`);
    tables.set(name, { file, body, hasTenantId: /(?:^|,)\s*TenantId\s+uniqueidentifier\b/i.test(body.replace(/\r/g, '')) || /\bTenantId\s+uniqueidentifier\b/i.test(body) });
  }
}

const combined = allSql.join('\n');
const policyFile = files.find((name) => name.startsWith('006_'));
if (!policyFile) errors.push('Missing 006 Row-Level Security policy script.');
const policySql = policyFile ? fs.readFileSync(path.join(sqlDir, policyFile), 'utf8') : '';
const policySources = [policySql, ...allSql.filter((source) => /ALTER\s+SECURITY\s+POLICY/i.test(source))].join('\n');
const policyTargets = new Set([...policySources.matchAll(/FILTER\s+PREDICATE[\s\S]*?\bON\s+([\w]+\.[\w]+)/gi)].map((match) => match[1]));

for (const [name, meta] of tables) {
  if (meta.hasTenantId && !policyTargets.has(name)) errors.push(`Tenant-scoped table is not listed in RLS policy: ${name} (${meta.file})`);
  if (policyTargets.has(name) && !meta.hasTenantId) errors.push(`RLS policy targets a table without a TenantId column: ${name}`);
}
for (const target of policyTargets) {
  if (!tables.has(target)) errors.push(`RLS policy references a table not created by v1 scripts: ${target}`);
}

if (!/SESSION_CONTEXT\s*\(\s*N?'TenantId'\s*\)/i.test(policySql)) errors.push('RLS predicate does not read TenantId from SESSION_CONTEXT.');
if (!/WITH\s*\(\s*STATE\s*=\s*ON/i.test(policySql)) errors.push('RLS policy is not explicitly enabled.');

const requiredViews = [
  'analytics.vw_InvoiceBalance',
  'analytics.vw_AccountReceivable',
  'analytics.vw_FactSalesLine',
  'analytics.vw_SalesKpiDaily',
  'analytics.vw_SalesProfitCoverage',
];
for (const view of requiredViews) {
  const escaped = view.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`CREATE\\s+OR\\s+ALTER\\s+VIEW\\s+${escaped}`, 'i').test(combined)) errors.push(`Missing required semantic view: ${view}`);
}

if (/CREATE\s+TABLE\s+(?:analytics\.)?(?:InvoiceBalance|AccountReceivable|SalesKpiDaily|SalesProfitCoverage)\b/i.test(combined)) {
  errors.push('A derived finance/KPI result appears to be persisted as a second source-of-truth table; prefer the canonical views.');
}
if (!/CREATE\s+TABLE\s+analytics\.KpiDefinition\b/i.test(combined)) errors.push('Missing versioned KPI definition catalog.');
if (!/CREATE\s+TABLE\s+integration\.ExternalIdentityMap\b/i.test(combined)) errors.push('Missing external ID mapping table.');
if (!/CREATE\s+TABLE\s+integration\.FieldOwnership\b/i.test(combined)) errors.push('Missing field ownership registry.');
if (!/CREATE\s+TABLE\s+integration\.OutboxMessage\b/i.test(combined)) errors.push('Missing transactional outbox table.');

const rawCreateTableMatches = [...combined.matchAll(/\bCREATE\s+TABLE\s+([\w]+\.[\w]+)/gi)];
const rawTableNames = rawCreateTableMatches.map((match) => match[1]);
const summary = {
  sqlFiles: files.length,
  rawCreateTableDefinitions: rawTableNames.length,
  uniqueRawTableNames: new Set(rawTableNames).size,
  rawDefinitionCountMatchesParsedTables: rawTableNames.length === tables.size,
  tables: tables.size,
  tenantScopedTables: [...tables.values()].filter((item) => item.hasTenantId).length,
  rlsTargets: policyTargets.size,
  requiredViews: requiredViews.length,
  mode: 'static-only; no database connection or SQL execution',
};
console.log('AKHAVAN CRM SQL Server contract audit');
console.log(JSON.stringify(summary, null, 2));
for (const warning of warnings) console.warn(`WARN: ${warning}`);
for (const error of errors) console.error(`FAIL: ${error}`);
if (errors.length) {
  console.error(`Result: FAILED (${errors.length} issue(s))`);
  process.exit(1);
}
console.log('Result: PASS (static checks only; database runtime/security tests remain required)');
