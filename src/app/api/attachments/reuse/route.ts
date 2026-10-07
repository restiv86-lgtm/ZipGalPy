import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { canAccessTarget } from "@/lib/attachments/access";
import { AttachmentError, attachmentError, attachmentUser } from "@/lib/attachments/http";

export async function POST(request: Request) {
  try {
    const userId = await attachmentUser(request, true);
    const parsed = z.object({ attachmentId: z.string().min(1).max(100), marketplacePostId: z.string().min(1).max(100) }).safeParse(await request.json());
    if (!parsed.success) throw new AttachmentError(400, "사진을 선택해 주세요.");
    const { attachmentId, marketplacePostId } = parsed.data;
    const db = getPrisma();
    if (!await canAccessTarget({ type: "marketplace", id: marketplacePostId }, userId, true)) throw new AttachmentError(404, "장터글을 찾을 수 없습니다.");
    const source = await db.attachment.findFirst({ where: { id: attachmentId, homeItem: { home: { userId } },
      fileAsset: { status: "READY", storeId: process.env.BLOB_STORE_ID, mimeType: { startsWith: "image/" } } } });
    if (!source?.fileAssetId) throw new AttachmentError(404, "사진을 찾을 수 없습니다.");
    await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${source.fileAssetId}, 0))`;
      if (!await tx.attachment.findUnique({ where: { id: source.id } })) throw new AttachmentError(404, "사진을 찾을 수 없습니다.");
      const exists = await tx.attachment.findFirst({ where: { marketplacePostId, fileAssetId: source.fileAssetId } });
      if (exists) return;
      if (await tx.attachment.count({ where: { marketplacePostId } }) >= 10) throw new AttachmentError(400, "사진은 최대 10장까지 첨부할 수 있습니다.");
      await tx.attachment.create({ data: { marketplacePostId, fileAssetId: source.fileAssetId, purpose: "PHOTO" } });
    });
    return Response.json({ ok: true });
  } catch (error) { return attachmentError(error); }
}
