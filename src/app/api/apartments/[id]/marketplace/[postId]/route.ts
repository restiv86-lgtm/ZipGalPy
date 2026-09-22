import { NextResponse } from "next/server";
import { updateMarketplaceStatus } from "@/lib/community/service";
import { getAuthenticatedUserId, isSameOrigin } from "@/lib/community/security";
import { marketplaceStatusSchema } from "@/lib/community/validation";

export async function PATCH(request: Request, context: RouteContext<"/api/apartments/[id]/marketplace/[postId]">) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const parsed = marketplaceStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "거래 상태를 확인해 주세요." }, { status: 400 });
  const { id, postId } = await context.params;
  if (!(await updateMarketplaceStatus(userId, id, postId, parsed.data.status))) return NextResponse.json({ message: "상태 변경 권한이 없습니다." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
