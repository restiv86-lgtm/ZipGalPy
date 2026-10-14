import assert from 'node:assert/strict';
import {BrowserResultCache} from '../src/lib/product-label/browser-result-cache';
import {browserLabelOcr} from '../src/lib/product-label/browser-ocr';
import {extractProductLabel} from '../src/lib/product-label/extract';
import {modelCropEvidence} from '../src/lib/product-label/model-region';
import {labelFormReducer} from '../src/lib/product-label/autofill';
import {emptyLabelFields} from '../src/lib/product-label/extract';

const result=extractProductLabel('MODEL: SAMPLE-123',95);
const cache=new BrowserResultCache();
cache.write('first',result,0);
result.suggestions.modelName.value='MUTATED-999';
assert.equal(cache.read('first',1)?.suggestions.modelName.value,'SAMPLE-123');
const returned=cache.read('first',1)!;returned.suggestions.modelName.value='EDITED-999';
assert.equal(cache.read('first',2)?.suggestions.modelName.value,'SAMPLE-123');
assert.equal(cache.read('first',300000),undefined);
for(let i=0;i<4;i++)cache.write(String(i),result,0);
assert.equal(cache.read('0',1),undefined);assert.ok(cache.read('3',1));

assert.equal(modelCropEvidence([{text:'TEST-123',confidence:95},{text:'TEST-124',confidence:95}]),null);
assert.equal(modelCropEvidence([{text:'5839530',confidence:99}]),null);
const evidence=modelCropEvidence([{text:'TEST-123',confidence:95},{text:'TEST-123',confidence:95}])!;
const conservative=extractProductLabel('',0,[],undefined,{...evidence,score:Math.min(79,evidence.score)});
assert.equal(conservative.fields.modelName,'');assert.equal(conservative.suggestions.modelName.confidence,'MEDIUM');
const initial={fields:{...emptyLabelFields(),modelName:'EXISTING-123'},automatic:{},manual:{}};
assert.equal(labelFormReducer(initial,{type:'analyzed',suggestions:conservative.suggestions}).fields.modelName,'EXISTING-123');

const invalid=new File(['invalid bytes'],'label.jpg',{type:'image/jpeg'});
await assert.rejects(browserLabelOcr.recognize(invalid,AbortSignal.abort(),()=>{}),{name:'AbortError'});
await assert.rejects(browserLabelOcr.recognize(new File([],'empty.jpg',{type:'image/jpeg'}),new AbortController().signal,()=>{}));
await assert.rejects(browserLabelOcr.recognize(invalid,new AbortController().signal,()=>{}),/파일 내용/);
console.log('PASS: cache isolation, expiry and capacity; no conflict/numeric substitution; crop MEDIUM ceiling; existing input preserved; cancellation and invalid files');
