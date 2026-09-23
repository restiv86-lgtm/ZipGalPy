import {NextResponse} from "next/server";
import {z} from "zod";
import {handleReport} from "@/lib/admin/service";
import {getAdminUser} from "@/lib/admin/security";
import {isSameOrigin} from "@/lib/community/security";
const schema=z.object({status:z.enum(["PENDING","REVIEWED","DISMISSED","ACTIONED"]),adminMemo:z.string().trim().max(1000).optional()});
export async function PATCH(request:Request,context:RouteContext<"/api/admin/reports/[reportId]">){const admin=await getAdminUser();if(!admin)return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});if(!isSameOrigin(request))return NextResponse.json({message:"허용되지 않은 요청입니다."},{status:403});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"입력값을 확인해 주세요."},{status:400});const{reportId}=await context.params,result=await handleReport(admin.id,reportId,parsed.data.status,parsed.data.adminMemo||null);return result.count?NextResponse.json({message:"신고 처리 상태를 저장했습니다."}):NextResponse.json({message:"신고를 찾을 수 없습니다."},{status:404})}
