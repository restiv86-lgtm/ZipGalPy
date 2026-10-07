import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import type { HomeItemInput } from "./validation";

const data = (input: HomeItemInput) => {
  const { createExpense: _, targetHomeId: __, ...fields } = input;
  void _;
  void __;
  return { ...fields, purchasePrice: input.purchasePrice == null ? null : new Prisma.Decimal(input.purchasePrice) };
};

export async function listAllOwnedItems(userId: string, requestedHomeId?: string) {
  const prisma = getPrisma();
  const homes = await prisma.home.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  const homeId = requestedHomeId && homes.some((home) => home.id === requestedHomeId) ? requestedHomeId : undefined;
  const items = await prisma.homeItem.findMany({
    where: { home: { userId }, ...(homeId ? { homeId } : {}) },
    include: { home: { select: { id: true, name: true } }, images: { where: {fileAsset:{status:"READY",storeId:process.env.BLOB_STORE_ID,mimeType:{startsWith:"image/"}}},select:{id:true},orderBy:[{sortOrder:"asc"},{createdAt:"asc"}],take:1 } },
    orderBy: { createdAt: "desc" },
  });
  return { homes, items, homeId };
}

export async function listOwnedItems(userId: string, homeId: string) {
  const home = await getPrisma().home.findFirst({ where: { id: homeId, userId }, select: { id: true, name: true } });
  if (!home) return null;
  return { home, items: await getPrisma().homeItem.findMany({ where: { homeId }, orderBy: { createdAt: "desc" } }) };
}

export function getOwnedItem(userId: string, homeId: string, itemId: string) {
  return getPrisma().homeItem.findFirst({ where: { id: itemId, homeId, home: { userId } }, include: { home: { select: { id: true, name: true } }, repairs: { select: { id: true, type: true, title: true, repairDate: true, cost: true }, orderBy: { repairDate: "desc" } }, marketplacePosts: { select: { id: true, apartmentId: true, type: true, status: true }, orderBy: { createdAt: "desc" }, take: 5 } } });
}

export async function createOwnedItem(userId: string, homeId: string, input: HomeItemInput) {
  if (!await getPrisma().home.findFirst({ where: { id: homeId, userId }, select: { id: true } })) return null;
  return getPrisma().$transaction(async (tx) => {
    const item = await tx.homeItem.create({ data: { ...data(input), homeId } });
    if (input.createExpense && input.purchasePrice != null) await tx.homeExpense.create({ data: { homeId, homeItemId: item.id, sourceKey: `ITEM_PURCHASE:${item.id}`, category: "PURCHASE", title: `${item.name} 구매`, amount: new Prisma.Decimal(input.purchasePrice), expenseDate: input.purchaseDate ?? new Date() } });
    return item;
  });
}

export async function updateOwnedItem(userId: string, homeId: string, itemId: string, input: HomeItemInput) {
  const prisma = getPrisma();
  const targetHomeId = input.targetHomeId ?? homeId;
  const [ownedItem, targetHome] = await Promise.all([
    prisma.homeItem.findFirst({ where: { id: itemId, homeId, home: { userId } }, select: { id: true } }),
    prisma.home.findFirst({ where: { id: targetHomeId, userId }, select: { id: true } }),
  ]);
  if (!ownedItem || !targetHome) return null;
  await prisma.$transaction(async (tx) => {
    const repairs = await tx.homeRepair.findMany({ where: { homeItemId: itemId }, select: { id: true } });
    const repairIds = repairs.map(({ id }) => id);
    await tx.homeItem.update({ where: { id: itemId }, data: { ...data(input), homeId: targetHomeId } });
    if (targetHomeId !== homeId) {
      await Promise.all([
        tx.homeRepair.updateMany({ where: { homeItemId: itemId }, data: { homeId: targetHomeId } }),
        tx.homeSchedule.updateMany({ where: { OR: [{ homeItemId: itemId }, ...(repairIds.length ? [{ repairId: { in: repairIds } }] : [])] }, data: { homeId: targetHomeId } }),
        tx.homeExpense.updateMany({ where: { OR: [{ homeItemId: itemId }, ...(repairIds.length ? [{ repairId: { in: repairIds } }] : [])] }, data: { homeId: targetHomeId } }),
        tx.homeDocument.updateMany({ where: { homeItemId: itemId }, data: { homeId: targetHomeId } }),
      ]);
    }
  });
  return getOwnedItem(userId, targetHomeId, itemId);
}

export async function deleteOwnedItem(userId: string, homeId: string, itemId: string) {
  return (await getPrisma().homeItem.deleteMany({ where: { id: itemId, homeId, home: { userId } } })).count === 1;
}
