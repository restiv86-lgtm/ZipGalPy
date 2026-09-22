import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { getMembership } from "@/lib/community/service";
import { getAuthenticatedUserId, isSameOrigin } from "@/lib/community/security";
import { reportSchema } from "@/lib/community/validation";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: Request, context: RouteContext<"/api/apartments/[id]/community/reports">) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "신고 내용을 확인해 주세요." }, { status: 400 });
  const { id } = await context.params;
  const member = await getMembership(userId, id);
  if (!member) return NextResponse.json({ message: "커뮤니티 참여 회원만 신고할 수 있습니다." }, { status: 403 });
  const prisma = getPrisma();
  const target = parsed.data.targetType === "POST"
    ? await prisma.communityPost.findFirst({ where: { id: parsed.data.targetId, apartmentId: id, status: "ACTIVE" }, select: { id: true } })
    : await prisma.communityComment.findFirst({ where: { id: parsed.data.targetId, status: "ACTIVE", post: { apartmentId: id, status: "ACTIVE" } }, select: { id: true } });
  if (!target) return NextResponse.json({ message: "신고 대상을 찾을 수 없습니다." }, { status: 404 });
  try {
    await prisma.communityReport.create({ data: { reporterMemberId: member.id, reason: parsed.data.reason, detail: parsed.data.detail || null, ...(parsed.data.targetType === "POST" ? { postId: target.id } : { commentId: target.id }) } });
    return NextResponse.json({ message: "신고가 접수되었습니다. 검토 후 필요한 조치를 진행합니다." }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ message: "이미 신고한 콘텐츠입니다." }, { status: 409 });
    throw error;
  }
}
