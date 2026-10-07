import type { Worker } from "tesseract.js";
import { extractProductLabel, type LabelRecognition } from "./extract";

// Provider boundary: a future optional AI helper can be added without changing item CRUD.
export interface LabelRecognitionProvider { recognize(file: File, signal: AbortSignal, progress: (value:number)=>void): Promise<LabelRecognition> }
export const browserLabelOcr: LabelRecognitionProvider = {
  async recognize(file,signal,progress) {
    if(file.size>10*1024*1024||file.size===0||!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("JPG/PNG/WebP 사진을 10MB 이하로 선택해 주세요.");
    const header=new Uint8Array(await file.slice(0,16).arrayBuffer());
    const actual=header[0]===0xff&&header[1]===0xd8?"image/jpeg":header[0]===0x89&&String.fromCharCode(...header.slice(1,4))==="PNG"?"image/png":String.fromCharCode(...header.slice(0,4))==="RIFF"&&String.fromCharCode(...header.slice(8,12))==="WEBP"?"image/webp":"";
    if(actual!==file.type) throw new Error("사진 형식과 실제 내용이 다릅니다.");
    const image=await createImageBitmap(file);
    if(image.width*image.height>40_000_000) {image.close();throw new Error("사진이 너무 큽니다. 라벨 부분을 잘라 다시 시도해 주세요.");}
    const canvas=document.createElement("canvas");
    const scale=Math.min(1,2000/Math.max(image.width,image.height));
    canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
    const context=canvas.getContext("2d"); if(!context){image.close();throw new Error("이 브라우저에서 사진을 읽을 수 없습니다.");}
    context.fillStyle="white";context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);image.close();
    const library=await import("tesseract.js");
    let worker: Worker | undefined;
    let cancelled=signal.aborted;
    const abort=()=>{cancelled=true;if(worker)void worker.terminate().catch(()=>undefined);};
    signal.addEventListener("abort",abort,{once:true});
    try {
      if(cancelled)throw new Error("인식을 취소했습니다.");
      worker=await library.createWorker(["kor","eng"],1,{
        workerPath:"/ocr/worker.min.js",corePath:"/ocr/core",langPath:"/ocr/lang",workerBlobURL:false,
        cacheMethod:"write",logger:message=>{if(!cancelled&&message.status==="recognizing text")progress(Math.round(message.progress*100));},
      });
      if(cancelled)throw new Error("인식을 취소했습니다.");
      await worker.setParameters({tessedit_pageseg_mode:library.PSM.AUTO,preserve_interword_spaces:"1"});
      const {data}=await worker.recognize(canvas);
      if(cancelled)throw new Error("인식을 취소했습니다.");
      return extractProductLabel(data.text,data.confidence);
    } finally {signal.removeEventListener("abort",abort);if(worker)await worker.terminate().catch(()=>undefined);canvas.width=0;canvas.height=0;}
  },
};
