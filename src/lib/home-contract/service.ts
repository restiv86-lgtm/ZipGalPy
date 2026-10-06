import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { resolveOwnedHomeFilter } from "@/lib/home/record-options";
import type { ContractInput } from "./validation";

const data = (input: ContractInput) => ({ ...input, reminderDays: [...new Set(input.reminderDays)].sort((a, b) => b - a), amount: input.amount == null ? null : new Prisma.Decimal(input.amount) });
async function ownedHome(userId: string, homeId: string) { return getPrisma().home.findFirst({ where: { id: homeId, userId }, select: { id: true, name: true } }); }

export async function listAllContracts(userId: string, requestedHomeId?: string) {
  const { homes, homeId } = await resolveOwnedHomeFilter(userId, requestedHomeId);
  const contracts = await getPrisma().homeContract.findMany({
    where: { home: { userId }, ...(homeId ? { homeId } : {}) },
    include: { home: { select: { id: true, name: true } } },
    orderBy: [{ status: "asc" }, { endDate: "asc" }, { createdAt: "desc" }],
  });
  return { homes, homeId, contracts };
}
export async function listContracts(userId: string, homeId: string) { const home = await ownedHome(userId, homeId); if (!home) return null; return { home, contracts: await getPrisma().homeContract.findMany({ where: { homeId }, orderBy: [{ status: "asc" }, { endDate: "asc" }, { createdAt: "desc" }] }) }; }
export async function createContract(userId: string, homeId: string, input: ContractInput) { if (!await ownedHome(userId, homeId)) return null; return getPrisma().homeContract.create({ data: { ...data(input), homeId } }); }
export function getOwnedContract(userId: string, homeId: string, id: string) { return getPrisma().homeContract.findFirst({ where: { id, homeId, home: { userId } }, include: { home: { select: { id: true, name: true } } } }); }
export async function updateContract(userId: string, homeId: string, id: string, input: ContractInput, targetHomeId = homeId) {
  const [existing, targetHome] = await Promise.all([getOwnedContract(userId, homeId, id), ownedHome(userId, targetHomeId)]);
  if (!existing || !targetHome) return null;
  await getPrisma().$transaction(async (tx) => {
    await tx.homeContract.update({ where: { id }, data: { ...data(input), homeId: targetHomeId } });
    if (targetHomeId !== homeId) await tx.homeDocument.updateMany({ where: { contractId: id }, data: { homeId: targetHomeId, homeItemId: null } });
  });
  return getOwnedContract(userId, targetHomeId, id);
}
export async function deleteContract(userId: string, homeId: string, id: string) { return (await getPrisma().homeContract.deleteMany({ where: { id, homeId, home: { userId } } })).count === 1; }
export function derivedContractStatus(contract: { status: string; endDate: Date | null }, now = new Date()) { if (contract.status === "TERMINATED") return "TERMINATED"; if (!contract.endDate) return "ACTIVE"; const days = Math.ceil((contract.endDate.getTime() - now.getTime()) / 86400000); return days < 0 ? "EXPIRED" : days <= 90 ? "EXPIRING" : "ACTIVE"; }
