import { NextResponse } from "next/server";
import { createMarketplacePost } from "@/lib/community/service";
import { getAuthenticatedUserId, isSameOrigin } from "@/lib/community/security";
import { marketplaceSchema } from "@/lib/community/validation";

export async function POST(request: Request, context: RouteContext<"/api/apartments/[id]/marketplace">) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const parsed = marketplaceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { id } = await context.params;
  const post = await createMarketplacePost(userId, id, parsed.data);
  if (!post) return NextResponse.json({ message: "이 아파트 커뮤니티 참여 회원만 등록할 수 있습니다." }, { status: 403 });
  return NextResponse.json({ post }, { status: 201 });
}
