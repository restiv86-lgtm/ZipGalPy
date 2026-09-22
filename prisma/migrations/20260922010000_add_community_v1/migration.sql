CREATE TYPE "CommunityPostCategory" AS ENUM ('GENERAL', 'QUESTION', 'INFO', 'LOST_AND_FOUND');
CREATE TYPE "CommunityContentStatus" AS ENUM ('ACTIVE', 'DELETED');
CREATE TYPE "CommunityReportReason" AS ENUM ('SPAM_AD', 'ABUSE', 'INAPPROPRIATE', 'SUSPECTED_FRAUD', 'OTHER');
CREATE TYPE "MarketplacePostType" AS ENUM ('SELL', 'GIVEAWAY');
CREATE TYPE "MarketplacePostStatus" AS ENUM ('ACTIVE', 'RESERVED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "community_posts" (
  "id" TEXT NOT NULL,
  "apartmentId" TEXT NOT NULL,
  "authorMemberId" TEXT NOT NULL,
  "category" "CommunityPostCategory" NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "content" VARCHAR(5000) NOT NULL,
  "status" "CommunityContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_comments" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "authorMemberId" TEXT NOT NULL,
  "content" VARCHAR(1000) NOT NULL,
  "status" "CommunityContentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_reports" (
  "id" TEXT NOT NULL,
  "reporterMemberId" TEXT NOT NULL,
  "postId" TEXT,
  "commentId" TEXT,
  "reason" "CommunityReportReason" NOT NULL,
  "detail" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "community_reports_one_target_check" CHECK (("postId" IS NOT NULL) <> ("commentId" IS NOT NULL))
);

CREATE TABLE "marketplace_posts" (
  "id" TEXT NOT NULL,
  "apartmentId" TEXT NOT NULL,
  "sellerMemberId" TEXT NOT NULL,
  "type" "MarketplacePostType" NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "description" VARCHAR(5000) NOT NULL,
  "price" INTEGER NOT NULL,
  "status" "MarketplacePostStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_posts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "marketplace_posts_price_check" CHECK (("type" = 'GIVEAWAY' AND "price" = 0) OR ("type" = 'SELL' AND "price" > 0))
);

CREATE INDEX "community_posts_apartmentId_status_createdAt_idx" ON "community_posts"("apartmentId", "status", "createdAt");
CREATE INDEX "community_posts_authorMemberId_idx" ON "community_posts"("authorMemberId");
CREATE INDEX "community_comments_postId_status_createdAt_idx" ON "community_comments"("postId", "status", "createdAt");
CREATE INDEX "community_comments_authorMemberId_idx" ON "community_comments"("authorMemberId");
CREATE UNIQUE INDEX "community_reports_reporterMemberId_postId_key" ON "community_reports"("reporterMemberId", "postId");
CREATE UNIQUE INDEX "community_reports_reporterMemberId_commentId_key" ON "community_reports"("reporterMemberId", "commentId");
CREATE INDEX "community_reports_postId_createdAt_idx" ON "community_reports"("postId", "createdAt");
CREATE INDEX "community_reports_commentId_createdAt_idx" ON "community_reports"("commentId", "createdAt");
CREATE INDEX "marketplace_posts_apartmentId_status_createdAt_idx" ON "marketplace_posts"("apartmentId", "status", "createdAt");
CREATE INDEX "marketplace_posts_sellerMemberId_idx" ON "marketplace_posts"("sellerMemberId");

ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "apartment_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "apartment_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reporterMemberId_fkey" FOREIGN KEY ("reporterMemberId") REFERENCES "apartment_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_posts" ADD CONSTRAINT "marketplace_posts_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_posts" ADD CONSTRAINT "marketplace_posts_sellerMemberId_fkey" FOREIGN KEY ("sellerMemberId") REFERENCES "apartment_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
