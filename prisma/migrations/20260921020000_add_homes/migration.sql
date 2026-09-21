CREATE TYPE "HousingType" AS ENUM ('APARTMENT', 'VILLA', 'DETACHED_HOUSE', 'OFFICETEL', 'OTHER');

CREATE TABLE "homes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "addressDetail" VARCHAR(100),
    "housingType" "HousingType" NOT NULL,
    "area" DOUBLE PRECISION,
    "builtYear" INTEGER,
    "memo" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "homes_userId_createdAt_idx" ON "homes"("userId", "createdAt");

ALTER TABLE "homes" ADD CONSTRAINT "homes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
