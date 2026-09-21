ALTER TABLE "users" RENAME COLUMN "name" TO "nickname";
ALTER TABLE "users" ALTER COLUMN "nickname" TYPE VARCHAR(30);
