CREATE TYPE "HomeDocumentType" AS ENUM ('CONTRACT','WARRANTY','RECEIPT','MANUAL','INSURANCE','TAX','CERTIFICATE','OTHER');
CREATE TYPE "HomeDocumentStatus" AS ENUM ('ACTIVE','EXPIRED','ARCHIVED');
CREATE TABLE "home_documents" ("id" TEXT NOT NULL,"homeId" TEXT NOT NULL,"homeItemId" TEXT,"contractId" TEXT,"type" "HomeDocumentType" NOT NULL,"title" VARCHAR(120) NOT NULL,"documentNumber" VARCHAR(120),"issuer" VARCHAR(120),"issuedDate" DATE,"expiresAt" DATE,"memo" VARCHAR(2000),"status" "HomeDocumentStatus" NOT NULL DEFAULT 'ACTIVE',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "home_documents_pkey" PRIMARY KEY("id"));
CREATE INDEX "home_documents_homeId_status_expiresAt_idx" ON "home_documents"("homeId","status","expiresAt");
CREATE INDEX "home_documents_homeItemId_idx" ON "home_documents"("homeItemId");
CREATE INDEX "home_documents_contractId_idx" ON "home_documents"("contractId");
ALTER TABLE "home_documents" ADD CONSTRAINT "home_documents_homeId_fkey" FOREIGN KEY("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "home_documents" ADD CONSTRAINT "home_documents_homeItemId_fkey" FOREIGN KEY("homeItemId") REFERENCES "home_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "home_documents" ADD CONSTRAINT "home_documents_contractId_fkey" FOREIGN KEY("contractId") REFERENCES "home_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
