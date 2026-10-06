import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { resolveOwnedHomeFilter } from "@/lib/home/record-options";
import type { RepairInput, ScheduleInput } from "./validation";

async function ownedHome(userId: string, homeId: string) {
  return getPrisma().home.findFirst({ where: { id: homeId, userId }, select: { id: true, name: true } });
}
async function validItem(userId: string, homeId: string, itemId: string | null) {
  return !itemId || Boolean(await getPrisma().homeItem.findFirst({ where: { id: itemId, homeId, home: { userId } }, select: { id: true } }));
}
async function validRepair(userId: string, homeId: string, repairId: string | null) {
  return !repairId || Boolean(await getPrisma().homeRepair.findFirst({ where: { id: repairId, homeId, home: { userId } }, select: { id: true } }));
}

export async function listAllRepairs(userId: string, requestedHomeId?: string) {
  const { homes, homeId } = await resolveOwnedHomeFilter(userId, requestedHomeId);
  const repairs = await getPrisma().homeRepair.findMany({
    where: { home: { userId }, ...(homeId ? { homeId } : {}) },
    include: { home: { select: { id: true, name: true } }, homeItem: { select: { name: true } } },
    orderBy: [{ repairDate: "desc" }, { createdAt: "desc" }],
  });
  return { homes, homeId, repairs };
}

export async function listRepairs(userId: string, homeId: string) {
  const home = await ownedHome(userId, homeId); if (!home) return null;
  return { home, items: await getPrisma().homeItem.findMany({ where: { homeId }, select: { id: true, name: true } }), repairs: await getPrisma().homeRepair.findMany({ where: { homeId }, include: { homeItem: { select: { name: true } } }, orderBy: { repairDate: "desc" } }) };
}
export async function createRepair(userId: string, homeId: string, input: RepairInput) {
  if (!await ownedHome(userId, homeId) || !await validItem(userId, homeId, input.homeItemId)) return null;
  return getPrisma().$transaction(async (tx) => {
    const repair = await tx.homeRepair.create({ data: { homeId, homeItemId: input.homeItemId, type: input.type, title: input.title, description: input.description, repairDate: input.repairDate, cost: input.cost == null ? null : new Prisma.Decimal(input.cost), companyName: input.companyName, nextCheckDate: input.nextCheckDate, memo: input.memo } });
    if (input.createSchedule && input.nextCheckDate) await tx.homeSchedule.create({ data: { homeId, homeItemId: input.homeItemId, repairId: repair.id, title: `${input.title} 다음 점검`, scheduledAt: input.nextCheckDate, type: "INSPECTION", memo: "수리·점검 기록에서 생성된 일정" } });
    if (input.createExpense && input.cost != null) await tx.homeExpense.create({ data: { homeId, homeItemId: input.homeItemId, repairId: repair.id, sourceKey: `REPAIR_COST:${repair.id}`, category: "REPAIR", title: input.title, amount: new Prisma.Decimal(input.cost), expenseDate: input.repairDate } });
    return repair;
  });
}
export function getOwnedRepair(userId: string, homeId: string, id: string) {
  return getPrisma().homeRepair.findFirst({ where: { id, homeId, home: { userId } }, include: { home: { select: { id: true, name: true } }, homeItem: { select: { id: true, name: true } } } });
}
export async function updateRepair(userId: string, homeId: string, id: string, input: RepairInput, targetHomeId = homeId) {
  const [existing, targetHome] = await Promise.all([getOwnedRepair(userId, homeId, id), ownedHome(userId, targetHomeId)]);
  if (!existing || !targetHome || !await validItem(userId, targetHomeId, input.homeItemId)) return null;
  await getPrisma().$transaction(async (tx) => {
    await tx.homeRepair.update({ where: { id }, data: { homeId: targetHomeId, homeItemId: input.homeItemId, type: input.type, title: input.title, description: input.description, repairDate: input.repairDate, cost: input.cost == null ? null : new Prisma.Decimal(input.cost), companyName: input.companyName, nextCheckDate: input.nextCheckDate, memo: input.memo } });
    if (targetHomeId !== homeId) {
      await tx.homeSchedule.updateMany({ where: { repairId: id }, data: { homeId: targetHomeId, homeItemId: input.homeItemId } });
      await tx.homeExpense.updateMany({ where: { repairId: id }, data: { homeId: targetHomeId, homeItemId: input.homeItemId } });
    }
  });
  return getOwnedRepair(userId, targetHomeId, id);
}
export async function deleteRepair(userId: string, homeId: string, id: string) { return (await getPrisma().homeRepair.deleteMany({ where: { id, homeId, home: { userId } } })).count === 1; }

