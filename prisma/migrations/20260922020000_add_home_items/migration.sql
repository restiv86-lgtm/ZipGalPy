CREATE TYPE "HomeItemCategory" AS ENUM ('APPLIANCE', 'FURNITURE', 'KITCHEN', 'HOUSEHOLD', 'DIGITAL', 'HOBBY', 'CHILDCARE', 'OTHER');
CREATE TYPE "HomeItemStatus" AS ENUM ('USING', 'STORED', 'REPAIRING', 'SOLD', 'GIVEN_AWAY', 'DISPOSED');

CREATE TABLE "home_items" (
  "id" TEXT NOT NULL,
  "homeId" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "category" "HomeItemCategory" NOT NULL,
  "brand" VARCHAR(80),
  "modelName" VARCHAR(120),
  "purchaseDate" DATE,
  "purchasePrice" DECIMAL(14,0),
  "warrantyUntil" DATE,
  "memo" VARCHAR(2000),
  "status" "HomeItemStatus" NOT NULL DEFAULT 'USING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "home_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "home_items_purchase_price_check" CHECK ("purchasePrice" IS NULL OR "purchasePrice" >= 0)
);

CREATE TABLE "home_item_images" (
  "id" TEXT NOT NULL,
  "homeItemId" TEXT NOT NULL,
  "storageKey" VARCHAR(500) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "home_item_images_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "marketplace_posts" ADD COLUMN "sourceHomeItemId" TEXT;
CREATE INDEX "home_items_homeId_status_createdAt_idx" ON "home_items"("homeId", "status", "createdAt");
CREATE INDEX "home_item_images_homeItemId_sortOrder_idx" ON "home_item_images"("homeItemId", "sortOrder");
CREATE INDEX "marketplace_posts_sourceHomeItemId_idx" ON "marketplace_posts"("sourceHomeItemId");
ALTER TABLE "home_items" ADD CONSTRAINT "home_items_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "home_item_images" ADD CONSTRAINT "home_item_images_homeItemId_fkey" FOREIGN KEY ("homeItemId") REFERENCES "home_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_posts" ADD CONSTRAINT "marketplace_posts_sourceHomeItemId_fkey" FOREIGN KEY ("sourceHomeItemId") REFERENCES "home_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
