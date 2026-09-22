import { NextResponse } from "next/server";
import { deleteOwnedPost, updateOwnedPost } from "@/lib/community/service";
import { getAuthenticatedUserId, isSameOrigin } from "@/lib/community/security";
import { postSchema } from "@/lib/community/validation";

async function identity(context: RouteContext<"/api/apartments/[id]/community/posts/[postId]">) { return context.params; }

export async function PATCH(request: Request, context: RouteContext<"/api/apartments/[id]/community/posts/[postId]">) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { id, postId } = await identity(context);
  if (!(await updateOwnedPost(userId, id, postId, parsed.data))) return NextResponse.json({ message: "수정 권한이 없습니다." }, { status: 403 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: RouteContext<"/api/apartments/[id]/community/posts/[postId]">) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const { id, postId } = await identity(context);
  if (!(await deleteOwnedPost(userId, id, postId))) return NextResponse.json({ message: "삭제 권한이 없습니다." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
