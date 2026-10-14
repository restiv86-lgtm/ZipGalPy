import assert from 'node:assert/strict';
import {extractProductLabel,emptyLabelFields,type LabelLine,type FieldSuggestion} from '../src/lib/product-label/extract';
import {compareModelReadings,modelRegions} from '../src/lib/product-label/model-region';
import {labelFormReducer} from '../src/lib/product-label/autofill';

// Synthetic strings/layouts exercise policy; these are not photo accuracy tests.
for(const [text,expected] of [
  ['모델명 : AB123 용량 : 862L','AB123'],
  ['Model No.: ZX-12/34 Capacity: 10 L','ZX-12/34'],
  ['MODEL NUMBER: QX.900 rated: 220V','QX.900'],
  ['형명: X123 시리얼: SERIAL999','X123'],
] as const)assert.equal(extractProductLabel(text,95).suggestions.modelName.value,expected);
for(const text of ['MODEL: 123456 Capacity: 800L','MODEL: R-R-XYZ-X123','MODEL: X123 Certification','Serial: X123','MODEL: X123 220V'])assert.equal(extractProductLabel(text,99).suggestions.modelName.value,'');

const empty:FieldSuggestion={value:'',score:0,confidence:'LOW',reason:''};
const readings=(a:string,b:string)=>[{text:a,confidence:92,mode:'mixed-word'},{text:b,confidence:95,mode:'latin-line'}];
const agreed=compareModelReadings(empty,readings('ZX-123','ZX-123'));
assert.equal(agreed.confidence,'MEDIUM');assert.ok(agreed.score<=.79);
assert.equal(compareModelReadings(empty,[{text:'ZX-123',confidence:99,mode:'latin-line'}]).confidence,'LOW');
assert.equal(compareModelReadings(empty,[{text:'ZX-123',confidence:42,mode:'mixed-word'},{text:'ZX-123',confidence:49,mode:'latin-line'}]).confidence,'LOW');
assert.equal(compareModelReadings(empty,[{text:'ZX-123',confidence:99,mode:'latin-line'},{text:'ZX-123',confidence:99,mode:'latin-line'}]).confidence,'LOW');
const conflict=compareModelReadings({value:'ZX-128',score:.99,confidence:'HIGH',reason:''},readings('ZX-123','ZX-123'));
assert.equal(conflict.confidence,'LOW');assert.deepEqual(conflict.candidates,['ZX-128','ZX-123']);
assert.equal(compareModelReadings(empty,readings('123456','123456')).value,'');
assert.equal(compareModelReadings(empty,readings('R-R-XYZ-X123','R-R-XYZ-X123')).value,'');
assert.equal(compareModelReadings(empty,[{text:'ZX-123',confidence:NaN,mode:'latin-line'}]).value,'');
const multiple=extractProductLabel('Model: ZX123\nModel: ZX124',99).suggestions.modelName;
assert.deepEqual(compareModelReadings(multiple,[]).candidates,['ZX123','ZX124']);
assert.equal(compareModelReadings(multiple,[]).confidence,'LOW');
const suggestions=extractProductLabel('',0).suggestions;suggestions.modelName=conflict;
const state={fields:emptyLabelFields(),automatic:{},manual:{}};
assert.equal(labelFormReducer(state,{type:'analyzed',suggestions}).fields.modelName,'');

const box=(x0:number,y0:number,x1:number,y1:number)=>({x0,y0,x1,y1});
const labelled:LabelLine={text:'MODEL: ZX123 Capacity: 800L',confidence:90,words:[{text:'MODEL:',bbox:box(10,10,60,30)},{text:'ZX123',bbox:box(70,10,150,30)},{text:'Capacity:',bbox:box(170,10,230,30)},{text:'800L',bbox:box(240,10,270,30)}]};
assert.deepEqual(modelRegions([labelled],300,100),[{left:67,top:7,width:86,height:26}]);
assert.equal(modelRegions([{...labelled,words:[labelled.words![0],labelled.words![2],labelled.words![3]]}],300,100).length,0);
const caption:LabelLine={text:'Model:',confidence:90,words:[{text:'Model:',bbox:box(10,10,60,30)}]};
const below:LabelLine={text:'ZX123',confidence:90,words:[{text:'ZX123',bbox:box(10,35,90,55)}]};
assert.equal(modelRegions([caption,below],300,100).length,1);
assert.equal(modelRegions([caption,below,{...below,text:'ZX124',words:[{text:'ZX124',bbox:box(20,35,100,55)}]}],300,100).length,0);
assert.equal(modelRegions([{...labelled,text:'Model: R-R-XYZ-ZX123'}],300,100).length,0);
console.log('PASS: synthetic labelled columns/formats, right/below geometry, ambiguity, distinct-mode agreement, invalid confidence, certification/numeric rejection and no false autofill');
