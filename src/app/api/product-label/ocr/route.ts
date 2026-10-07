import sharp from "sharp";
import {fileTypeFromBuffer} from "file-type";
import {attachmentUser,AttachmentError,attachmentError} from "@/lib/attachments/http";
import {serverLabelOcr} from "@/lib/product-label/server-ocr";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
let active=0;
export async function GET(request:Request){try{await attachmentUser(request);return Response.json({enabled:process.env.VERCEL_ENV==="preview"},{headers:{"Cache-Control":"private, no-store"}});}catch(error){return attachmentError(error);}}
export async function POST(request:Request){
  let acquired=false;
  try{
    await attachmentUser(request,true);
    if(process.env.VERCEL_ENV!=="preview")throw new AttachmentError(503,"서버 OCR은 현재 Preview에서 검증 중입니다.");
    const length=Number(request.headers.get("content-length"));if(!length||length>3_500_000)throw new AttachmentError(413,"사진을 3MB 이하로 줄여 주세요.");
    if(active>=1)throw new AttachmentError(429,"다른 분석을 처리 중입니다. 직접 입력하거나 잠시 후 다시 시도해 주세요.");
    active++;acquired=true;
    const form=await request.formData(),file=form.get("image"),mode=form.get("mode");
    if(!(file instanceof File)||file.size===0||file.size>3_000_000||!["fast","full"].includes(String(mode)))throw new AttachmentError(400,"사진과 분석 유형을 확인해 주세요.");
    const bytes=Buffer.from(await file.arrayBuffer()),type=await fileTypeFromBuffer(bytes);
    if(!type||!["image/jpeg","image/png","image/webp"].includes(type.mime)||type.mime!==file.type)throw new AttachmentError(400,"실제 JPG/PNG/WebP 사진만 분석할 수 있습니다.");
    const image=await sharp(bytes,{limitInputPixels:40_000_000}).rotate().flatten({background:"white"}).resize({width:1600,height:1600,fit:"inside",withoutEnlargement:true}).png().toBuffer();
    const started=performance.now();
    const result=await serverLabelOcr(image,mode as "fast"|"full",AbortSignal.any([request.signal,AbortSignal.timeout(45_000)]));
    return Response.json({result,durationMs:Math.round(performance.now()-started),mode},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof AttachmentError)return attachmentError(error);
    return Response.json({error:"분석을 완료하지 못했습니다. 수동 입력으로 계속하거나 직접 다시 분석해 주세요."},{status:504,headers:{"Cache-Control":"private, no-store"}});
  }finally{if(acquired)active--;}
}
