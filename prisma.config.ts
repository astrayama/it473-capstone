// Prisma 7 configuration. The database URL lives here (not in schema.prisma).
// `dotenv/config` loads .env for local commands like `prisma migrate dev`.
// A placeholder URL keeps `prisma generate` working where no database is
// configured (e.g. `npm ci` inside the Docker build); migrate/seed need the real one.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
