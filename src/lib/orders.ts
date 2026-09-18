import "server-only";
import { db } from "@/lib/db";
import { getProductsByIds } from "@/lib/catalog";
import { getInventoryMap } from "@/lib/inventory";
import { siteConfig } from "@/config/site";
import { UserFacingError } from "@/lib/errors";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

export interface CartLine {
  productId: string;
  quantity: number;
}

export type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true; customer: true } }>;

/**
 * Validates the cart against the live catalog + stock and records the order
 * (status PENDING_PAYMENT). Prices are always taken from Firestore, never from the client.
 */
export async function createOrderFromCart(
  customerId: string,
  lines: CartLine[],
  extras: { notes?: string; requestedDeliveryDate?: string },
): Promise<OrderWithItems> {
  const ids = lines.map((l) => l.productId);
  const [products, inventory] = await Promise.all([getProductsByIds(ids), getInventoryMap(ids)]);

  const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];
  const problems: string[] = [];

  for (const line of lines) {
    const product = products.get(line.productId);
    if (!product || !product.active) {
      problems.push(`An item in your cart is no longer available.`);
      continue;
    }
    const stock = inventory.get(product.id)?.quantityOnHand ?? 0;
    if (stock < line.quantity) {
      problems.push(`${product.name}: only ${stock} case(s) available.`);
      continue;
    }
    items.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      packSize: product.packSize,
      casePriceCents: product.casePriceCents,
      quantity: line.quantity,
      lineTotalCents: product.casePriceCents * line.quantity,
    });
  }

  if (problems.length) throw new UserFacingError(problems.join(" "));

  const subtotalCents = items.reduce((sum, i) => sum + i.lineTotalCents, 0);
  if (subtotalCents < siteConfig.minimumOrderCents) {
    throw new UserFacingError(`Minimum order is ${(siteConfig.minimumOrderCents / 100).toFixed(2)} USD.`);
  }

  return db().order.create({
    data: {
      customerId,
      subtotalCents,
      totalCents: subtotalCents, // tax / delivery fees can be added here later
      notes: extras.notes || null,
      requestedDeliveryDate: extras.requestedDeliveryDate
        ? new Date(`${extras.requestedDeliveryDate}T00:00:00Z`)
        : null,
      items: { create: items },
    },
    include: { items: true, customer: true },
  });
}

/** Marks an order paid and takes the stock out of inventory. Safe to call twice. */
export async function markOrderPaid(
  orderId: string,
  payment: { checkoutSessionId?: string | null; paymentIntentId?: string | null } = {},
): Promise<void> {
  await db().$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status !== "PENDING_PAYMENT") return;
    for (const item of order.items) {
      await tx.inventoryItem.updateMany({
        where: { productId: item.productId },
        data: { quantityOnHand: { decrement: item.quantity } },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        stripeCheckoutSessionId: payment.checkoutSessionId ?? order.stripeCheckoutSessionId,
        stripePaymentIntentId: payment.paymentIntentId ?? order.stripePaymentIntentId,
      },
    });
  });
}

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  if (status === "PAID") {
    await markOrderPaid(orderId);
    return;
  }
  await db().order.update({ where: { id: orderId }, data: { status } });
}

export const ORDERS_PAGE_SIZE = 25;

export async function listOrders(opts: {
  page?: number;
  status?: OrderStatus;
  customerId?: string;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.OrderWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.customerId ? { customerId: opts.customerId } : {}),
  };
  const [rows, total] = await Promise.all([
    db().order.findMany({
      where,
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
    }),
    db().order.count({ where }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)) };
}
