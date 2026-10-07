import { randomUUID } from "node:crypto";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { canAccessTarget, targetSchema, targetWhere } from "@/lib/attachments/access";
import { AttachmentError, attachmentError, attachmentUser } from "@/lib/attachments/http";
import { validateDeclaration } from "@/lib/attachments/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const inputSchema = z.object({
  target: targetSchema, fileName: z.string().min(1).max(200),
  mimeType: z.string().max(100), byteSize: z.number().int().positive(),
  purpose: z.enum(["PHOTO", "BEFORE", "AFTER", "RECEIPT", "WARRANTY", "QUOTE", "CONTRACT", "DOCUMENT", "COVER"]).default("PHOTO"),
});

export async function GET(request: Request) {
  try {
    const userId = await attachmentUser(request);
    if (!process.env.BLOB_STORE_ID) throw new AttachmentError(503, "파일 저장소가 준비되지 않았습니다.");
    const query = new URL(request.url).searchParams;
    const parsed = targetSchema.safeParse({ type: query.get("type"), id: query.get("id") });
    if (!parsed.success) throw new AttachmentError(400, "첨부 대상이 올바르지 않습니다.");
    if (!await canAccessTarget(parsed.data, userId)) throw new AttachmentError(404, "첨부 대상을 찾을 수 없습니다.");
    const rows = await getPrisma().attachment.findMany({ where: {
      ...targetWhere(parsed.data), fileAsset: { status: "READY", storeId: process.env.BLOB_STORE_ID },
    }, select: { id: true, purpose: true, fileAsset: { select: { fileName: true, mimeType: true, byteSize: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 20 });
    return Response.json({ files: rows.map(row => ({ id: row.id, purpose: row.purpose, ...row.fileAsset,
      contentUrl: `/api/attachments/${row.id}/content` })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return attachmentError(error); }
}

export async function POST(request: Request) {
  try {
    const userId = await attachmentUser(request, true);
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) throw new AttachmentError(400, "파일 정보를 확인해 주세요.");
    const input = parsed.data;
    try { validateDeclaration(input.fileName, input.mimeType, input.byteSize); }
    catch (error) { throw new AttachmentError(400, (error as Error).message); }
    if (["home", "marketplace"].includes(input.target.type) && !input.mimeType.startsWith("image/")) {
      throw new AttachmentError(400, "이 화면에는 사진만 첨부할 수 있습니다.");
    }
    if (!await canAccessTarget(input.target, userId, true)) throw new AttachmentError(404, "첨부 대상을 찾을 수 없습니다.");
    const storeId = process.env.BLOB_STORE_ID;
    if (!storeId) throw new AttachmentError(503, "파일 저장소가 준비되지 않았습니다.");
    const db = getPrisma();
    const pending = await db.fileAsset.count({ where: { ownerId: userId, createdAt: { gte: new Date(Date.now() - 3600_000) } } });
    if (pending >= 50) throw new AttachmentError(429, "첨부 요청이 많습니다. 잠시 후 다시 시도해 주세요.");
    const count = await db.attachment.count({ where: targetWhere(input.target) });
    if (count >= (input.target.type === "home" ? 1 : 10)) throw new AttachmentError(400, "첨부 가능한 파일 수를 초과했습니다.");
    const key = randomUUID();
    const uploadKey = `pending/${key}`;
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    const token = await issueSignedToken({ pathname: uploadKey, operations: ["put"], validUntil: expiresAt.getTime(),
      maximumSizeInBytes: input.byteSize, allowedContentTypes: [input.mimeType] });
    const { presignedUrl } = await presignUrl(token, { operation: "put", pathname: uploadKey, access: "private",
      validUntil: expiresAt.getTime(), maximumSizeInBytes: input.byteSize, allowedContentTypes: [input.mimeType],
      allowOverwrite: false, addRandomSuffix: false });
    const asset = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${input.target.type}:${input.target.id}`}, 0))`;
      if (await tx.attachment.count({ where: targetWhere(input.target) }) >= (input.target.type === "home" ? 1 : 10)) {
        throw new AttachmentError(400, "첨부 가능한 파일 수를 초과했습니다.");
      }
      return tx.fileAsset.create({ data: {
      ownerId: userId, storeId, uploadKey, storageKey: `files/${key}`, expiresAt,
      fileName: input.fileName.replace(/[\\/\u0000-\u001f\u007f]/g, "_"), mimeType: input.mimeType, byteSize: input.byteSize,
      attachments: { create: { ...targetWhere(input.target), purpose: input.purpose } },
      }, select: { id: true, attachments: { select: { id: true } } } });
    });
    return Response.json({ assetId: asset.id, attachmentId: asset.attachments[0].id, uploadUrl: presignedUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return attachmentError(error); }
}
