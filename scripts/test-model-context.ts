import assert from 'node:assert/strict';
import {extractProductLabel,isRegulatoryModelLine,type LabelLine} from '../src/lib/product-label/extract';
import {modelRegions,modelCropEvidence} from '../src/lib/product-label/model-region';

const primary='75UN7850KNA',radio='R-R-LGE-75UN7800GNA';
for(const prefix of ['R-R-LGE-','R-C-XYZ-','R—R~LGE~ ','R - C - XYZ - ']){
  const text=`Model: ${prefix}ABC123`;
  assert.ok(isRegulatoryModelLine(text));
  assert.equal(extractProductLabel(text,99).suggestions.modelName.value,'');
}
assert.equal(extractProductLabel(`MODEL: ${primary}\n${radio}`,99).fields.modelName,primary);
assert.equal(extractProductLabel(`MODEL: ${primary}\nModel: ${radio}`,99).fields.modelName,primary);
assert.equal(extractProductLabel(`Model: ${radio}`,99).suggestions.modelName.value,'');
assert.equal(extractProductLabel('기자재의 명칭(모델명): ABC123',99).suggestions.modelName.value,'');
assert.equal(extractProductLabel('Model: ABC123 Certification',99).suggestions.modelName.value,'');
assert.equal(extractProductLabel('MODEL:\nR-R-XYZ-ABC123',99).suggestions.modelName.value,'');
assert.equal(modelCropEvidence([{text:radio,confidence:99}]),null);
assert.equal(modelCropEvidence([{text:'ABC123',confidence:95},{text:'ABC123',confidence:95}])?.value,'ABC123');
assert.equal(modelCropEvidence([{text:'ABC123',confidence:95},{text:'ABC124',confidence:95}]),null);

const box=(x0:number,x1:number)=>({x0,y0:10,x1,y1:30});
const line:LabelLine={text:'Model: ABC123',confidence:98,bbox:box(0,200),words:[{text:'Model:',bbox:box(0,70)},{text:'ABC123',bbox:box(80,200)}]};
assert.equal(modelRegions([line],300,100).length,1);
assert.equal(modelRegions([{...line,text:'Model: R-R-XYZ-ABC123'}],300,100).length,0);
assert.equal(modelRegions([{...line,text:'기자재의 명칭(모델명): ABC123'}],300,100).length,0);
// Context matters even when the actual model is also in a certification ID.
assert.equal(extractProductLabel('Model: ABC123\nR-R-XYZ-ABC123',99).fields.modelName,'ABC123');
console.log('PASS: certification/radio context rejected, primary model preserved, no global model blacklist or fixture-specific substitutions');
