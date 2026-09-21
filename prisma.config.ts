import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Client generation must also work in CI before deployment secrets are injected.
    // Runtime database access still requires DATABASE_URL in src/lib/prisma.ts.
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      "postgresql://localhost/zipgalpy",
  },
});
