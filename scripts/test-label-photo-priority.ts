import assert from 'node:assert/strict';
import {emptyLabelFields} from '../src/lib/product-label/extract';
import {labelFormReducer,type LabelFormState,type LabelProposal} from '../src/lib/product-label/autofill';

const proposal=(value:string,confidence:LabelProposal['confidence']='MEDIUM')=>({value,confidence});
const create=():LabelFormState=>({fields:{...emptyLabelFields(),category:'APPLIANCE'},automatic:{},manual:{}});
const edit=():LabelFormState=>({fields:{...emptyLabelFields(),brand:'OLD BRAND',modelName:'OLD-123',name:'USER ITEM',manufacturedAt:'2020-01-02',serialNumber:'OLD-SN9',category:'DIGITAL'},automatic:{},manual:{brand:true,modelName:true,manufacturedAt:true}});
const read={brand:proposal('LG전자'),modelName:proposal('NEW-456'),manufacturedAt:proposal('2026-01-01','HIGH'),name:proposal('OTHER ITEM','HIGH'),serialNumber:proposal('NEW-SN8','HIGH'),category:proposal('OTHER','HIGH')};
function photo(state:LabelFormState,suggestions=read){state=labelFormReducer(state,{type:'photoStarted'});return labelFormReducer(state,{type:'photoAnalyzed',suggestions});}

for(const original of [create(),edit()]){
  const result=photo(original);
  assert.equal(result.fields.brand,'LG전자');assert.equal(result.fields.modelName,'NEW-456');
  for(const key of ['name','manufacturedAt','serialNumber','category'] as const)assert.equal(result.fields[key],original.fields[key]);
  assert.deepEqual(labelFormReducer(result,{type:'discard'}),original);
}
const before=edit();
const missing=photo(before,{brand:proposal(''),modelName:proposal(''),manufacturedAt:proposal(''),name:proposal(''),serialNumber:proposal(''),category:proposal('')});
assert.deepEqual(missing.fields,before.fields);assert.deepEqual(labelFormReducer(missing,{type:'discard'}),before);
const low=photo(before,{...read,brand:proposal('LOW BRAND','LOW'),modelName:proposal('LOW-999','LOW')});
assert.deepEqual(low.fields,before.fields);
let cleared=labelFormReducer(edit(),{type:'edited',key:'modelName',value:''});
assert.equal(photo(cleared).fields.modelName,'NEW-456');
assert.equal(labelFormReducer(photo(cleared),{type:'discard'}).fields.modelName,'');

// Snapshot the actual overwritten value, including typing while OCR is pending.
let pending=labelFormReducer(edit(),{type:'photoStarted'});
pending=labelFormReducer(pending,{type:'edited',key:'modelName',value:'TYPED-WHILE-PENDING1'});
const overwritten=labelFormReducer(pending,{type:'photoAnalyzed',suggestions:read});
assert.equal(overwritten.fields.modelName,'NEW-456');
assert.equal(labelFormReducer(overwritten,{type:'discard'}).fields.modelName,'TYPED-WHILE-PENDING1');
const typedAfter=labelFormReducer(overwritten,{type:'edited',key:'modelName',value:'AFTER-789'});
const kept=labelFormReducer(typedAfter,{type:'discard'});
assert.equal(kept.fields.modelName,'AFTER-789');assert.equal(kept.fields.brand,'OLD BRAND');

const first=photo(edit());
const second=photo(first,{...read,modelName:proposal('SECOND-789'),brand:proposal('')});
assert.equal(second.fields.brand,'LG전자');
assert.equal(labelFormReducer(second,{type:'discard'}).fields.modelName,'NEW-456');
const pendingSecond=labelFormReducer(first,{type:'photoStarted'});
assert.equal(labelFormReducer(pendingSecond,{type:'discard'}).fields.modelName,'NEW-456');
assert.equal(labelFormReducer(labelFormReducer(pendingSecond,{type:'discard'}),{type:'discard'}).fields.modelName,'NEW-456');
// The separate AI/legacy action retains its existing empty-only policy.
assert.equal(labelFormReducer(edit(),{type:'analyzed',suggestions:read}).fields.modelName,'OLD-123');
console.log('PASS: create/edit photo priority over existing/manual/cleared model and brand, unrelated fields and missing/LOW preserved, exact latest-value rollback, edits during/after analysis, repeated/pending cancellation, legacy AI isolation');
