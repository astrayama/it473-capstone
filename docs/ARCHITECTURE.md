# Architecture

```
 Browser ──HTTPS──▶ Cloud Run (Next.js, container from Artifact Registry)
                       │
                       ├─ Firebase Auth   (sign-in; session cookie minted by the server)
                       ├─ Firestore       catalog/{sku-id}, categories/{id}   ← product catalog
                       ├─ Cloud SQL (PG)  Customer, InventoryItem, Order, OrderItem
                       ├─ Cloud Storage   gs://<project>-media/products/{id}/images/*  (private; served via /media)
                       ├─ Secret Manager  DATABASE_URL, Stripe keys, Firebase web keys
                       └─ Stripe          Checkout (test mode) + webhook → /api/webhooks/stripe

 GitHub (main) ──▶ Cloud Build ──▶ build image ──▶ Cloud Run Job "foodhub-migrate" (prisma migrate deploy)
                                               └─▶ Cloud Run service "foodhub-web"
```

## Why two databases?

The brief asked for the catalog in Firestore and the transactional data in Cloud SQL.

* **Firestore — product catalog.** Product records are document-shaped (name, description,
  unit, price, photo paths, category) and are read far more often than written. Firestore
  is serverless, needs no instance management, and the team also edits it directly in the
  Firebase console. The storefront renders from Firestore alone if Cloud SQL is unreachable
  (stock badges are hidden), so the catalog stays up.
* **Cloud SQL (PostgreSQL) — customers, stock, orders.** These are relational and need
  transactions: an order has line items, belongs to a customer, and paying it must
  atomically decrement stock. Prisma gives typed queries and versioned SQL migrations.

The join key is `InventoryItem.productId` = the Firestore document id. `OrderItem` stores a
snapshot (name, SKU, price at time of order) so history survives catalog edits.

## Data model

### Firestore `catalog/{id}` (the team's schema; `src/lib/catalog.ts` maps it)
The document id doubles as the SKU: `sku-1001` is shown as **SKU-1001**.

