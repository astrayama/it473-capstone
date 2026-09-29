/**
 * Seeds demo data. Run with `npm run seed` (needs .env, the Cloud SQL proxy, and
 * Application Default Credentials for Firebase/Firestore).
 *
 *   - Firestore `catalog` (read only) -> Cloud SQL `InventoryItem` rows for any product
 *     that isn't tracked yet. The catalog itself is owned by the team and is never written here.
 *   - seed/customers.json -> Firebase Auth users + Cloud SQL `Customer`
 *   - ADMIN_EMAILS        -> Firebase Auth staff users (password: SEED_ADMIN_PASSWORD)
 *
 * Safe to re-run: existing stock rows keep their counts; customers are keyed by email.
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

/** Starting stock for catalog items that have no InventoryItem row yet. */
const DEFAULT_STOCK = Number(process.env.SEED_DEFAULT_STOCK ?? 40);
const DEFAULT_REORDER_POINT = 8;

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "seed", file), "utf8")) as T;
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "it473-capstone-project";
  const app = getApps()[0] ?? initializeApp({ projectId });
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

  // ---- Stock rows (Cloud SQL) for the Firestore catalog -----------------
  const catalog = await firestore.collection("catalog").get();
  for (const doc of catalog.docs) {
    const sku = doc.id.toUpperCase(); // matches skuFromId() in src/lib/sku.ts
    const before = await prisma.inventoryItem.findUnique({ where: { productId: doc.id } });
    await prisma.inventoryItem.upsert({
      where: { productId: doc.id },
      create: { productId: doc.id, sku, quantityOnHand: DEFAULT_STOCK, reorderPoint: DEFAULT_REORDER_POINT },
      update: { sku },
    });
    console.log(`stock    ${sku.padEnd(10)} ${String(doc.get("name") ?? "")} ${before ? "(kept)" : `(created: ${DEFAULT_STOCK})`}`);
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
