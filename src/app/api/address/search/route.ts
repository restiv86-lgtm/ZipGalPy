import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/community/security";
const querySchema = z.object({ keyword: z.string().trim().min(2).max(100), page: z.coerce.number().int().min(1).max(100).default(1) });
type JusoResponse = { results?: { common?: { errorCode?: string }; juso?: Array<{ roadAddr?: string; jibunAddr?: string; zipNo?: string; bdNm?: string }> } };
export async function GET(request: Request) {
  if (!await getAuthenticatedUserId()) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const url = new URL(request.url), parsed = querySchema.safeParse({ keyword: url.searchParams.get("keyword"), page: url.searchParams.get("page") ?? 1 });
  if (!parsed.success) return NextResponse.json({ message: "검색어를 2자 이상 입력해 주세요." }, { status: 400 });
  const key = process.env.JUSO_API_KEY; if (!key) return NextResponse.json({ message: "주소 검색 설정을 확인하고 있습니다. 주소를 직접 입력해 주세요." }, { status: 503 });
  const params = new URLSearchParams({ confmKey: key, currentPage: String(parsed.data.page), countPerPage: "10", keyword: parsed.data.keyword, resultType: "json" });
  try { const response = await fetch(`https://business.juso.go.kr/addrlink/addrLinkApi.do?${params}`, { signal: AbortSignal.timeout(8000), cache: "no-store" }); if (!response.ok) throw new Error("provider"); const data = await response.json() as JusoResponse, common = data.results?.common; if (common?.errorCode !== "0") return NextResponse.json({ message: common?.errorCode === "E0005" ? "검색어를 다시 확인해 주세요." : "주소 검색 서비스를 이용할 수 없습니다. 주소를 직접 입력해 주세요." }, { status: 502 }); const addresses = (data.results?.juso ?? []).flatMap((item) => item.roadAddr ? [{ roadAddr: item.roadAddr, jibunAddr: item.jibunAddr ?? "", zipNo: item.zipNo ?? "", buildingName: item.bdNm ?? "" }] : []); return NextResponse.json({ addresses }); } catch { return NextResponse.json({ message: "주소 검색 서비스에 연결할 수 없습니다. 주소를 직접 입력해 주세요." }, { status: 502 }); }
}
