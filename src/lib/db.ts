import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma client for Cloud SQL (PostgreSQL), created lazily on first use so that
 * `next build` succeeds without a database connection.
 *
 * DATABASE_URL examples:
 *   local  : postgresql://app:pw@127.0.0.1:5432/foodhub          (via Cloud SQL Auth Proxy)
 *   Cloud Run: postgresql://app:pw@localhost/foodhub?host=/cloudsql/PROJECT:REGION:INSTANCE
 */
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

export function db(): PrismaClient {
  if (globalForPrisma.__prisma) return globalForPrisma.__prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });
  globalForPrisma.__prisma = client;
  return client;
}
