import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import sharp from "sharp";
import {createWorker,PSM} from "tesseract.js";
import {modelRegions,modelCropEvidence,type ModelReading} from "../src/lib/product-label/model-region";
import {extractProductLabel} from "../src/lib/product-label/extract";
import {labelFormReducer} from "../src/lib/product-label/autofill";
import {emptyLabelFields} from "../src/lib/product-label/extract";

const file="test-labels/refrigerator-label.jpg";
assert.ok(fs.existsSync(file),"Actual refrigerator fixture required; not a passed test when missing.");
const image=fs.readFileSync(file),hash=createHash("sha256").update(image).digest("hex");
const worker=await createWorker(["kor","eng"],1,{langPath:path.resolve("public/ocr/lang"),cacheMethod:"none"});
try{
  await worker.setParameters({tessedit_pageseg_mode:PSM.AUTO,preserve_interword_spaces:"1"});
  const {data}=await worker.recognize(image,{}, {text:true,blocks:true});
  const lines=(data.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines));
  const dimensions=await sharp(image).metadata();
  const readings:ModelReading[]=[];
  await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_WORD});
  for(const region of modelRegions(lines,dimensions.width!,dimensions.height!))for(const zoom of [4,6]){
    const crop=await sharp(image).extract(region).resize({width:region.width*zoom,height:region.height*zoom}).png().toBuffer();
    const {data:result}=await worker.recognize(crop,{}, {text:true});
    readings.push({text:result.text,confidence:result.confidence});
  }
  const evidence=modelCropEvidence(readings);
  assert.equal(evidence?.value,"S839S30");
  const result=extractProductLabel(data.text,data.confidence,lines,undefined,evidence);
  assert.equal(result.suggestions.modelName.value,"S839S30");
  assert.equal(result.fields.modelName,""); // Low-confidence evidence must never prefill.
  const form=labelFormReducer({fields:emptyLabelFields(),automatic:{},manual:{}},{type:"analyzed",suggestions:result.suggestions});
  assert.equal(form.fields.modelName,"");
  assert.equal(form.fields.brand,result.suggestions.brand.confidence==="LOW"?"":result.suggestions.brand.value);
  assert.equal(modelCropEvidence([{text:"S839S30",confidence:95},{text:"S839530",confidence:95}]),null);
  assert.equal(modelCropEvidence([{text:"8839830",confidence:99}]),null);
  assert.equal(createHash("sha256").update(fs.readFileSync(file)).digest("hex"),hash);
  console.log(JSON.stringify({model:result.suggestions.modelName,brand:result.suggestions.brand,automaticModelInput:form.fields.modelName,automaticBrand:form.fields.brand,brandNeedsReview:form.automatic.brand?.confidence==="MEDIUM",fixtureUnchanged:true}));
}finally{await worker.terminate();}
