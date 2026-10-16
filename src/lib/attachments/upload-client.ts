"use client";

type Reservation={assetId:string;attachmentId:string;uploadUrl:string;transferred:boolean};
class UploadRequestError extends Error{constructor(message:string,readonly status:number){super(message);}}
const reservations=new WeakMap<File,Map<string,Reservation>>();
async function jsonRequest(url:string,body:unknown){
  const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await response.json();if(!response.ok)throw new UploadRequestError(data.error||"파일 첨부에 실패했습니다.",response.status);return data;
}
export async function attachItemLabel(file:File,itemId:string,purpose:"PHOTO"|"LABEL"="PHOTO",replaceAttachmentId?:string){
  const key=JSON.stringify([itemId,purpose,replaceAttachmentId]);
  let entries=reservations.get(file);if(!entries){entries=new Map();reservations.set(file,entries);}
  let authorization=entries.get(key);
  if(!authorization){authorization={...await jsonRequest("/api/attachments",{target:{type:"item",id:itemId},fileName:file.name,mimeType:file.type,byteSize:file.size,purpose,...(replaceAttachmentId?{replaceAttachmentId}:{})}),transferred:false} as Reservation;entries.set(key,authorization);}
  if(!authorization.transferred){
    try{
      const uploaded=await fetch(authorization.uploadUrl,{method:"PUT",headers:{"Content-Type":file.type},body:file});
      if(!uploaded.ok)throw new Error("사진을 저장하지 못했습니다.");
      authorization.transferred=true;
    }catch(error){await fetch(`/api/attachments/${authorization.attachmentId}`,{method:"DELETE"}).catch(()=>undefined);entries.delete(key);throw error;}
  }
  // A lost finalize response must not delete a successfully replaced label.
  // Keep the same reservation and transfer for an idempotent retry.
  try{
    await jsonRequest("/api/attachments/finalize",{assetId:authorization.assetId,...(replaceAttachmentId?{replaceAttachmentId}:{})});
    return authorization.attachmentId;
  }catch(error){
    const ready=await fetch(`/api/attachments?type=item&id=${encodeURIComponent(itemId)}`,{cache:"no-store"}).then(async r=>r.ok?(await r.json()).files.some((f:{id:string})=>f.id===authorization!.attachmentId):false).catch(()=>false);
    if(ready)return authorization.attachmentId;
    if(error instanceof UploadRequestError&&(error.status!==409||error.message.includes("만료"))){
      const removed=await fetch(`/api/attachments/${authorization.attachmentId}`,{method:"DELETE"}).catch(()=>null);
      if(removed?.ok||removed?.status===404)entries.delete(key);
    }
    throw error;
  }
}