| Field | Type | Notes |
| --- | --- | --- |
| name, description | string | |
| category | string | a `categories/{id}` document id |
| basePrice | number | US dollars per unit of measure (e.g. `34.99`, `45`); the app works in cents |
| unitOfMeasure | string | `case`, `pack`, `bag`, … ("$34.99 per case") |
| imagePaths | string[] | media-bucket object paths; the first is the primary photo |
| isActive | boolean | `false` = archived (hidden from the storefront; never deleted by the app) |
| createdAt, updatedAt | Timestamp | `updatedAt` also versions the photo URL for caching |
| origin, packSize, storage, shelfLife, notes, season | string, optional | buyer details shown on cards and the product page (`notes` = chef's notes) |
| certifications | string[], optional | e.g. `["USDA Organic"]`, shown as badges |

Writes use `create()` (fails if the SKU exists) and `update()` with only these fields, so any
extra fields a teammate adds survive.

`seed/catalog.json` holds the demo catalog (24 products across 7 categories) and
`npm run seed:catalog` writes it; see the script header for flags. `seed/backup/` keeps the
catalog as it was before the first seed, including the bucket versions of the original photos.

### Firestore `categories/{id}`
| Field | Type | Notes |
| --- | --- | --- |
| name, description | string | shown on the home page tiles and catalog filters |
| sortOrder | string | numeric text (`"1"`, `"2"`, …); sorted numerically |

Category cover photos are chosen in `src/config/photos.ts` for the seven seeded categories
(produce, dairy, bakery, butchery-seafood, pantry, charcuterie-cheese, beverages); any other
category gets the default pantry cover.

### Cloud SQL (see `prisma/schema.prisma`)
* `Customer` — one per wholesale account; `firebaseUid` links to the Firebase Auth user;
  `status` PENDING → APPROVED (staff action) or SUSPENDED. Indexed for search by business name.
* `InventoryItem` — `quantityOnHand` (units), `reorderPoint` (low-stock alert), `binLocation`.
  Catalog items without a row show as "Not tracked" in the admin until a count is saved.
* `Order` — `orderNumber` (human readable, auto-increment), `status`
  PENDING_PAYMENT → PAID → CONFIRMED → OUT_FOR_DELIVERY → DELIVERED (or CANCELLED),
  Stripe ids, requested delivery date, notes.
* `OrderItem` — snapshot of each line. The columns predate the Firestore schema:
  `packSize` holds the unit of measure and `casePriceCents` the price per unit.

## Request flows

**Sign in.** The browser uses the Firebase JS SDK to sign in with email/password and gets an
ID token. It POSTs the token to `/api/auth/session`; the server verifies it with the Admin SDK,
mints a 5-day **session cookie** (httpOnly, secure), and stores nothing else. Every server
render calls `getSession()` (`src/lib/auth.ts`) which verifies the cookie and loads the
`Customer` row. Staff = email listed in `ADMIN_EMAILS`.

**Register.** Browser creates the Firebase user, then POSTs profile fields to
`/api/auth/register`, which creates the `Customer` row with status PENDING and starts a session.
Staff approve the account under *Admin → Customers*.

**Browse.** Pages are server-rendered on every request (`dynamic = "force-dynamic"`).
`/catalog` reads products and categories from Firestore and stock from Cloud SQL (with a
short timeout; stock is hidden if it's unavailable), and only shows prices when
`canSeePrices(session)` is true. In development only, `SHOW_PRICES_TO_GUESTS=1` shows prices
to guests.

**Order.** The cart lives in `localStorage`. `/api/checkout` re-loads every product from
Firestore (never trusting client prices), checks stock, writes the `Order` + `OrderItem`s in
one transaction, and creates a Stripe Checkout session with `metadata.orderId` (line items
carry the product photo when the site is public, plus pack size and SKU). Stripe redirects back
to `/checkout/success`, which asks Stripe directly whether the session is paid
(`syncStripePayment()`) so the buyer sees "Paid" without waiting; the order pages do the same.
Stripe also calls `/api/webhooks/stripe` (`checkout.session.completed`) → `markOrderPaid()`
sets PAID and decrements stock in a transaction. Both paths are idempotent, so whichever
arrives first wins. `checkout.session.expired` cancels an unpaid order. The browser cart is
emptied on the confirmation page, so backing out of Stripe Checkout keeps the cart. If `STRIPE_SECRET_KEY` is unset (e.g. a dev environment), checkout skips Stripe
and leaves the order in PENDING_PAYMENT; staff can mark it PAID from the admin, which runs the
same stock deduction.

**Admin edits.** Admin pages are server components guarded by `requireAdmin()`; the forms are
small client components that call `/api/admin/*` JSON routes, each of which re-checks the
session (`requireAdminApi`) and validates input with zod (`src/lib/validation.ts`).
Product photos are uploaded through `/api/admin/products/[id]/image` to
`products/{id}/images/primary.{ext}` in the media bucket, and that path becomes the first
entry of the document's `imagePaths`. "Delete" archives (`isActive: false`).

**Photos.** The media bucket has public access prevention on. Reads take the edge path:
browser → `foodhub-lb` (Cloud CDN on) → Cloud Run `/media` → bucket, so the CDN caches each
versioned photo and the bucket never needs a public or signed URL. `/media/[...path]` streams
objects through the app with ETag/304 support; URLs carry `?v=<updatedAt>` so they can be
cached for a year. If the object is missing or the server can't read the bucket, it
redirects to `/brand/product-fallback.svg` without caching.

## Google Cloud services and IAM

| Service | Used for | Runtime SA role |
| --- | --- | --- |
| Cloud Run | the web app (`foodhub-web`) and the migration job (`foodhub-migrate`) | — |
| Cloud Build | builds both Docker targets, runs migrations, deploys | run.admin, artifactregistry.writer, iam.serviceAccountUser on runtime SA |
| Artifact Registry | image storage (`foodhub/web`, `foodhub/migrator`) | — |
| Cloud SQL | PostgreSQL 16, connected over the Cloud SQL unix socket | cloudsql.client |
| Firestore | product catalog | datastore.user |
| Cloud Storage | product photos, private bucket served through `/media` | storage.objectUser on the media bucket (read, upload, overwrite) |
| Firebase Auth / Identity Platform | customer + staff logins, session cookies | firebaseauth.admin |
| Secret Manager | DATABASE_URL, Stripe + Firebase keys, SITE_URL | secretmanager.secretAccessor |

Everything runs as the `foodhub-run` service account created by `scripts/setup-gcp.sh`.
Locally the same code uses Application Default Credentials from `gcloud auth
application-default login` and reaches Cloud SQL through the Auth Proxy.

## Security notes

* Firestore rules deny all client access; only the server (Admin SDK) reads or writes.
* `/media` only serves `products/<id>/images/<file>.(jpg|png|webp|avif)`; other paths 404.
* Prices and stock are always resolved server-side at checkout.
* Session cookies are httpOnly + secure + SameSite=Lax; the ID token is only accepted within
  5 minutes of sign-in.
* Admin authorization is an email allowlist (`ADMIN_EMAILS`). Move to Firebase custom claims
  if the staff list grows.
* Stripe webhooks are verified with the signing secret.

## Scaling notes (10k customers)

* Customer and order lists are paginated and searchable in SQL (indexes on `businessName`,
  `status`, `customerId+createdAt`).
* The catalog is read fully and filtered in memory; that is fine for hundreds or a few
  thousand SKUs. Beyond that, add a search index (Algolia/Typesense) or Firestore composite
  indexes per category.
* Cloud Run scales from 0 to `max-instances` (4 in `cloudbuild.yaml`); raise it and the
  Cloud SQL tier together.
