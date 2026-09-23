CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "CommunityReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED');

ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
UPDATE "users" SET "role" = 'ADMIN' WHERE "email" = 'restiv@naver.com';

ALTER TABLE "community_posts" ALTER COLUMN "authorMemberId" DROP NOT NULL;
ALTER TABLE "community_comments" ALTER COLUMN "authorMemberId" DROP NOT NULL;
ALTER TABLE "community_reports" ALTER COLUMN "reporterMemberId" DROP NOT NULL;
ALTER TABLE "marketplace_posts" ALTER COLUMN "sellerMemberId" DROP NOT NULL;

ALTER TABLE "community_reports"
  ADD COLUMN "status" "CommunityReportStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "handledAt" TIMESTAMP(3),
  ADD COLUMN "handledById" TEXT,
  ADD COLUMN "adminMemo" VARCHAR(1000);

ALTER TABLE "community_posts" DROP CONSTRAINT "community_posts_authorMemberId_fkey";
ALTER TABLE "community_comments" DROP CONSTRAINT "community_comments_authorMemberId_fkey";
ALTER TABLE "community_reports" DROP CONSTRAINT "community_reports_reporterMemberId_fkey";
ALTER TABLE "marketplace_posts" DROP CONSTRAINT "marketplace_posts_sellerMemberId_fkey";

ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "apartment_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "apartment_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reporterMemberId_fkey" FOREIGN KEY ("reporterMemberId") REFERENCES "apartment_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "marketplace_posts" ADD CONSTRAINT "marketplace_posts_sellerMemberId_fkey" FOREIGN KEY ("sellerMemberId") REFERENCES "apartment_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "community_reports_status_createdAt_idx" ON "community_reports"("status", "createdAt");
CREATE INDEX "community_reports_handledById_idx" ON "community_reports"("handledById");
