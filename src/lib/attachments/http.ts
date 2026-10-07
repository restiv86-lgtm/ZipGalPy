import { getAuthenticatedUserId } from "@/lib/community/security";

export class AttachmentError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function attachmentUser(request: Request, mutation = false) {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new AttachmentError(401, "로그인이 필요합니다.");
  if (mutation) {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).origin !== new URL(request.url).origin) {
      throw new AttachmentError(403, "허용되지 않은 요청입니다.");
    }
  }
  return userId;
}
export function attachmentError(error: unknown) {
  if (error instanceof AttachmentError) return Response.json({ error: error.message }, { status: error.status });
  // Never log SDK errors: signed URLs and connection strings may be included.
  if (process.env.NODE_ENV !== "production") {
    console.error("Attachment failure type:", error instanceof Error ? error.constructor.name : "UnknownError");
  }
  return Response.json({ error: "첨부파일을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
}
