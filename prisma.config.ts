import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI (migrate, seed) prefers DIRECT_URL: a non-pooled connection,
// which migrations need on hosts like Neon or Supabase. The app itself uses
// DATABASE_URL (see src/lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
