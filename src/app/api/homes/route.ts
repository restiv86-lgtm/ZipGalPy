import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { createHome, listHomes } from "@/lib/home/service";
import { homeSchema } from "@/lib/home/validation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  return NextResponse.json({ homes: await listHomes(session.user.id) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = homeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "입력 내용을 확인해 주세요.", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const home = await createHome(session.user.id, parsed.data);
  return NextResponse.json({ home }, { status: 201 });
}
