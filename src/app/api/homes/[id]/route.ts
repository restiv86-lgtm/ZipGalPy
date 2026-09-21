import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { deleteOwnedHome, getOwnedHome, updateOwnedHome } from "@/lib/home/service";
import { homeSchema } from "@/lib/home/validation";

type Context = { params: Promise<{ id: string }> };

async function currentUserId() {
  return (await getServerSession(authOptions))?.user?.id;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || new URL(origin).host === new URL(request.url).host;
}

export async function GET(_request: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const home = await getOwnedHome(userId, (await params).id);
  if (!home) return NextResponse.json({ message: "집 정보를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ home });
}

export async function PATCH(request: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const parsed = homeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "입력 내용을 확인해 주세요.", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const home = await updateOwnedHome(userId, (await params).id, parsed.data);
  if (!home) return NextResponse.json({ message: "집 정보를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ home });
}

export async function DELETE(request: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  const deleted = await deleteOwnedHome(userId, (await params).id);
  if (!deleted) return NextResponse.json({ message: "집 정보를 찾을 수 없습니다." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
