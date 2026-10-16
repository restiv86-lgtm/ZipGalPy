import { getPrisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { attachmentTarget, canAccessTarget } from "@/lib/attachments/access";
import { AttachmentError, attachmentError, attachmentUser } from "@/lib/attachments/http";
import {z} from "zod";

export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
  try{
    const userId=await attachmentUser(request,true),{id}=await context.params;
    if(!process.env.BLOB_STORE_ID)throw new AttachmentError(503,"파일 저장소가 준비되지 않았습니다.");
    const input=z.object({purpose:z.enum(["PHOTO","LABEL"])}).safeParse(await request.json());
    if(!input.success)throw new AttachmentError(400,"사진 용도를 확인해 주세요.");
    const db=getPrisma();
    await db.$transaction(async tx=>{
      const row=await tx.attachment.findFirst({where:{id,homeItem:{home:{userId}},fileAsset:{status:"READY",storeId:process.env.BLOB_STORE_ID,mimeType:{startsWith:"image/"}}},select:{id:true,homeItemId:true}});
      if(!row?.homeItemId)throw new AttachmentError(404,"사진을 찾지 못했습니다.");
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`item:${row.homeItemId}`}, 0))`;
      const updated=await tx.attachment.updateMany({where:{id,homeItem:{home:{userId}},fileAsset:{status:"READY",storeId:process.env.BLOB_STORE_ID}},data:{purpose:input.data.purpose}});
      if(!updated.count)throw new AttachmentError(404,"사진을 찾지 못했습니다.");
    });
    return Response.json({ok:true});
  }catch(error){return attachmentError(error);}
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await attachmentUser(request, true);
    const { id } = await context.params;
    const db = getPrisma();
    const row = await db.attachment.findUnique({ where: { id }, include: { fileAsset: true } });
    const target = row && attachmentTarget(row);
    if (!target || !row?.fileAsset || row.fileAsset.storeId !== process.env.BLOB_STORE_ID ||
        !await canAccessTarget(target, userId, true)) throw new AttachmentError(404, "파일을 찾을 수 없습니다.");
    if (row.fileAsset.status === "PROCESSING") throw new AttachmentError(409, "파일을 확인하고 있습니다. 잠시 후 삭제해 주세요.");
    await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${row.fileAssetId}, 0))`;
      const references = await tx.attachment.count({ where: { fileAssetId: row.fileAssetId } });
      if (references === 1) {
        // Do not erase a photo still explicitly shared with a marketplace post.
        await del([row.fileAsset!.storageKey, row.fileAsset!.uploadKey]);
      }
      await tx.attachment.delete({ where: { id } });
      if (references === 1) await tx.fileAsset.delete({ where: { id: row.fileAssetId! } });
    }, { timeout: 20_000 });
    return Response.json({ ok: true });
  } catch (error) { return attachmentError(error); }
}
