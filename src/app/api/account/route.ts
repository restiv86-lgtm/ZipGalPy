import * as argon2 from "argon2";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId, isSameOrigin } from "@/lib/community/security";
import { getPrisma } from "@/lib/prisma";

const schema = z.object({
  password: z.string().min(1),
  confirmation: z.literal("회원 탈퇴"),
  understood: z.literal(true),
});

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "탈퇴 확인 항목을 모두 입력해 주세요." }, { status: 400 });

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user || !(await argon2.verify(user.passwordHash, parsed.data.password))) {
    return NextResponse.json({ message: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
  }
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
