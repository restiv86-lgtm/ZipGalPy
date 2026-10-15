import type {Worker} from 'tesseract.js';
import {extractProductLabel,type LabelRecognition,type LabelLine} from './extract';
import {modelRegions,resolveModelReadings,type ModelReading} from './model-region';
import {BrowserResultCache} from './browser-result-cache';

export interface LabelRecognitionProvider {recognize(file:File,signal:AbortSignal,progress:(value:number)=>void):Promise<LabelRecognition>}
const cache=new BrowserResultCache();
export const browserLabelOcr:LabelRecognitionProvider={
  async recognize(file,signal,progress){
    const check=()=>{if(signal.aborted)throw new DOMException('인식을 취소했습니다.','AbortError');};
    check();
    if(!file.size||file.size>10*1024*1024||!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('JPG/PNG/WebP 사진을 10MB 이하로 선택해 주세요.');
    const bytes=await file.arrayBuffer(),header=new Uint8Array(bytes,0,Math.min(16,bytes.byteLength));
    const actual=header[0]===0xff&&header[1]===0xd8?'image/jpeg':header[0]===0x89&&String.fromCharCode(...header.slice(1,4))==='PNG'?'image/png':String.fromCharCode(...header.slice(0,4))==='RIFF'&&String.fromCharCode(...header.slice(8,12))==='WEBP'?'image/webp':'';
    if(actual!==file.type)throw new Error('사진 형식과 파일 내용이 다릅니다.');
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(value=>value.toString(16).padStart(2,'0')).join('');
    check();const cached=cache.read(digest);if(cached){progress(100);return cached;}
    const image=await createImageBitmap(file);
    if(image.width*image.height>40_000_000){image.close();throw new Error('사진이 너무 큽니다. 라벨 부분을 잘라 다시 시도해 주세요.');}
    const canvas=document.createElement('canvas'),scale=Math.min(1,2000/Math.max(image.width,image.height));
    canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
    const context=canvas.getContext('2d');if(!context){image.close();throw new Error('이 브라우저는 사진을 읽을 수 없습니다.');}
    context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);image.close();
    let worker:Worker|undefined;
    const abort=()=>{if(worker)void worker.terminate().catch(()=>undefined);};
    signal.addEventListener('abort',abort,{once:true});
    try{
      const library=await import('tesseract.js');
      check();
      worker=await library.createWorker(['kor','eng'],1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr/core',langPath:'/ocr/lang',workerBlobURL:false,cacheMethod:'write',logger:message=>{if(!signal.aborted&&message.status==='recognizing text')progress(Math.round(message.progress*100));}});
      check();
      // One layout pass locates explicit model labels before detailed crops.
      await worker.setParameters({tessedit_pageseg_mode:library.PSM.AUTO,preserve_interword_spaces:'1'});
      const {data}=await worker.recognize(canvas,{}, {text:true,blocks:true});check();
      const lines:LabelLine[]=(data.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines.map(line=>({...line,confidence:Math.min(line.confidence,...line.words.map(word=>word.confidence))}))));
      let regions=modelRegions(lines,canvas.width,canvas.height),corroboration:string|undefined;
      // Replace up to sixteen overlapping scans with one bounded sparse pass.
      // Upscale small labels so the model locator sees individual characters.
      if(!regions.length){
        const sparse=document.createElement('canvas'),zoom=Math.min(2,2400/Math.max(canvas.width,canvas.height));
        sparse.width=Math.round(canvas.width*zoom);sparse.height=Math.round(canvas.height*zoom);
        try{
          const ctx=sparse.getContext('2d');if(ctx){ctx.drawImage(canvas,0,0,sparse.width,sparse.height);await worker.setParameters({tessedit_pageseg_mode:library.PSM.SPARSE_TEXT});
            const second=await worker.recognize(sparse,{}, {text:true,blocks:true});check();corroboration=second.data.text;
            const found=modelRegions((second.data.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines)),sparse.width,sparse.height);
            regions=found.map(box=>({left:Math.floor(box.left/zoom),top:Math.floor(box.top/zoom),width:Math.min(canvas.width-Math.floor(box.left/zoom),Math.ceil(box.width/zoom)),height:Math.min(canvas.height-Math.floor(box.top/zoom),Math.ceil(box.height/zoom))}));
          }
        }finally{sparse.width=0;sparse.height=0;}
      }
      async function readRegion(region:ReturnType<typeof modelRegions>[number],zoom:number,mode:string):Promise<ModelReading>{
          check();const crop=document.createElement('canvas');crop.width=region.width*zoom;crop.height=region.height*zoom;
          try{const ctx=crop.getContext('2d');if(!ctx)return {text:'',confidence:0,mode};ctx.drawImage(canvas,region.left,region.top,region.width,region.height,0,0,crop.width,crop.height);
            const reading=await worker!.recognize(crop,{}, {text:true});check();return {text:reading.data.text,confidence:reading.data.confidence,mode};
          }finally{crop.width=0;crop.height=0;}
      }
      // At most two labelled regions and three crop modes per region. One
      // language switch compares Latin identifiers without repeated full scans.
      const readings:ModelReading[]=[];
      if(regions.length){
        await worker.setParameters({tessedit_pageseg_mode:library.PSM.SINGLE_WORD});
        for(const region of regions)readings.push(await readRegion(region,4,'mixed-word'));
        await worker.reinitialize('eng',1);check();
        await worker.setParameters({tessedit_pageseg_mode:library.PSM.SINGLE_LINE});
        for(const region of regions)readings.push(await readRegion(region,4,'latin-line'));
        await worker.setParameters({tessedit_pageseg_mode:library.PSM.SINGLE_WORD});
        for(const region of regions)readings.push(await readRegion(region,6,'latin-word'));
      }
      const result=extractProductLabel(data.text,data.confidence,lines,corroboration);
      result.suggestions.modelName=resolveModelReadings(data.text,result.suggestions.modelName,readings);
      result.fields.modelName=result.suggestions.modelName.confidence==='HIGH'?result.suggestions.modelName.value:'';
      check();cache.write(digest,result);return result;
    }finally{signal.removeEventListener('abort',abort);if(worker)await worker.terminate().catch(()=>undefined);canvas.width=0;canvas.height=0;}
  },
};
