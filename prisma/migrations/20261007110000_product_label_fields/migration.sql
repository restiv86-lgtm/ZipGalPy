BEGIN;
ALTER TABLE "home_items" ADD COLUMN "manufacturedAt" DATE,
ADD COLUMN "serialNumber" VARCHAR(120);
COMMIT;
