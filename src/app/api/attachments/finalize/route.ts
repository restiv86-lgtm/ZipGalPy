import { del, get, head, put } from "@vercel/blob";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { attachmentTarget, canAccessTarget } from "@/lib/attachments/access";
import { AttachmentError, attachmentError, attachmentUser } from "@/lib/attachments/http";
import { validateAndOptimize } from "@/lib/attachments/validation";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const userId = await attachmentUser(request, true);
    const input = z.object({ assetId: z.string().min(1).max(100) }).safeParse(await request.json());
    if (!input.success) throw new AttachmentError(400, "파일 정보를 확인해 주세요.");
    const db = getPrisma();
    const asset = await db.fileAsset.findFirst({ where: { id: input.data.assetId, ownerId: userId,
      storeId: process.env.BLOB_STORE_ID }, include: { attachments: true } });
    const target = asset?.attachments[0] && attachmentTarget(asset.attachments[0]);
    if (!asset || !target || !await canAccessTarget(target, userId, true)) throw new AttachmentError(404, "파일을 찾을 수 없습니다.");
    if (asset.status === "READY") return Response.json({ ok: true });
    if (asset.status !== "PENDING" || asset.expiresAt.getTime() < Date.now()) throw new AttachmentError(409, "업로드가 만료되었습니다. 다시 첨부해 주세요.");
    const locked = await db.fileAsset.updateMany({ where: { id: asset.id, status: "PENDING" }, data: { status: "PROCESSING" } });
    if (!locked.count) throw new AttachmentError(409, "파일을 확인하고 있습니다.");
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
      await put(storageKey, validated.bytes, { access: "private", addRandomSuffix: false, contentType: validated.mimeType });
      // Ownership may have changed while processing; recheck before making content visible.
      if (!await canAccessTarget(target, userId, true)) { await del(storageKey); throw new AttachmentError(404, "첨부 대상을 찾을 수 없습니다."); }
      await db.fileAsset.update({ where: { id: asset.id }, data: { status: "READY", storageKey,
        byteSize: validated.bytes.length, mimeType: validated.mimeType,
        fileName: validated.extension === "webp" ? asset.fileName.replace(/\.[^.]+$/, ".webp") : asset.fileName } });
      await del(asset.uploadKey).catch(() => undefined);
      return Response.json({ ok: true });
    } catch (error) {
      await db.fileAsset.updateMany({ where: { id: asset.id, status: "PROCESSING" }, data: { status: "REJECTED" } });
      await db.attachment.deleteMany({ where: { fileAssetId: asset.id } });
      await del(asset.uploadKey).catch(() => undefined);
      throw error;
    }
  } catch (error) { return attachmentError(error); }
}
