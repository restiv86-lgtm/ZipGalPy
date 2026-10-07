import { getPrisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { attachmentTarget, canAccessTarget } from "@/lib/attachments/access";
import { AttachmentError, attachmentError, attachmentUser } from "@/lib/attachments/http";

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
