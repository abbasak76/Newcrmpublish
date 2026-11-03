import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const extensions = ['.ts', '.tsx', '.js', '.jsx'];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.includes(path.extname(entry.name))) files.push(full);
  }
}
walk(root);
const fileSet = new Set(files);
const graph = new Map(files.map(file => [file, new Set()]));
const importPattern = /(?:\bfrom\s*|\bimport\s*\()\s*['"]([^'"]+)['"]/g;
function resolveImport(from, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(from), specifier);
  const candidates = [base, ...extensions.map(ext => base + ext), ...extensions.map(ext => path.join(base, 'index' + ext))];
  return candidates.find(candidate => fileSet.has(candidate)) ?? null;
}
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(importPattern)) {
    const target = resolveImport(file, match[1]);
    if (target) graph.get(file).add(target);
  }
}
const entry = path.join(root, 'main.tsx');
const reachable = new Set();
const stack = [entry];
while (stack.length) {
  const current = stack.pop();
  if (reachable.has(current) || !graph.has(current)) continue;
  reachable.add(current);
  for (const next of graph.get(current)) stack.push(next);
}
const rel = file => path.relative(process.cwd(), file).replaceAll(path.sep, '/');
const orphanCandidates = files.filter(file => !reachable.has(file)).map(rel).sort();
const report = {
  generatedAt: new Date().toISOString(),
  method: 'static relative-import graph from src/main.tsx; dynamic/runtime registries, CSS references, tests and framework conventions may require manual review',
  sourceFiles: files.length,
  reachableFiles: reachable.size,
  unreachableCandidates: orphanCandidates.length,
  unreachableCandidatesFiles: orphanCandidates,
};
const outPath = path.resolve('SOURCE_SURFACE_AUDIT.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
console.log(`Wrote ${rel(outPath)}`);
