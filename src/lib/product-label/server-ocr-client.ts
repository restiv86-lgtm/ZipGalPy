import type {LabelRecognition} from "./extract";
export type OcrResponse={result:LabelRecognition;durationMs:number;mode:"fast"|"full"};
export type OcrCache=Map<string,{expires:number;response:OcrResponse}>;
export async function requestServerOcr(file:File,mode:"fast"|"full",signal:AbortSignal,cache:OcrCache):Promise<OcrResponse&{cached:boolean}>{
  if(signal.aborted)throw new DOMException("분석 취소","AbortError");
  if(!file.size||file.size>10*1024*1024||!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error("JPG/PNG/WebP 사진을 10MB 이하로 선택해 주세요.");
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await file.arrayBuffer()))).map(value=>value.toString(16).padStart(2,"0")).join("");
  const key=mode+":"+digest,existing=cache.get(key);
  if(existing&&existing.expires>Date.now())return {...existing.response,cached:true};
  if(signal.aborted)throw new DOMException("분석 취소","AbortError");
  const bitmap=await createImageBitmap(file);
  if(bitmap.width*bitmap.height>40_000_000){bitmap.close();throw new Error("라벨 부분만 잘라 다시 선택해 주세요.");}
  const canvas=document.createElement("canvas"),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
  let image:Blob|null=null;
  try{
    const ctx=canvas.getContext("2d");if(!ctx)throw new Error("사진을 읽지 못했습니다. 직접 입력해 주세요.");
    ctx.fillStyle="white";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    image=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
    if(image&&image.size>3_000_000)image=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.95));
  }finally{bitmap.close();canvas.width=0;canvas.height=0;}
  if(!image||image.size>3_000_000)throw new Error("라벨 부분만 잘라 3MB 이하로 선택해 주세요.");
  const form=new FormData();form.set("image",image,image.type==="image/png"?"label.png":"label.jpg");form.set("mode",mode);
  const response=await fetch("/api/product-label/ocr",{method:"POST",body:form,signal,cache:"no-store"});
  const data=await response.json();if(!response.ok)throw new Error(data.error??"분석에 실패했습니다. 수동 입력으로 계속해 주세요.");
  if(signal.aborted)throw new DOMException("분석 취소","AbortError");
  while(cache.size>=3)cache.delete(cache.keys().next().value!);
  cache.set(key,{expires:Date.now()+5*60_000,response:data});
  return {...data,cached:false};
}
