import { NextResponse } from "next/server";
import { createComment } from "@/lib/community/service";
import { getAuthenticatedUserId, isSameOrigin } from "@/lib/community/security";
import { commentSchema } from "@/lib/community/validation";

export async function POST(request: Request, context: RouteContext<"/api/apartments/[id]/community/posts/[postId]/comments">) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const parsed = commentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "댓글 내용을 확인해 주세요." }, { status: 400 });
  const { id, postId } = await context.params;
  const comment = await createComment(userId, id, postId, parsed.data.content);
  if (!comment) return NextResponse.json({ message: "댓글을 작성할 수 없습니다." }, { status: 403 });
  return NextResponse.json({ comment }, { status: 201 });
}
