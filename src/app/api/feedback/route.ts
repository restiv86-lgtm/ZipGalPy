import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { isSameOrigin } from "@/lib/community/security";
import { createFeedback } from "@/lib/feedback/service";
import { feedbackSchema } from "@/lib/feedback/validation";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "입력 내용을 확인해 주세요.", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const feedback = await createFeedback(session.user.id, parsed.data);
  return NextResponse.json({ id: feedback.id, message: "의견이 접수되었습니다. 소중한 의견 감사합니다." }, { status: 201 });
}
