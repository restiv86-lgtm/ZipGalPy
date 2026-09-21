import { NextResponse } from "next/server";
import { listApartmentRegions } from "@/lib/apartment/service";

export async function GET() {
  return NextResponse.json({ regions: await listApartmentRegions() });
}
