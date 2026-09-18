import "server-only";
import { db } from "@/lib/db";
import type { CustomerStatus, Prisma } from "@/generated/prisma/client";

export const CUSTOMERS_PAGE_SIZE = 25;

/** Paginated + searchable list for the admin (the company has ~10k accounts). */
export async function listCustomers(opts: { page?: number; q?: string; status?: CustomerStatus }) {
  const page = Math.max(1, opts.page ?? 1);
  const q = opts.q?.trim();
  const where: Prisma.CustomerWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(q
      ? {
          OR: [
            { businessName: { contains: q, mode: "insensitive" } },
            { contactName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db().customer.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * CUSTOMERS_PAGE_SIZE,
      take: CUSTOMERS_PAGE_SIZE,
    }),
    db().customer.count({ where }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE)) };
}
