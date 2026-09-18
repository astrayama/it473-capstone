# Prairie Crest Foods — wholesale ordering site (IT473 capstone)

Scaffolding for a B2B e-commerce site for a mid-sized food distributor (dairy, frozen,
beverages, produce, dry goods, meat & seafood) with roughly 10,000 wholesale customers.
Built for Google Cloud: **Cloud Run** (app), **Cloud Build** (CI/CD), **Firestore** (product
catalog), **Cloud SQL for PostgreSQL** (customers, stock, orders), **Cloud Storage** (product
photos), **Firebase Authentication** (logins), **Secret Manager** (keys), plus **Stripe** test
mode for payments.

> "Prairie Crest Foods" is a made-up company. Change the name in `src/config/site.ts`.

## What's here

| Area | What it does |
| --- | --- |
| Storefront (`/`, `/catalog`, `/catalog/[slug]`) | Browse by category, search, see live stock. Wholesale prices only appear for approved, signed-in customers. |
| Accounts (`/register`, `/login`, `/account`) | Businesses apply for an account (Firebase Auth + Cloud SQL profile). Staff approve them. Order history per account. |
| Cart & checkout (`/cart`, `/checkout/success`) | Cart in the browser, re-priced on the server at checkout; order saved to Cloud SQL, then Stripe Checkout (test mode). A webhook marks the order paid and deducts stock. |
| Staff admin (`/admin/...`) | Plain web forms for non-technical staff: add/edit products with photo upload, edit stock inline, approve customers, move orders through statuses. Access is limited to emails in `ADMIN_EMAILS`. |
| API (`/api/...`) | JSON route handlers used by the pages above, plus `/api/health` and the Stripe webhook. |

Stack: Next.js 16 (App Router, TypeScript, Tailwind CSS 4), Prisma 7, Firebase Admin SDK,
`@google-cloud/storage`, Stripe SDK. Node 22.

## Repository layout

```
cloudbuild.yaml          Cloud Build pipeline: build image -> migrate DB (Cloud Run Job) -> deploy Cloud Run
Dockerfile               Multi-stage image (web server + a `migrator` target for Prisma migrations)
scripts/setup-gcp.sh     One-time creation of every GCP resource (idempotent)
scripts/dev-proxy.sh     Cloud SQL Auth Proxy for local development
prisma/schema.prisma     Cloud SQL tables (Customer, InventoryItem, Order, OrderItem)
prisma/migrations/       SQL migrations applied by `prisma migrate deploy`
prisma/seed.ts           Demo data loader
seed/products.json       Demo catalog (easy to edit) -> Firestore + stock rows
seed/customers.json      Demo wholesale accounts
firestore.rules          Deny-all (all Firestore access goes through the server)
src/config/              Company name, categories
src/lib/                 Server-side data access: catalog (Firestore), db (Prisma), auth, orders, storage, stripe
src/components/          React components (cart, forms, admin widgets)
src/app/                 Pages and API routes
docs/                    ARCHITECTURE, DEPLOYMENT, ADMIN_GUIDE
```

## Quick start (local development)

Local development talks to **real** Google Cloud resources in a dev project — there is no
local database or emulator. Do the one-time setup in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
first (about 20 minutes, mostly waiting for Cloud SQL).

```bash
# 1. Install
npm install                     # also runs `prisma generate`

# 2. Configure
cp .env.example .env            # fill in project id, Firebase web config, DB password
gcloud auth application-default login

# 3. Open a tunnel to Cloud SQL (leave running in its own terminal)
npm run db:proxy

# 4. Create tables + demo data
npm run db:deploy               # applies prisma/migrations
npm run seed                    # products -> Firestore, stock/customers -> Cloud SQL, demo logins -> Firebase Auth

# 5. Run
npm run dev                     # http://localhost:3000
```

Demo logins created by the seed (change these before going live):

| Role | Email | Password |
| --- | --- | --- |
| Staff / admin | first address in `ADMIN_EMAILS` | `Admin1234!` (or `SEED_ADMIN_PASSWORD`) |
| Approved customer | `maple@example.com` | `Demo1234!` |
| Approved customer | `riverbend@example.com` | `Demo1234!` |
| Pending customer | `lincoln@example.com` | `Demo1234!` |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server / production build / production server |
| `npm run lint`, `npm run typecheck` | ESLint, TypeScript |
| `npm run db:proxy` | Cloud SQL Auth Proxy on 127.0.0.1:5432 |
| `npm run db:migrate` | Create a new migration after editing `prisma/schema.prisma` (dev) |
| `npm run db:deploy` | Apply committed migrations (what the Cloud Run Job runs) |
| `npm run db:studio` | Prisma Studio, a GUI for the Cloud SQL tables |
| `npm run seed` | Load demo data |

## Deploying

```bash
./scripts/setup-gcp.sh YOUR_PROJECT_ID          # once
gcloud builds submit --config cloudbuild.yaml --substitutions=_ADMIN_EMAILS=you@example.com
```

Full walkthrough, Cloud Build trigger from GitHub, Stripe webhook, and troubleshooting:
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). How the pieces fit together:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). For office staff who manage the catalog:
[docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md).

## Editing the inventory

Non-technical staff use the **Admin** area in the browser (no code, no spreadsheets):
sign in with a staff email, then *Admin → Products → Add product* or *Admin → Inventory* to
change stock counts. Developers can also edit `seed/products.json` and re-run `npm run seed`
to bulk-load a starting catalog.
