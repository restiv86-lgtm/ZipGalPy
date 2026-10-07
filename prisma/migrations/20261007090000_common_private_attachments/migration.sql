BEGIN;
-- CreateEnum
CREATE TYPE "FileAssetStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'REJECTED');

-- AlterTable
ALTER TABLE "home_item_images" ADD COLUMN     "contractId" TEXT,
ADD COLUMN     "documentId" TEXT,
ADD COLUMN     "expenseId" TEXT,
ADD COLUMN     "fileAssetId" TEXT,
ADD COLUMN     "homeId" TEXT,
ADD COLUMN     "marketplacePostId" TEXT,
ADD COLUMN     "purpose" VARCHAR(30) NOT NULL DEFAULT 'PHOTO',
ADD COLUMN     "repairId" TEXT,
ALTER COLUMN "homeItemId" DROP NOT NULL,
ALTER COLUMN "storageKey" DROP NOT NULL;

-- CreateTable
CREATE TABLE "file_assets" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "storeId" VARCHAR(100) NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "uploadKey" VARCHAR(500) NOT NULL,
    "fileName" VARCHAR(200) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "status" "FileAssetStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_storageKey_key" ON "file_assets"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_uploadKey_key" ON "file_assets"("uploadKey");

-- CreateIndex
CREATE INDEX "file_assets_ownerId_createdAt_idx" ON "file_assets"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "file_assets_status_expiresAt_idx" ON "file_assets"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "home_item_images_homeId_idx" ON "home_item_images"("homeId");

-- CreateIndex
CREATE INDEX "home_item_images_repairId_idx" ON "home_item_images"("repairId");

-- CreateIndex
CREATE INDEX "home_item_images_expenseId_idx" ON "home_item_images"("expenseId");

-- CreateIndex
CREATE INDEX "home_item_images_contractId_idx" ON "home_item_images"("contractId");

-- CreateIndex
CREATE INDEX "home_item_images_documentId_idx" ON "home_item_images"("documentId");

-- CreateIndex
CREATE INDEX "home_item_images_marketplacePostId_idx" ON "home_item_images"("marketplacePostId");

-- CreateIndex
CREATE INDEX "home_item_images_fileAssetId_idx" ON "home_item_images"("fileAssetId");

-- AddForeignKey
ALTER TABLE "home_item_images" ADD CONSTRAINT "home_item_images_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_item_images" ADD CONSTRAINT "home_item_images_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "home_repairs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_item_images" ADD CONSTRAINT "home_item_images_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "home_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_item_images" ADD CONSTRAINT "home_item_images_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "home_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_item_images" ADD CONSTRAINT "home_item_images_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "home_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_item_images" ADD CONSTRAINT "home_item_images_marketplacePostId_fkey" FOREIGN KEY ("marketplacePostId") REFERENCES "marketplace_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_item_images" ADD CONSTRAINT "home_item_images_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE "home_item_images" ADD CONSTRAINT "attachment_exactly_one_target" CHECK (num_nonnulls("homeId", "homeItemId", "repairId", "expenseId", "contractId", "documentId", "marketplacePostId") = 1);
ALTER TABLE "file_assets" ADD CONSTRAINT "file_asset_positive_size" CHECK ("byteSize" > 0 AND "byteSize" <= 20971520);
COMMIT;

