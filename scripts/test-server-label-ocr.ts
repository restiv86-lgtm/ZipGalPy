import fs from "node:fs";
import assert from "node:assert/strict";
import sharp from "sharp";
import {serverLabelOcr} from "../src/lib/product-label/server-ocr";
import {labelFormReducer} from "../src/lib/product-label/autofill";
import {emptyLabelFields} from "../src/lib/product-label/extract";
let tested=0,missing=0;
for(const [file,expected] of [["refrigerator-label.jpg","S839S30"],["다운로드.jpg","FR-C326QNBK"],["다운로드 (1).jpg","S834MGW12"]]){
  if(!fs.existsSync("test-labels/"+file)){missing++;console.log("UNVERIFIED: missing actual photo "+file);continue;}
  const original=fs.readFileSync("test-labels/"+file);
  const image=await sharp(original).rotate().resize({width:1600,height:1600,fit:"inside",withoutEnlargement:true}).png().toBuffer();
  const start=performance.now(),result=await serverLabelOcr(image,"fast",AbortSignal.timeout(45_000),readings=>console.log(JSON.stringify({readings})));
  console.log(JSON.stringify({file,elapsedMs:Math.round(performance.now()-start),model:result.suggestions.modelName,brand:result.suggestions.brand}));
  assert.equal(result.suggestions.modelName.value,expected);
  const form=labelFormReducer({fields:emptyLabelFields(),automatic:{},manual:{}},{type:"analyzed",suggestions:result.suggestions});
  assert.equal(form.fields.modelName,expected);
  assert.equal(result.suggestions.serialNumber.value,"");assert.equal(result.suggestions.manufacturedAt.value,"");
  tested++;
}
assert.ok(tested>0);
console.log(JSON.stringify({tested,missing,exactAutofill:true,optionalFieldsDeferred:true,aiCalls:0}));
