import { getPrisma } from "@/lib/prisma";
import type { DocumentInput } from "./validation";

async function ownedHome(userId: string, homeId: string) { return getPrisma().home.findFirst({ where: { id: homeId, userId }, select: { id: true, name: true } }); }
async function validItem(userId: string, homeId: string, id: string | null) { return !id || Boolean(await getPrisma().homeItem.findFirst({ where: { id, homeId, home: { userId } }, select: { id: true } })); }
async function validContract(userId: string, homeId: string, id: string | null) { return !id || Boolean(await getPrisma().homeContract.findFirst({ where: { id, homeId, home: { userId } }, select: { id: true } })); }
const data = (input: DocumentInput) => ({ type: input.type, title: input.title, documentNumber: input.documentNumber, issuer: input.issuer, issuedDate: input.issuedDate, expiresAt: input.expiresAt, homeItemId: input.homeItemId, contractId: input.contractId, memo: input.memo, status: input.status });

export async function listDocuments(userId: string, homeId: string) {
  const home = await ownedHome(userId, homeId); if (!home) return null;
  const prisma = getPrisma();
  const [documents, items, contracts] = await Promise.all([
    prisma.homeDocument.findMany({ where: { homeId }, include: { homeItem: { select: { id: true, name: true } }, contract: { select: { id: true, title: true } } }, orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }] }),
    prisma.homeItem.findMany({ where: { homeId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.homeContract.findMany({ where: { homeId }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);
  return { home, documents, items, contracts };
}
export async function createDocument(userId: string, homeId: string, input: DocumentInput) { if (!await ownedHome(userId, homeId) || !await validItem(userId, homeId, input.homeItemId) || !await validContract(userId, homeId, input.contractId)) return null; return getPrisma().homeDocument.create({ data: { ...data(input), homeId } }); }
export function getOwnedDocument(userId: string, homeId: string, id: string) { return getPrisma().homeDocument.findFirst({ where: { id, homeId, home: { userId } }, include: { homeItem: { select: { id: true, name: true } }, contract: { select: { id: true, title: true } } } }); }
export async function updateDocument(userId: string, homeId: string, id: string, input: DocumentInput) { if (!await validItem(userId, homeId, input.homeItemId) || !await validContract(userId, homeId, input.contractId)) return null; const result = await getPrisma().homeDocument.updateMany({ where: { id, homeId, home: { userId } }, data: data(input) }); return result.count ? getOwnedDocument(userId, homeId, id) : null; }
export async function deleteDocument(userId: string, homeId: string, id: string) { return (await getPrisma().homeDocument.deleteMany({ where: { id, homeId, home: { userId } } })).count === 1; }
export function derivedDocumentStatus(document: { status: string; expiresAt: Date | null }, now = new Date()) { if (document.status === "ARCHIVED") return "ARCHIVED"; return document.expiresAt && document.expiresAt < now ? "EXPIRED" : "ACTIVE"; }
