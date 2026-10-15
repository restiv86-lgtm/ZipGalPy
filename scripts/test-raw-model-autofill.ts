import assert from 'node:assert/strict';
import {rawModelEvidence,extractProductLabel,emptyLabelFields,type FieldSuggestion} from '../src/lib/product-label/extract';
import {resolveModelReadings} from '../src/lib/product-label/model-region';
import {labelFormReducer,type LabelFormState} from '../src/lib/product-label/autofill';

// Synthetic raw/layout and auxiliary readings; no expected-model lookup exists
// in the production implementation. These are policy tests, not photo OCR.
const none:FieldSuggestion={value:'',score:0,confidence:'LOW',reason:''};
const crop=(value:string)=>[{text:value,confidence:95,mode:'mixed-word'},{text:value,confidence:97,mode:'latin-line'}];
const initial=():LabelFormState=>({fields:emptyLabelFields(),automatic:{},manual:{}});
for(const [text,expected] of [
  ['모델명 : AB123 용량 : 862L','AB123'],
  ['모델명: MB73GBB572 용량:862L','MB73GBB572'],
  ['모델명: M873GBB572 용량:862L','M873GBB572'],
  ['Model No.: ZX-12/34 Capacity: 10 L','ZX-12/34'],
  ['MODEL NUMBER: QX.900 Serial: OTHER123','QX.900'],
  ['형명：X123 정격：220V','X123'],
  ['| 모델명: TEST456\n모델명: TEST456','TEST456'],
] as const){
  const result=resolveModelReadings(text,{value:'OTHER999',score:.99,confidence:'HIGH',reason:''},crop('DIFFERENT987'));
  assert.equal(result.value,expected);assert.equal(result.confidence,'MEDIUM');assert.equal(result.score,.60);
  assert.equal(result.candidates,undefined);
}

for(const text of ['M873GBB572','862L','인증번호: R-R-LGE-ABC123','Model: R-R-LGE-ABC123','기자재 모델명: ABC123','Model: ABC123 Certification','모델명: 123456','모델명: ABC123 junk']){
  assert.deepEqual(rawModelEvidence(text).values,[]);
  if(!rawModelEvidence(text).hasLabel)assert.equal(resolveModelReadings(text,none,crop('ABC123')).confidence,'LOW');
}
const ambiguous=resolveModelReadings('Model: ABC123\nModel: ABC124',none,crop('ABC123'));
assert.equal(ambiguous.confidence,'LOW');assert.deepEqual(ambiguous.candidates,['ABC123','ABC124']);
assert.equal(resolveModelReadings('MODEL: ABC123\nR-R-XYZ-ABC999',none,crop('XYZ123')).value,'ABC123');
assert.equal(resolveModelReadings('MODEL: 5839530',none,crop('S839S30')).value,'S839S30');

// Deliberately low full-photo and line confidence must not suppress an explicit
// same-line raw model. Manufacturer policy remains independent and unchanged.
const raw='LG ThinQ\n모델명 : M873GBB572 용량 :862L';
const result=extractProductLabel(raw,75,[{text:'LG ThinQ',confidence:45},{text:'모델명 : MB73GBB572 용량 :862L',confidence:45}]);
result.suggestions.modelName=resolveModelReadings(raw,result.suggestions.modelName,crop('MB73GBB572'));
let state=labelFormReducer(initial(),{type:'analyzed',suggestions:result.suggestions});
assert.equal(state.fields.modelName,'M873GBB572');assert.equal(state.fields.brand,'LG전자');
assert.equal(state.automatic.modelName?.confidence,'MEDIUM');
state=labelFormReducer(state,{type:'discard'});assert.deepEqual(state,initial());
const typed=labelFormReducer(initial(),{type:'edited',key:'modelName',value:'USER-987'});
assert.equal(labelFormReducer(typed,{type:'analyzed',suggestions:result.suggestions}).fields.modelName,'USER-987');
const cleared=labelFormReducer(typed,{type:'edited',key:'modelName',value:''});
assert.equal(labelFormReducer(cleared,{type:'analyzed',suggestions:result.suggestions}).fields.modelName,'');
const existing={...initial(),fields:{...emptyLabelFields(),modelName:'EXISTING-123',brand:'USER BRAND'}};
const unchanged=labelFormReducer(existing,{type:'analyzed',suggestions:result.suggestions});
assert.equal(unchanged.fields.modelName,'EXISTING-123');assert.equal(unchanged.fields.brand,'USER BRAND');
console.log('PASS: displayed raw model wins conflicting/high-score auxiliary OCR without character repair; next columns separated; no bare/certification autofill; multiple raw values withheld; real reducer auto-fills model and independent brand, preserves manual/existing/cleared values and supports discard');
