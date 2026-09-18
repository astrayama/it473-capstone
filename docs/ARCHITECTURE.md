# Architecture

```
 Browser ──HTTPS──▶ Cloud Run (Next.js, container from Artifact Registry)
                       │
                       ├─ Firebase Auth   (sign-in; session cookie minted by the server)
                       ├─ Firestore       products/{id}          ← product catalog
                       ├─ Cloud SQL (PG)  Customer, InventoryItem, Order, OrderItem
                       ├─ Cloud Storage   gs://<project>-product-images/products/*  (public read)
                       ├─ Secret Manager  DATABASE_URL, Stripe keys, Firebase web keys
                       └─ Stripe          Checkout (test mode) + webhook → /api/webhooks/stripe

 GitHub (main) ──▶ Cloud Build ──▶ build image ──▶ Cloud Run Job "foodhub-migrate" (prisma migrate deploy)
                                               └─▶ Cloud Run service "foodhub-web"
```

## Why two databases?

The brief asked for the catalog in Firestore and the transactional data in Cloud SQL.

* **Firestore — product catalog.** Product records are document-shaped (name, description,
  pack size, price, photo URL, category) and are read far more often than written. Firestore
  is serverless, needs no instance management, and staff edits through the admin form map
  straight onto a document `set`/`merge`.
* **Cloud SQL (PostgreSQL) — customers, stock, orders.** These are relational and need
  transactions: an order has line items, belongs to a customer, and paying it must
  atomically decrement stock. Prisma gives typed queries and versioned SQL migrations.

The join key is `InventoryItem.productId` = the Firestore document id. `OrderItem` stores a
snapshot (name, SKU, price at time of order) so history survives catalog edits.

## Data model

### Firestore `products/{id}`
| Field | Type | Notes |
| --- | --- | --- |
| sku | string | Shown to customers; unique via the SQL `InventoryItem.sku` constraint |
| name, slug, description, brand | string | `slug` is the URL, generated once from the name |
| category | `dairy \| frozen \| beverages \| produce \| dry-goods \| meat-seafood` | see `src/config/categories.ts` |
| packSize | string | e.g. `12 × 32 oz` |
| unitsPerCase | number | |
| casePriceCents | number | integers only, never floats |
| storage | `refrigerated \| frozen \| ambient` | |
| imageUrl | string \| null | public Cloud Storage URL |
| active | boolean | hidden from the storefront when false |
| createdAt, updatedAt | ISO string | |

### Cloud SQL (see `prisma/schema.prisma`)
* `Customer` — one per wholesale account; `firebaseUid` links to the Firebase Auth user;
  `status` PENDING → APPROVED (staff action) or SUSPENDED. Indexed for search by business name.
* `InventoryItem` — `quantityOnHand` (cases), `reorderPoint` (low-stock alert), `binLocation`.
* `Order` — `orderNumber` (human readable, auto-increment), `status`
  PENDING_PAYMENT → PAID → CONFIRMED → OUT_FOR_DELIVERY → DELIVERED (or CANCELLED),
  Stripe ids, requested delivery date, notes.
* `OrderItem` — snapshot of each line.

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
`/catalog` reads products from Firestore and stock from Cloud SQL, and only shows prices
when `canSeePrices(session)` is true.

**Order.** The cart lives in `localStorage`. `/api/checkout` re-loads every product from
Firestore (never trusting client prices), checks stock, writes the `Order` + `OrderItem`s in
one transaction, and creates a Stripe Checkout session with `metadata.orderId`. Stripe
redirects back to `/checkout/success`. Stripe calls `/api/webhooks/stripe`
(`checkout.session.completed`) → `markOrderPaid()` sets PAID and decrements stock in a
transaction. If `STRIPE_SECRET_KEY` is unset (e.g. a dev environment), checkout skips Stripe
and leaves the order in PENDING_PAYMENT; staff can mark it PAID from the admin, which runs the
same stock deduction.

**Admin edits.** Admin pages are server components guarded by `requireAdmin()`; the forms are
small client components that call `/api/admin/*` JSON routes, each of which re-checks the
session (`requireAdminApi`) and validates input with zod (`src/lib/validation.ts`).
Product photos are uploaded through `/api/admin/upload` to Cloud Storage and the public URL
is saved on the Firestore document.

## Google Cloud services and IAM

| Service | Used for | Runtime SA role |
| --- | --- | --- |
| Cloud Run | the web app (`foodhub-web`) and the migration job (`foodhub-migrate`) | — |
| Cloud Build | builds both Docker targets, runs migrations, deploys | run.admin, artifactregistry.writer, iam.serviceAccountUser on runtime SA |
| Artifact Registry | image storage (`foodhub/web`, `foodhub/migrator`) | — |
| Cloud SQL | PostgreSQL 16, connected over the Cloud SQL unix socket | cloudsql.client |
| Firestore | product catalog | datastore.user |
| Cloud Storage | product photos, public-read bucket | storage.objectAdmin |
| Firebase Auth / Identity Platform | customer + staff logins, session cookies | firebaseauth.admin |
| Secret Manager | DATABASE_URL, Stripe + Firebase keys, SITE_URL | secretmanager.secretAccessor |

Everything runs as the `foodhub-run` service account created by `scripts/setup-gcp.sh`.
Locally the same code uses Application Default Credentials from `gcloud auth
application-default login` and reaches Cloud SQL through the Auth Proxy.

## Security notes

* Firestore rules deny all client access; only the server (Admin SDK) reads or writes.
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
