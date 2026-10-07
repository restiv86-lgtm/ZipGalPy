import path from "node:path";
import sharp from "sharp";
import {createWorker,PSM} from "tesseract.js";
import {extractProductLabel,type LabelRecognition} from "./extract";
import {modelRegions,modelSearchBands,modelCropEvidence,type ModelReading} from "./model-region";
import {enhanceModelPixels} from "./model-preprocess";

export async function serverLabelOcr(image:Buffer,mode:"fast"|"full",signal:AbortSignal,diagnostic?:(readings:ModelReading[])=>void):Promise<LabelRecognition>{
  const meta=await sharp(image,{limitInputPixels:40_000_000}).metadata(),width=meta.width!,height=meta.height!;
  const worker=await createWorker(["kor","eng"],1,{langPath:path.join(process.cwd(),"public/ocr/lang"),cacheMethod:"none",errorHandler:()=>undefined});
  const abort=()=>{void worker.terminate().catch(()=>undefined);};signal.addEventListener("abort",abort,{once:true});
  function check(){if(signal.aborted)throw new Error("OCR_TIMEOUT");}
  function recognize(input:Parameters<typeof worker.recognize>[0],blocks=false):ReturnType<typeof worker.recognize>{
    check();
    return new Promise((resolve,reject)=>{
      const stop=()=>reject(new Error("OCR_TIMEOUT"));signal.addEventListener("abort",stop,{once:true});
      worker.recognize(input,{}, {text:true,blocks}).then(resolve,reject).finally(()=>signal.removeEventListener("abort",stop));
    });
  }
  try{
    check();await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK,preserve_interword_spaces:"1"});
    let regions:ReturnType<typeof modelRegions>=[];
    const bands=modelSearchBands(width,height).map(band=>({...band,left:Math.floor(width*.1),width:Math.floor(width*.8)})),order=[5,6,7,4,8,3,9,2,10,1,11,0,12,13,14,15];
    for(const i of mode==="fast"?order:[]){
      check();const band=bands[i];if(!band)continue;
      const strip=await sharp(image).extract(band).resize({width:band.width*4,height:band.height*4}).png().toBuffer();
      const{data}=await recognize(strip,true);
      const rows=(data.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines));
      const found=modelRegions(rows,band.width*4,band.height*4);
      if(found.length){regions=found.map(box=>{
        const left=Math.max(0,Math.floor(band.left+box.left/4)),top=Math.max(0,Math.floor(band.top+box.top/4));
        return {left,top,width:Math.min(width-left,Math.ceil(box.width/4)+4),height:Math.min(height-top,Math.ceil(box.height/4)+4)};
      });break;}
    }
    let readings:ModelReading[]=[];
    async function readRegions(targets:typeof regions){
    const values:ModelReading[]=[];
    await worker.reinitialize("kor+eng");await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_WORD});
    for(const region of targets){
      check();const bytes=await sharp(image).extract(region).resize({width:region.width*6,height:region.height*6}).png().toBuffer();
      const{data}=await recognize(bytes);values.push({text:data.text,confidence:data.confidence});
    }
    await worker.reinitialize("eng");await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_LINE});
    for(const region of targets)for(const zoom of [4,6]){
      check();const{data,info}=await sharp(image).extract(region).resize({width:region.width*zoom,height:region.height*zoom}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      const rgba=enhanceModelPixels(new Uint8ClampedArray(data),info.width,info.height);
      const bytes=await sharp(Buffer.from(rgba),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
      const{data:crop}=await recognize(bytes);values.push({text:crop.text,confidence:crop.confidence});
    }
    return values;
    }
    if(mode==="fast")readings=await readRegions(regions);
    check();await worker.reinitialize("kor+eng");await worker.setParameters({tessedit_pageseg_mode:PSM.AUTO});
    const{data}=await recognize(image,true);
    const lines=(data.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines));
    if(mode==="fast"&&!modelCropEvidence(readings)){
      const precise=modelRegions(lines,width,height);
      if(precise.length)readings=await readRegions(precise);
    }
    diagnostic?.(readings);
    let corroboration:string|undefined;
    if(mode==="full"){await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});corroboration=(await recognize(image)).data.text;}
    const result=extractProductLabel(data.text,data.confidence,lines,corroboration,modelCropEvidence(readings));
    if(mode==="fast")for(const key of ["name","manufacturedAt","serialNumber"] as const){result.fields[key]="";result.suggestions[key]={value:"",score:0,confidence:"LOW",reason:"필요하면 추가 정보 분석을 선택해 주세요."};}
    check();return result;
  }finally{signal.removeEventListener("abort",abort);await worker.terminate().catch(()=>undefined);}
}
