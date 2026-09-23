import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getPrisma } from "@/lib/prisma";

export async function getAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return getPrisma().user.findFirst({
    where: { id: session.user.id, role: "ADMIN" },
    select: { id: true, nickname: true },
  });
}
