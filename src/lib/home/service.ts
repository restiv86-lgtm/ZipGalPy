import { getPrisma } from "@/lib/prisma";
import type { HomeInput } from "./validation";

export function listHomes(userId: string) {
  return getPrisma().home.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { items: true } } },
  });
}

export function getOwnedHome(userId: string, id: string) {
  return getPrisma().home.findFirst({ where: { id, userId } });
}

export function createHome(userId: string, input: HomeInput) {
  return getPrisma().home.create({ data: { ...input, userId } });
}

export async function updateOwnedHome(userId: string, id: string, input: HomeInput) {
  const result = await getPrisma().home.updateMany({ where: { id, userId }, data: input });
  if (result.count === 0) return null;
  return getOwnedHome(userId, id);
}

export async function deleteOwnedHome(userId: string, id: string) {
  const result = await getPrisma().home.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
