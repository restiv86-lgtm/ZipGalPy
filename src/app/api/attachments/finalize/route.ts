import { del, get, head, put } from "@vercel/blob";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { attachmentTarget, canAccessTarget, targetWhere } from "@/lib/attachments/access";
import { AttachmentError, attachmentError, attachmentUser } from "@/lib/attachments/http";
import { validateAndOptimize } from "@/lib/attachments/validation";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const userId = await attachmentUser(request, true);
    const input = z.object({ assetId: z.string().min(1).max(100), replaceAttachmentId:z.string().min(1).max(100).optional() }).safeParse(await request.json());
    if (!input.success) throw new AttachmentError(400, "파일 정보를 확인해 주세요.");
    const db = getPrisma();
    const asset = await db.fileAsset.findFirst({ where: { id: input.data.assetId, ownerId: userId,
      storeId: process.env.BLOB_STORE_ID }, include: { attachments: true } });
    const target = asset?.attachments[0] && attachmentTarget(asset.attachments[0]);
    if (!asset || !target || !await canAccessTarget(target, userId, true)) throw new AttachmentError(404, "파일을 찾을 수 없습니다.");
    if (asset.status === "READY") return Response.json({ ok: true });
    const replaceId=input.data.replaceAttachmentId;
    if(replaceId&&(target.type!=="item"||asset.attachments[0].purpose!=="LABEL")) throw new AttachmentError(400,"제품 라벨만 교체할 수 있습니다.");
    if (asset.status !== "PENDING" || asset.expiresAt.getTime() < Date.now()) throw new AttachmentError(409, "업로드가 만료되었습니다. 다시 첨부해 주세요.");
    const locked = await db.fileAsset.updateMany({ where: { id: asset.id, status: "PENDING" }, data: { status: "PROCESSING" } });
    if (!locked.count) throw new AttachmentError(409, "파일을 확인하고 있습니다.");
    let finalStorageKey:string|undefined;
    try {
      const metadata = await head(asset.uploadKey);
      if (metadata.size !== asset.byteSize || metadata.contentType !== asset.mimeType) throw new AttachmentError(400, "파일 정보가 일치하지 않습니다.");
      const uploaded = await get(asset.uploadKey, { access: "private", useCache: false });
      if (!uploaded || uploaded.statusCode !== 200) throw new AttachmentError(400, "업로드된 파일을 찾을 수 없습니다.");
      // Read with a hard limit even if object metadata is unexpected.
      const reader = uploaded.stream.getReader();
      const chunks: Uint8Array[] = []; let size = 0;
      while (true) {
        const result = await reader.read(); if (result.done) break;
        size += result.value.byteLength;
        if (size > asset.byteSize) { await reader.cancel(); throw new AttachmentError(400, "파일 크기가 일치하지 않습니다."); }
        chunks.push(result.value);
      }
      let validated;
      try { validated = await validateAndOptimize(Buffer.concat(chunks), asset.fileName, asset.mimeType); }
      catch { throw new AttachmentError(400, "손상되었거나 허용되지 않는 파일입니다."); }
      const storageKey = `${asset.storageKey}.${validated.extension}`;
      finalStorageKey=storageKey;
      await put(storageKey, validated.bytes, { access: "private", addRandomSuffix: false, contentType: validated.mimeType });
      // Ownership may have changed while processing; recheck before making content visible.
      if (!await canAccessTarget(target, userId, true)) { await del(storageKey); throw new AttachmentError(404, "첨부 대상을 찾을 수 없습니다."); }
      const obsoleteKeys:string[]=[];
      await db.$transaction(async tx=>{
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${target.type}:${target.id}`}, 0))`;
        const previous=replaceId?await tx.attachment.findFirst({where:{id:replaceId,homeItemId:target.id,purpose:"LABEL",fileAsset:{status:"READY",storeId:process.env.BLOB_STORE_ID}},include:{fileAsset:true}}):null;
        if(replaceId&&(!previous||!await tx.homeItem.findFirst({where:{id:target.id,home:{userId}},select:{id:true}})))throw new AttachmentError(404,"교체할 라벨을 찾지 못했습니다.");
        const readyCount=await tx.attachment.count({where:{...targetWhere(target),fileAsset:{status:"READY",storeId:process.env.BLOB_STORE_ID}}});
        if(readyCount-(previous?1:0)>=(target.type==="home"?1:10))throw new AttachmentError(409,"첨부 가능한 파일 수를 초과했습니다.");
        await tx.fileAsset.update({ where: { id: asset.id }, data: { status: "READY", storageKey,
          byteSize: validated.bytes.length, mimeType: validated.mimeType,
          fileName: validated.extension === "webp" ? asset.fileName.replace(/\.[^.]+$/, ".webp") : asset.fileName } });
        if(previous?.fileAssetId){
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${previous.fileAssetId}, 0))`;
          const references=await tx.attachment.count({where:{fileAssetId:previous.fileAssetId}});
          if(references===1&&previous.fileAsset)obsoleteKeys.push(previous.fileAsset.storageKey,previous.fileAsset.uploadKey);
          await tx.attachment.delete({where:{id:previous.id}});
          if(references===1)await tx.fileAsset.delete({where:{id:previous.fileAssetId}});
        }
      },{timeout:20_000});
      if(obsoleteKeys.length)await del(obsoleteKeys).catch(()=>undefined);
      await del(asset.uploadKey).catch(() => undefined);
      return Response.json({ ok: true });
    } catch (error) {
      // A transaction may have committed even if its acknowledgement was lost.
      // Never clean up READY content after the old label was atomically replaced.
      const committed=await db.fileAsset.findFirst({where:{id:asset.id,ownerId:userId,storeId:process.env.BLOB_STORE_ID,status:"READY"},select:{id:true}});
      if(committed)return Response.json({ok:true});
      await db.fileAsset.updateMany({ where: { id: asset.id, status: "PROCESSING" }, data: { status: "REJECTED" } });
      await db.attachment.deleteMany({ where: { fileAssetId: asset.id } });
      await del(asset.uploadKey).catch(() => undefined);
      if(finalStorageKey)await del(finalStorageKey).catch(()=>undefined);
      throw error;
    }
  } catch (error) { return attachmentError(error); }
}
