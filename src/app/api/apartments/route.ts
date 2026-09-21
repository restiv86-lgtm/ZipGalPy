import { NextResponse } from "next/server";
import { searchApartments } from "@/lib/apartment/service";
import { apartmentSearchSchema } from "@/lib/apartment/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = apartmentSearchSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ message: "검색 조건을 확인해 주세요." }, { status: 400 });
  return NextResponse.json({ apartments: await searchApartments(parsed.data) });
}
