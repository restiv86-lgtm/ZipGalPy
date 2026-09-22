import { getPrisma } from "../src/lib/prisma";
import { createRepair, dashboardManagement, getOwnedRepair, getOwnedSchedule, updateRepair, updateSchedule } from "../src/lib/home-management/service";

const prisma = getPrisma();
const token = Date.now().toString();
async function main() {
  const userA = await prisma.user.create({ data: { email: `repair-a-${token}@example.test`, nickname: "수리A", passwordHash: "test-only" } });
  const userB = await prisma.user.create({ data: { email: `repair-b-${token}@example.test`, nickname: "수리B", passwordHash: "test-only" } });
  try {
    const homeA = await prisma.home.create({ data: { userId: userA.id, name: "테스트 집", address: "테스트 주소", housingType: "APARTMENT" } });
    const homeB = await prisma.home.create({ data: { userId: userB.id, name: "다른 집", address: "다른 주소", housingType: "VILLA" } });
    const itemA = await prisma.homeItem.create({ data: { homeId: homeA.id, name: "테스트 냉장고", category: "APPLIANCE" } });
    const repair = await createRepair(userA.id, homeA.id, { homeItemId:itemA.id,type:"REPAIR",title:"냉각기 수리",description:"테스트 기록",repairDate:new Date("2026-09-22"),cost:120000,companyName:"테스트 업체",nextCheckDate:new Date("2026-09-29"),memo:"비공개 메모",createSchedule:true });
    if (!repair) throw new Error("repair create failed");
    const schedule = await prisma.homeSchedule.findFirstOrThrow({ where: { repairId: repair.id } });
    if (await getOwnedRepair(userB.id, homeA.id, repair.id)) throw new Error("cross-user repair read allowed");
    if (await getOwnedSchedule(userB.id, homeA.id, schedule.id)) throw new Error("cross-user schedule read allowed");
    const blockedRepair = await updateRepair(userB.id, homeA.id, repair.id, { homeItemId:null,type:"OTHER",title:"침해",description:"침해",repairDate:new Date(),cost:null,companyName:null,nextCheckDate:null,memo:null,createSchedule:false });
    if (blockedRepair) throw new Error("cross-user repair update allowed");
    const blockedSchedule = await updateSchedule(userB.id, homeA.id, schedule.id, { homeItemId:null,repairId:null,title:"침해",scheduledAt:new Date(),type:"OTHER",completed:true,memo:null });
    if (blockedSchedule) throw new Error("cross-user schedule update allowed");
    const completed = await updateSchedule(userA.id, homeA.id, schedule.id, { homeItemId:itemA.id,repairId:repair.id,title:schedule.title,scheduledAt:schedule.scheduledAt,type:schedule.type,completed:true,memo:schedule.memo });
    if (!completed?.completed) throw new Error("schedule completion failed");
    const management = await dashboardManagement(userA.id);
    if (management.countItems!==1||management.countRepairs!==1||management.countSchedules!==0) throw new Error("dashboard aggregate mismatch");
    if (await prisma.homeRepair.count({ where: { homeId: homeB.id } })) throw new Error("other home changed");
    console.log(JSON.stringify({repairCreated:true,scheduleCreated:true,scheduleCompleted:true,ownershipBlocked:true,counts:{items:management.countItems,repairs:management.countRepairs,incompleteSchedules:management.countSchedules}}));
  } finally { await prisma.user.deleteMany({ where: { id: { in: [userA.id,userB.id] } } }); }
}
main().finally(()=>prisma.$disconnect());
