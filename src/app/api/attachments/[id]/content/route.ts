import { get } from "@vercel/blob";
import { getPrisma } from "@/lib/prisma";
import { attachmentTarget, canAccessTarget } from "@/lib/attachments/access";
import { AttachmentError, attachmentError, attachmentUser } from "@/lib/attachments/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await attachmentUser(request);
    const { id } = await context.params;
    const row = await getPrisma().attachment.findUnique({ where: { id }, include: { fileAsset: true } });
    const target = row && attachmentTarget(row);
    const asset = row?.fileAsset;
    if (!target || !asset || asset.status !== "READY" || asset.storeId !== process.env.BLOB_STORE_ID ||
        !await canAccessTarget(target, userId)) throw new AttachmentError(404, "파일을 찾을 수 없습니다.");
    const blob = await get(asset.storageKey, { access: "private", useCache: false });
    if (!blob || blob.statusCode !== 200) throw new AttachmentError(404, "파일을 찾을 수 없습니다.");
    return new Response(blob.stream, { headers: {
      "Content-Type": asset.mimeType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Content-Disposition": `${asset.mimeType === "application/pdf" ? "attachment" : "inline"}; filename="attachment.${asset.mimeType === "application/pdf" ? "pdf" : "webp"}"; filename*=UTF-8''${encodeURIComponent(asset.fileName)}`,
    } });
  } catch (error) { return attachmentError(error); }
}
