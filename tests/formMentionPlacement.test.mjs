import fs from 'node:fs';
import assert from 'node:assert/strict';
const form = fs.readFileSync('src/components/shared/DynamicFormRenderer.tsx', 'utf8');
assert.match(form, /field\.type === 'textarea' \? \(/, 'textarea remains a valid branch in the field renderer');
assert.match(form, /\) : null\}\s*\{\(\(field as any\)\.enableMentions \|\| field\.type === 'text' \|\| field\.type === 'textarea'\)/, 'mention menu is rendered after the field-type conditional, not inside a JSX ternary branch');
assert.doesNotMatch(form, /<\/textarea>\s*\{\(\(field as any\)\.enableMentions/, 'mention UI is not inserted between textarea closure and ternary continuation');
assert.match(form, /createMentionReference\(entity\)/, 'selected mentions retain structured references');
console.log('formMentionPlacement.test.mjs: PASS (4 JSX structure contracts)');
