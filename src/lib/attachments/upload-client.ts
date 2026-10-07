"use client";

async function jsonRequest(url:string,body:unknown) {
  const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"라벨 사진 첨부에 실패했습니다.");return data;
}
export async function attachItemLabel(file:File,itemId:string) {
  const authorization=await jsonRequest("/api/attachments",{target:{type:"item",id:itemId},fileName:file.name,mimeType:file.type,byteSize:file.size,purpose:"PHOTO"});
  try {
    const uploaded=await fetch(authorization.uploadUrl,{method:"PUT",headers:{"Content-Type":file.type},body:file});
    if(!uploaded.ok)throw new Error("사진을 저장하지 못했습니다.");
    await jsonRequest("/api/attachments/finalize",{assetId:authorization.assetId});
    return authorization.attachmentId as string;
  } catch(error) {
    // Best-effort cleanup for an interrupted transfer; cancelled drafts never upload at all.
    await fetch(`/api/attachments/${authorization.attachmentId}`,{method:"DELETE"}).catch(()=>undefined);
    throw error;
  }
}
