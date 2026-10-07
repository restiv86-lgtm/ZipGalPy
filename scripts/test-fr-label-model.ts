import fs from "node:fs";import path from "node:path";import assert from "node:assert/strict";import{createHash}from"node:crypto";
import sharp from "sharp";import{createWorker,PSM}from"tesseract.js";
import{modelRegions,modelSearchBands,modelCropEvidence,type ModelReading}from"../src/lib/product-label/model-region";
import{enhanceModelPixels}from"../src/lib/product-label/model-preprocess";
import{extractProductLabel,emptyLabelFields}from"../src/lib/product-label/extract";
import{labelFormReducer}from"../src/lib/product-label/autofill";
const file=process.argv[2]??"test-labels/다운로드.jpg",expected=process.argv[3]??"FR-C326QNBK";assert.ok(fs.existsSync(file),"Actual label photo required; missing fixture is not PASS.");
const image=fs.readFileSync(file),hash=createHash("sha256").update(image).digest("hex");
const meta=await sharp(image).metadata(),width=meta.width!,height=meta.height!;
const worker=await createWorker(["kor","eng"],1,{langPath:path.resolve("public/ocr/lang"),cacheMethod:"none"});
try{
  await worker.setParameters({tessedit_pageseg_mode:PSM.AUTO,preserve_interword_spaces:"1"});
  const{data}=await worker.recognize(image,{}, {text:true,blocks:true});
  const lines=(data.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines));
  let regions=modelRegions(lines,width,height);
  await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK});
  if(!regions.length)for(const band of modelSearchBands(width,height)){
    const bytes=await sharp(image).extract(band).resize({width:band.width*4,height:band.height*4}).png().toBuffer();
    const{data:scan}=await worker.recognize(bytes,{}, {text:true,blocks:true});
    const rows=(scan.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines));
    const found=modelRegions(rows,band.width*4,band.height*4);
    if(found.length){regions=found.map(box=>({left:Math.floor(band.left+box.left/4),top:Math.floor(band.top+box.top/4),width:Math.ceil(box.width/4)+4,height:Math.ceil(box.height/4)+4}));break;}
  }
  assert.ok(regions.length,"Model label must be detected; no fixture-specific coordinates");
  const readings:ModelReading[]=[];
  await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_WORD});
  for(const region of regions){
    const bytes=await sharp(image).extract(region).resize({width:region.width*6,height:region.height*6}).png().toBuffer();
    const{data:crop}=await worker.recognize(bytes,{}, {text:true});readings.push({text:crop.text,confidence:crop.confidence});
  }
  await worker.reinitialize("eng");await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_LINE});
  for(const region of regions)for(const zoom of [4,6]){
    const {data:raw,info}=await sharp(image).extract(region).resize({width:region.width*zoom,height:region.height*zoom}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const rgba=enhanceModelPixels(new Uint8ClampedArray(raw),info.width,info.height);
    const bytes=await sharp(Buffer.from(rgba),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
    const{data:crop}=await worker.recognize(bytes,{}, {text:true});readings.push({text:crop.text,confidence:crop.confidence});
  }
  console.log(JSON.stringify({fixture:path.basename(file),readings}));
  const evidence=modelCropEvidence(readings);assert.equal(evidence?.value,expected);
  const result=extractProductLabel(data.text,data.confidence,lines,undefined,evidence);
  const form=labelFormReducer({fields:emptyLabelFields(),automatic:{},manual:{}},{type:"analyzed",suggestions:result.suggestions});
  assert.equal(form.fields.modelName,expected);
  const existing=labelFormReducer({...form,fields:{...form.fields,modelName:"MY-MODEL123"}},{type:"analyzed",suggestions:result.suggestions});assert.equal(existing.fields.modelName,"MY-MODEL123");
  assert.equal(createHash("sha256").update(fs.readFileSync(file)).digest("hex"),hash);
  console.log(JSON.stringify({readings,model:result.suggestions.modelName,brand:result.suggestions.brand,automaticModelInput:form.fields.modelName,automaticBrand:form.fields.brand,existingInputPreserved:true,fixtureUnchanged:true}));
}finally{await worker.terminate();}
