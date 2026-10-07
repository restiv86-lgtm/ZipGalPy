import { z } from "zod";
import { getPrisma } from "@/lib/prisma";

export const targetSchema = z.object({
  type: z.enum(["home", "item", "repair", "expense", "contract", "document", "marketplace"]),
  id: z.string().min(1).max(100),
});
export type AttachmentTarget = z.infer<typeof targetSchema>;
export const targetFields = {
  home: "homeId", item: "homeItemId", repair: "repairId", expense: "expenseId",
  contract: "contractId", document: "documentId", marketplace: "marketplacePostId",
} as const;
export function targetWhere(target: AttachmentTarget) { return { [targetFields[target.type]]: target.id }; }

export async function canAccessTarget(target: AttachmentTarget, userId: string, write = false) {
  const db = getPrisma();
  if (target.type === "home") return !!await db.home.findFirst({ where: { id: target.id, userId }, select: { id: true } });
  if (target.type === "marketplace") {
    return !!await db.marketplacePost.findFirst({ where: {
      id: target.id,
      ...(write ? { sellerMember: { userId } } : { apartment: { members: { some: { userId } } } }),
    }, select: { id: true } });
  }
  const where = { id: target.id, home: { userId } };
  switch (target.type) {
    case "item": return !!await db.homeItem.findFirst({ where, select: { id: true } });
    case "repair": return !!await db.homeRepair.findFirst({ where, select: { id: true } });
    case "expense": return !!await db.homeExpense.findFirst({ where, select: { id: true } });
    case "contract": return !!await db.homeContract.findFirst({ where, select: { id: true } });
    case "document": return !!await db.homeDocument.findFirst({ where, select: { id: true } });
  }
}

export function attachmentTarget(row: {
  homeId: string | null; homeItemId: string | null; repairId: string | null;
  expenseId: string | null; contractId: string | null; documentId: string | null;
  marketplacePostId: string | null;
}): AttachmentTarget | null {
  for (const [type, field] of Object.entries(targetFields)) {
    const id = row[field as keyof typeof row];
    if (id) return { type: type as AttachmentTarget["type"], id };
  }
  return null;
}
