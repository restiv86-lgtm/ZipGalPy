import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getApartment, joinApartment } from "@/lib/apartment/service";
import { authOptions } from "@/lib/auth/options";

export async function POST(request: Request, context: RouteContext<"/api/apartments/[id]/join">) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const { id } = await context.params;
  if (!(await getApartment(id))) return NextResponse.json({ message: "아파트를 찾을 수 없습니다." }, { status: 404 });
  try {
    const membership = await joinApartment(session.user.id, id);
    return NextResponse.json({ membership, message: `${membership.apartment.name} 커뮤니티에 참여했습니다.` });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return NextResponse.json({ message: "아파트를 찾을 수 없습니다." }, { status: 404 });
    throw error;
  }
}
