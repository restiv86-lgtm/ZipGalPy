import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createApartmentRequest } from "@/lib/apartment/service";
import { apartmentRequestSchema } from "@/lib/apartment/validation";
import { authOptions } from "@/lib/auth/options";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = apartmentRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "입력 내용을 확인해 주세요.", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const result = await createApartmentRequest(session.user.id, parsed.data);
  return NextResponse.json({ id: result.id, message: "아파트 추가 요청이 접수되었습니다." }, { status: 201 });
}
