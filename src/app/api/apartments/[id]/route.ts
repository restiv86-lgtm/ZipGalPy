import { NextResponse } from "next/server";
import { getApartment } from "@/lib/apartment/service";

export async function GET(_request: Request, context: RouteContext<"/api/apartments/[id]">) {
  const { id } = await context.params;
  const apartment = await getApartment(id);
  if (!apartment) return NextResponse.json({ message: "아파트를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ apartment });
}
