import type { CommunityReportStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export async function getAdminDashboard() {
  const prisma = getPrisma();
  const [users, homes, apartmentMembers, posts, marketplacePosts, pendingReports, reports] = await Promise.all([
    prisma.user.count(), prisma.home.count(), prisma.apartmentMember.count(),
    prisma.communityPost.count(), prisma.marketplacePost.count(),
    prisma.communityReport.count({ where: { status: "PENDING" } }),
    prisma.communityReport.findMany({
      orderBy: { createdAt: "desc" }, take: 100,
      include: {
        reporterMember: { include: { user: { select: { nickname: true } } } },
        post: { select: { id: true, title: true, apartmentId: true } },
        comment: { select: { id: true, content: true, post: { select: { apartmentId: true, title: true } } } },
        handledBy: { select: { nickname: true } },
      },
    }),
  ]);
  return { counts: { users, homes, apartmentMembers, posts, marketplacePosts, pendingReports }, reports };
}

export async function handleReport(adminId: string, reportId: string, status: CommunityReportStatus, adminMemo: string | null) {
  return getPrisma().communityReport.updateMany({
    where: { id: reportId },
    data: { status, adminMemo, handledById: adminId, handledAt: new Date() },
  });
}