export async function listAllSchedules(userId: string, requestedHomeId?: string) {
  const { homes, homeId } = await resolveOwnedHomeFilter(userId, requestedHomeId);
  const schedules = await getPrisma().homeSchedule.findMany({
    where: { home: { userId }, ...(homeId ? { homeId } : {}) },
    include: { home: { select: { id: true, name: true } }, homeItem: { select: { name: true } } },
    orderBy: [{ completed: "asc" }, { scheduledAt: "asc" }],
  });
  return { homes, homeId, schedules };
}
export async function listSchedules(userId: string, homeId: string) {
  const home = await ownedHome(userId, homeId); if (!home) return null;
  return { home, items: await getPrisma().homeItem.findMany({ where: { homeId }, select: { id: true, name: true } }), schedules: await getPrisma().homeSchedule.findMany({ where: { homeId }, include: { homeItem: { select: { name: true } } }, orderBy: { scheduledAt: "asc" } }) };
}
export async function createSchedule(userId: string, homeId: string, input: ScheduleInput) {
  if (!await ownedHome(userId, homeId) || !await validItem(userId, homeId, input.homeItemId) || !await validRepair(userId, homeId, input.repairId)) return null;
  return getPrisma().homeSchedule.create({ data: { ...input, homeId } });
}
export function getOwnedSchedule(userId: string, homeId: string, id: string) {
  return getPrisma().homeSchedule.findFirst({ where: { id, homeId, home: { userId } }, include: { home: { select: { id: true, name: true } }, homeItem: { select: { id: true, name: true } } } });
}
export async function updateSchedule(userId: string, homeId: string, id: string, input: ScheduleInput, targetHomeId = homeId) {
  const [existing, targetHome] = await Promise.all([getOwnedSchedule(userId, homeId, id), ownedHome(userId, targetHomeId)]);
  if (!existing || !targetHome || !await validItem(userId, targetHomeId, input.homeItemId) || !await validRepair(userId, targetHomeId, input.repairId)) return null;
  await getPrisma().homeSchedule.update({ where: { id }, data: { ...input, homeId: targetHomeId } });
  return getOwnedSchedule(userId, targetHomeId, id);
}
export async function deleteSchedule(userId: string, homeId: string, id: string) { return (await getPrisma().homeSchedule.deleteMany({ where: { id, homeId, home: { userId } } })).count === 1; }

export async function dashboardManagement(userId: string, homeId?: string | null) {
  const now = new Date(), soon = new Date(now.getTime() + 7 * 86400000); const homeWhere = { userId, ...(homeId ? { id: homeId } : {}) }; const prisma = getPrisma();
  const [countItems, countRepairs, countSchedules, countDocuments, upcoming] = await Promise.all([
    prisma.homeItem.count({ where: { home: homeWhere } }), prisma.homeRepair.count({ where: { home: homeWhere } }), prisma.homeSchedule.count({ where: { home: homeWhere, completed: false } }), prisma.homeDocument.count({ where: { home: homeWhere } }), prisma.homeSchedule.findMany({ where: { home: homeWhere, completed: false, scheduledAt: { lte: soon } }, orderBy: { scheduledAt: "asc" }, take: 6, include: { home: { select: { name: true } } } }),
  ]);
  return { countItems, countRepairs, countSchedules, countDocuments, upcoming, now };
}
