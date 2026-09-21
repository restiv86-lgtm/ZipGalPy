CREATE TYPE "ApartmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "apartments" (
  "id" TEXT NOT NULL,
  "externalCode" VARCHAR(80) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "sido" VARCHAR(30) NOT NULL,
  "sigungu" VARCHAR(50) NOT NULL,
  "eupmyeondong" VARCHAR(60),
  "roadAddress" VARCHAR(240) NOT NULL,
  "jibunAddress" VARCHAR(240),
  "dataSource" VARCHAR(40) NOT NULL,
  "sourceUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "apartments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "apartment_members" (
  "id" TEXT NOT NULL,
  "apartmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "apartment_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "apartment_requests" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sido" VARCHAR(30) NOT NULL,
  "sigungu" VARCHAR(50),
  "eupmyeondong" VARCHAR(60),
  "apartmentName" VARCHAR(120) NOT NULL,
  "address" VARCHAR(240),
  "status" "ApartmentRequestStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "apartment_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "apartments_dataSource_externalCode_key" ON "apartments"("dataSource", "externalCode");
CREATE INDEX "apartments_name_idx" ON "apartments"("name");
CREATE INDEX "apartments_sido_sigungu_eupmyeondong_idx" ON "apartments"("sido", "sigungu", "eupmyeondong");
CREATE INDEX "apartments_roadAddress_idx" ON "apartments"("roadAddress");
CREATE UNIQUE INDEX "apartment_members_apartmentId_userId_key" ON "apartment_members"("apartmentId", "userId");
CREATE INDEX "apartment_members_userId_joinedAt_idx" ON "apartment_members"("userId", "joinedAt");
CREATE INDEX "apartment_requests_userId_requestedAt_idx" ON "apartment_requests"("userId", "requestedAt");
CREATE INDEX "apartment_requests_status_requestedAt_idx" ON "apartment_requests"("status", "requestedAt");
ALTER TABLE "apartment_members" ADD CONSTRAINT "apartment_members_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "apartment_members" ADD CONSTRAINT "apartment_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "apartment_requests" ADD CONSTRAINT "apartment_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
