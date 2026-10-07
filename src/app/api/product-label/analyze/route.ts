import { z } from "zod";
import { AttachmentError, attachmentError, attachmentUser } from "@/lib/attachments/http";
import { aiConfiguration, analyzeGemini, checkPreviewGeminiModel, LabelAiError, recordAiUsage, reserveAiCall, sanitizeLabelImage } from "@/lib/product-label/ai-server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=40;
export async function GET(request:Request){try{await attachmentUser(request);const data=new URL(request.url).searchParams.get("checkModel")==="gemini-3.8-flash"?await checkPreviewGeminiModel():aiConfiguration();return Response.json(data,{headers:{"Cache-Control":"private, no-store"}});}catch(error){if(error instanceof LabelAiError)return Response.json({error:error.message},{status:error.status});return attachmentError(error);}}
export async function POST(request:Request){
  let reservedId:string|undefined;
  try{
    const userId=await attachmentUser(request,true);
    if(!aiConfiguration().enabled)throw new AttachmentError(503,"AI 분석은 설정된 Preview에서만 사용할 수 있습니다.");
    const declared=Number(request.headers.get("content-length"));if(!declared||declared>4_000_000)throw new AttachmentError(413,"AI 분석 사진은 3MB 이하로 줄여 선택해 주세요.");
    const form=await request.formData();
    if(form.get("consent")!=="label-ai-v1")throw new AttachmentError(400,"외부 AI 전송 안내를 확인하고 동의해 주세요.");
    const requestId=z.string().uuid().parse(form.get("requestId"));
    const file=form.get("image");if(!(file instanceof File))throw new AttachmentError(400,"사진을 선택해 주세요.");
    const image=await sanitizeLabelImage(file);
    const remaining=await reserveAiCall(requestId,userId);reservedId=requestId;
    const result=await analyzeGemini(image);await recordAiUsage(requestId,"COMPLETED",result.usage);
    return Response.json({...result,remaining},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(reservedId)await recordAiUsage(reservedId,"FAILED").catch(()=>undefined);
    if(error instanceof LabelAiError)return Response.json({error:error.message},{status:error.status});
    if(error instanceof z.ZodError)return Response.json({error:"분석 요청/응답 형식을 확인해 주세요. 직접 입력할 수 있습니다."},{status:400});
    return attachmentError(error);
  }
}
