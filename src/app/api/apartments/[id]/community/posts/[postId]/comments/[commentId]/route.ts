import { NextResponse } from "next/server";
import { deleteOwnedComment } from "@/lib/community/service";
import { getAuthenticatedUserId, isSameOrigin } from "@/lib/community/security";

export async function DELETE(request: Request, context: RouteContext<"/api/apartments/[id]/community/posts/[postId]/comments/[commentId]">) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const { id, postId, commentId } = await context.params;
  if (!(await deleteOwnedComment(userId, id, postId, commentId))) return NextResponse.json({ message: "삭제 권한이 없습니다." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
