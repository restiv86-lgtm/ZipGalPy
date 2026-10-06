import { getPrisma } from "@/lib/prisma";

export type RecordHomeOption = {
  id: string;
  name: string;
  items: { id: string; name: string }[];
  repairs: { id: string; title: string; homeItemId: string | null }[];
  contracts: { id: string; title: string }[];
};

export function listRecordHomeOptions(userId: string) {
  return getPrisma().home.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      items: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      repairs: { select: { id: true, title: true, homeItemId: true }, orderBy: { repairDate: "desc" } },
      contracts: { select: { id: true, title: true }, orderBy: { title: "asc" } },
    },
  });
}

export async function resolveOwnedHomeFilter(userId: string, requestedHomeId?: string) {
  const homes = await getPrisma().home.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  const homeId = requestedHomeId && homes.some((home) => home.id === requestedHomeId)
    ? requestedHomeId
    : undefined;
  return { homes, homeId };
}
