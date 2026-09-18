/**
 * Seeds demo data. Run with `npm run seed` (needs .env, the Cloud SQL proxy, and
 * Application Default Credentials for Firebase/Firestore).
 *
 *   - seed/products.json  -> Firestore `products` + Cloud SQL `InventoryItem`
 *   - seed/customers.json -> Firebase Auth users + Cloud SQL `Customer`
 *   - ADMIN_EMAILS        -> Firebase Auth staff users (password: SEED_ADMIN_PASSWORD)
 *
 * Safe to re-run: products are keyed by a slug of their name, customers by email.
 * This script is standalone (it does not import from src/lib, which is server-only).
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type CustomerStatus } from "../src/generated/prisma/client";

interface SeedProduct {
  sku: string;
  name: string;
  category: string;
  brand: string;
  packSize: string;
  unitsPerCase: number;
  casePrice: number;
  storage: string;
  description: string;
  quantityOnHand: number;
  reorderPoint: number;
  binLocation?: string;
}

interface SeedCustomer {
  email: string;
  password: string;
  businessName: string;
  contactName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  status: CustomerStatus;
}

const slugify = (v: string) =>
  v.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "seed", file), "utf8")) as T;
}

async function main() {
  const app = getApps()[0] ?? initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT });
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

  // ---- Products (Firestore) + stock (Cloud SQL) --------------------------
  const products = readJson<SeedProduct[]>("products.json");
  const now = new Date().toISOString();
  for (const p of products) {
    const id = slugify(p.name);
    await firestore.collection("products").doc(id).set(
      {
        sku: p.sku,
        name: p.name,
        slug: id,
        description: p.description,
        category: p.category,
        brand: p.brand,
        packSize: p.packSize,
        unitsPerCase: p.unitsPerCase,
        casePriceCents: Math.round(p.casePrice * 100),
        storage: p.storage,
        imageUrl: null,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
    await prisma.inventoryItem.upsert({
      where: { productId: id },
      create: { productId: id, sku: p.sku, quantityOnHand: p.quantityOnHand, reorderPoint: p.reorderPoint, binLocation: p.binLocation ?? null },
      update: { sku: p.sku, quantityOnHand: p.quantityOnHand, reorderPoint: p.reorderPoint, binLocation: p.binLocation ?? null },
    });
    console.log(`product  ${p.sku.padEnd(10)} ${p.name}`);
  }

  // ---- Customers (Firebase Auth + Cloud SQL) -----------------------------
  const customers = readJson<SeedCustomer[]>("customers.json");
  for (const c of customers) {
    let uid: string;
    try {
      uid = (await auth.getUserByEmail(c.email)).uid;
    } catch {
      uid = (await auth.createUser({ email: c.email, password: c.password, displayName: c.contactName, emailVerified: true })).uid;
    }
    const data = {
      firebaseUid: uid,
      email: c.email,
      businessName: c.businessName,
      contactName: c.contactName,
      phone: c.phone ?? null,
      addressLine1: c.addressLine1,
      addressLine2: c.addressLine2 ?? null,
      city: c.city,
      state: c.state,
      postalCode: c.postalCode,
      status: c.status,
    };
    await prisma.customer.upsert({ where: { email: c.email }, create: data, update: data });
    console.log(`customer ${c.email.padEnd(24)} ${c.businessName} (${c.status})`);
  }

  // ---- Staff logins ------------------------------------------------------
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  for (const email of admins) {
    try {
      await auth.getUserByEmail(email);
      console.log(`admin    ${email} (exists)`);
    } catch {
      await auth.createUser({ email, password: adminPassword, emailVerified: true });
      console.log(`admin    ${email} (created, password: ${adminPassword})`);
    }
  }

  await prisma.$disconnect();
  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
