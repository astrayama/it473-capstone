/**
 * Seeds the Firestore catalog from seed/catalog.json and uploads its photos.
 *
 *   npm run seed:catalog                   # categories + products, then photos
 *   npm run seed:catalog -- --dry-run      # print what would change, write nothing
 *   npm run seed:catalog -- --skip-images  # Firestore only
 *   npm run seed:catalog -- --images-only  # photos only (e.g. after a bucket grant)
 *
 * Writes:
 *   categories/{id}  merge-set (other categories are left alone)
 *   catalog/{sku-id} merge-set of the shared schema plus the optional details; createdAt is
 *                    kept for existing documents; fields this file doesn't know are kept;
 *                    nothing is ever deleted.
 *   gs://<bucket>/products/{sku-id}/images/primary.jpg from seed/images/{sku-id}.jpg, then
 *                    bumps the document's updatedAt so cached /media URLs refresh.
 *
 * Needs Application Default Credentials with roles/datastore.user (Firestore) and, for
 * photos, storage object create/overwrite on the media bucket (roles/storage.objectAdmin).
 * Back up first: seed/backup/ holds the catalog as it was before the first seed.
 * Standalone on purpose (src/lib is server-only).
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { Storage } from "@google-cloud/storage";

interface SeedCategory {
  id: string;
  name: string;
  description: string;
  sortOrder: string;
}

interface SeedProduct {
  id: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  basePrice: number;
  description: string;
  origin: string;
  packSize: string;
  storage: string;
  shelfLife: string;
  notes: string;
  certifications: string[];
  season: string;
  photo: { file: string };
}

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const SKIP_IMAGES = args.has("--skip-images");
const IMAGES_ONLY = args.has("--images-only");

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "it473-capstone-project";
const bucketName = process.env.GCS_BUCKET || `${projectId}-media`;
const root = process.cwd();
const seed = JSON.parse(readFileSync(path.join(root, "seed", "catalog.json"), "utf8")) as {
  categories: SeedCategory[];
  products: SeedProduct[];
};

const primaryPath = (id: string) => `products/${id}/images/primary.jpg`;

async function main() {
  const app = getApps()[0] ?? initializeApp({ projectId });
  const db = getFirestore(app);
  console.log(`Project ${projectId} · bucket ${bucketName}${DRY ? " · DRY RUN" : ""}\n`);

  // ---- Firestore -----------------------------------------------------------
  if (!IMAGES_ONLY) {
    const known = new Set((await db.collection("categories").get()).docs.map((d) => d.id));
    for (const c of seed.categories) {
      console.log(`category ${known.has(c.id) ? "update" : "create"} ${c.id.padEnd(20)} ${c.name}`);
    }
    for (const p of seed.products) {
      if (!known.has(p.category) && !seed.categories.some((c) => c.id === p.category)) {
        throw new Error(`${p.id}: category "${p.category}" doesn't exist in Firestore or seed/catalog.json.`);
      }
    }

    const refs = seed.products.map((p) => db.collection("catalog").doc(p.id));
    const existing = await db.getAll(...refs);
    const batch = db.batch();
    seed.categories.forEach((c) => batch.set(db.collection("categories").doc(c.id), c, { merge: true }));
    seed.products.forEach((p, i) => {
      const before = existing[i];
      const extraPaths = ((before.get("imagePaths") as unknown[] | undefined) ?? [])
        .slice(1)
        .filter((x): x is string => typeof x === "string" && x !== primaryPath(p.id));
      batch.set(
        refs[i],
        {
          name: p.name,
          description: p.description,
          category: p.category,
          unitOfMeasure: p.unitOfMeasure,
          basePrice: p.basePrice,
          origin: p.origin,
          packSize: p.packSize,
          storage: p.storage,
          shelfLife: p.shelfLife,
          notes: p.notes,
          season: p.season,
          certifications: p.certifications,
          imagePaths: [primaryPath(p.id), ...extraPaths],
          isActive: true,
          updatedAt: FieldValue.serverTimestamp(),
          ...(before.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        },
        { merge: true },
      );
      const was = before.exists ? `upgrade (was "${before.get("name")}")` : "create";
      console.log(`product  ${p.id.padEnd(9)} ${was.padEnd(38)} ${p.name}`);
    });
    if (!DRY) await batch.commit();
    console.log(`\n${DRY ? "Would write" : "Wrote"} ${seed.categories.length} categories and ${seed.products.length} products.`);
  }

  // ---- Photos ----------------------------------------------------------------
  if (SKIP_IMAGES) return;
  const bucket = new Storage({ projectId }).bucket(bucketName);
  const uploaded: string[] = [];
  for (const p of seed.products) {
    const file = path.join(root, p.photo.file);
    if (!existsSync(file)) {
      console.warn(`photo    ${p.id} missing ${p.photo.file}, skipped`);
      continue;
    }
    if (DRY) {
      console.log(`photo    ${p.id} -> gs://${bucketName}/${primaryPath(p.id)}`);
      continue;
    }
    try {
      await bucket.upload(file, {
        destination: primaryPath(p.id),
        contentType: "image/jpeg",
        resumable: false,
        metadata: { cacheControl: "private, max-age=0" },
      });
      uploaded.push(p.id);
      console.log(`photo    ${p.id} uploaded`);
    } catch (err) {
      const code = (err as { code?: number }).code;
      if (code === 403 || code === 401) {
        console.warn(
          `\nPhotos not uploaded: this login can't write to gs://${bucketName} (${code}).\n` +
            `Ask a project owner to run:\n\n` +
            `  gcloud storage buckets add-iam-policy-binding gs://${bucketName} \\\n` +
            `    --member=user:<your-email> --role=roles/storage.objectAdmin --project=${projectId}\n\n` +
            `then re-run: npm run seed:catalog -- --images-only\n` +
            `Until then the site shows each product's existing photo, or the brand placeholder.`,
        );
        break;
      }
      throw err;
    }
  }

  // New bytes at the same object path: bump updatedAt so the versioned /media URLs change.
  if (uploaded.length) {
    const batch = db.batch();
    uploaded.forEach((id) => batch.update(db.collection("catalog").doc(id), { updatedAt: FieldValue.serverTimestamp() }));
    await batch.commit();
    console.log(`\nUploaded ${uploaded.length} photos and refreshed their cache versions.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
