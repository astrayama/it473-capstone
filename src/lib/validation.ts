import { z } from "zod";
import { categoryIds, storageTypes } from "@/config/categories";

export const productSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(40),
  name: z.string().trim().min(2, "Name is required").max(120),
  description: z.string().trim().max(2000).default(""),
  category: z.enum(categoryIds),
  brand: z.string().trim().max(80).default(""),
  packSize: z.string().trim().min(1, "Pack size is required (e.g. 12 × 32 oz)").max(60),
  unitsPerCase: z.coerce.number().int().min(1).max(10000),
  casePriceCents: z.coerce.number().int().min(0),
  storage: z.enum(storageTypes),
  imageUrl: z.string().url().nullable().default(null),
  active: z.boolean().default(true),
  // Stock fields live in Cloud SQL but are edited on the same form.
  quantityOnHand: z.coerce.number().int().min(0).default(0),
  reorderPoint: z.coerce.number().int().min(0).default(0),
  binLocation: z.string().trim().max(40).nullable().default(null),
});
export type ProductFormValues = z.input<typeof productSchema>;

export const inventoryPatchSchema = z.object({
  quantityOnHand: z.coerce.number().int().min(0).optional(),
  reorderPoint: z.coerce.number().int().min(0).optional(),
  binLocation: z.string().trim().max(40).nullable().optional(),
});

export const registerSchema = z.object({
  idToken: z.string().min(10),
  businessName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().default(""),
  addressLine1: z.string().trim().min(3).max(120),
  addressLine2: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().length(2, "Use the 2-letter state code").toUpperCase(),
  postalCode: z.string().trim().min(5).max(10),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(999),
      }),
    )
    .min(1, "Your cart is empty."),
  notes: z.string().trim().max(500).optional().default(""),
  requestedDeliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING_PAYMENT", "PAID", "CONFIRMED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
});

export const customerStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "SUSPENDED"]),
});
