import assert from 'node:assert/strict';
import { validateCollectionEvidenceFile, COLLECTION_EVIDENCE_MAX_BYTES } from '../src/lib/collectionTaskEvidence.ts';
assert.equal(validateCollectionEvidenceFile({name:'proof.jpg',type:'image/jpeg',size:1024}).valid, true);
assert.equal(validateCollectionEvidenceFile({name:'proof.pdf',type:'application/pdf',size:1024}).valid, true);
assert.equal(validateCollectionEvidenceFile({name:'script.svg',type:'image/svg+xml',size:1024}).valid, false);
assert.equal(validateCollectionEvidenceFile({name:'file.exe',type:'application/octet-stream',size:1024}).valid, false);
assert.equal(validateCollectionEvidenceFile({name:'large.pdf',type:'application/pdf',size:COLLECTION_EVIDENCE_MAX_BYTES+1}).valid, false);
assert.equal(validateCollectionEvidenceFile({name:'empty.pdf',type:'application/pdf',size:0}).valid, false);
console.log('PASS: 6 assertions (collection task evidence type and size validation)');
