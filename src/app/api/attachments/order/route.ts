import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { canAccessTarget, targetSchema, targetWhere } from "@/lib/attachments/access";
import { AttachmentError, attachmentError, attachmentUser } from "@/lib/attachments/http";

export async function PATCH(request: Request) {
  try {
    const userId = await attachmentUser(request, true);
    if (!process.env.BLOB_STORE_ID) throw new AttachmentError(503,"파일 저장소가 준비되지 않았습니다.");
    const input = z.object({ target: targetSchema, ids: z.array(z.string().min(1).max(100)).max(10) }).safeParse(await request.json());
    if (!input.success || new Set(input.data.ids).size !== input.data.ids.length || input.data.target.type !== "item") throw new AttachmentError(400, "사진 순서를 확인해 주세요.");
    const {target, ids} = input.data;
    if (!await canAccessTarget(target, userId, true)) throw new AttachmentError(404, "물건을 찾을 수 없습니다.");
    await getPrisma().$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${target.type}:${target.id}`}, 0))`;
      const owned = await tx.homeItem.findFirst({where:{id:target.id,home:{userId}},select:{id:true}});
      const photos = await tx.attachment.findMany({where:{...targetWhere(target),fileAsset:{status:"READY",storeId:process.env.BLOB_STORE_ID,mimeType:{startsWith:"image/"}}},select:{id:true,purpose:true}});
      if (!owned || photos.length !== ids.length || photos.some(photo=>!ids.includes(photo.id))) throw new AttachmentError(409,"사진 목록이 변경됐습니다. 새로고침 후 다시 시도해 주세요.");
      for (const [sortOrder,id] of ids.entries()) {
        const oldPurpose=photos.find(photo=>photo.id===id)!.purpose;
        await tx.attachment.update({where:{id},data:{sortOrder,purpose:sortOrder===0?"COVER":oldPurpose==="COVER"?"PHOTO":oldPurpose}});
      }
    });
    return Response.json({ok:true});
  } catch(error) {return attachmentError(error);}
}
