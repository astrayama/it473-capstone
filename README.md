# Prairie Crest Foods — wholesale ordering site (IT473 capstone)

A B2B e-commerce site for a mid-sized food distributor with roughly 10,000 wholesale
customers. Built for Google Cloud project `it473-capstone-project`: **Cloud Run** (app),
**Cloud Build** (CI/CD), **Firestore** (product catalog and categories), **Cloud SQL for
PostgreSQL** (customers, stock, orders), **Cloud Storage** (product photos, private),
**Firebase Authentication** (logins), **Secret Manager** (keys), plus **Stripe** test mode
for payments.

The look is **Harvest Noir**: a dark, cinematic storefront and a light "daylight" staff admin,
built from one set of tokens in `src/app/globals.css` (see [Design system](#design-system)).

> "Prairie Crest Foods" is a made-up company. Change the name in `src/config/site.ts`.

## What's here

| Area | What it does |
| --- | --- |
| Storefront (`/`, `/catalog`, `/catalog/[id]`) | Browse by category (from Firestore), search, see live stock. Wholesale prices only appear for approved, signed-in customers. Product URLs use the Firestore document id, e.g. `/catalog/sku-1001`. |
| Accounts (`/register`, `/login`, `/account`) | Businesses apply for an account (Firebase Auth + Cloud SQL profile). Staff approve them. Order history per account. |
| Cart & checkout (`/cart`, `/checkout/success`) | Cart in the browser, re-priced on the server at checkout; order saved to Cloud SQL, then Stripe Checkout (test mode). A webhook marks the order paid and deducts stock. |
| Staff admin (`/admin/...`) | Plain web forms for non-technical staff: add/edit/archive products with photo upload, edit stock inline, approve customers, move orders through statuses. Access is limited to emails in `ADMIN_EMAILS`. |
| Product photos (`/media/...`) | Streams photos out of the private media bucket (only `products/<id>/images/*`). |
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
prisma/seed.ts           Demo data loader (stock rows for the Firestore catalog, demo accounts)
seed/customers.json      Demo wholesale accounts
firestore.rules          Deny-all (all Firestore access goes through the server)
public/brand/            Crest, wordmark and lockup SVGs, product fallback, photography (+ CREDITS.md)
src/config/              Company copy, GCP settings, photo registry, units of measure
src/lib/                 Server-side data access: catalog + categories (Firestore), db (Prisma), auth, orders, storage, stripe
src/components/          React components (brand, header, hero, cards, cart, forms, admin shell)
src/app/(store)/         Storefront pages (noir theme)
src/app/admin/           Staff pages (daylight theme)
src/app/media/           Private-bucket photo route
src/app/globals.css      Design tokens and component styles (the design system's source of truth)
docs/                    ARCHITECTURE, DEPLOYMENT, ADMIN_GUIDE
```

## Quick start (local development)

Local development talks to **real** Google Cloud resources in `it473-capstone-project`;
there is no local database or emulator. Browsing the storefront only needs Firestore read
access (Viewer is enough); stock, accounts, orders and the admin also need Cloud SQL and
sign-in, which a project owner sets up (see the owner checklist in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).

```bash
# 1. Install
npm install                     # also runs `prisma generate`

# 2. Configure
cp .env.example .env            # project defaults are filled in; add Firebase web keys + DB password if you have them
gcloud auth application-default login --disable-quota-project

# 3. Open a tunnel to Cloud SQL (leave running in its own terminal)
npm run db:proxy

# 4. Create tables + demo data
npm run db:deploy               # applies prisma/migrations
npm run seed                    # stock rows for the Firestore catalog, demo customers -> Cloud SQL, demo logins -> Firebase Auth

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
change stock counts. The catalog itself lives in the team's Firestore `catalog` and
`categories` collections, so products and categories added there (by the admin or in the
Firebase console) show up on the site straight away.

## Design system

**Harvest Noir**: candlelit gold on near-black for buyers, linen and ink for staff. The full
system (tokens for both themes, type scale, motion, component guidelines and previews, logos
and photography) is published as a design system artifact:
[Prairie Crest Harvest Noir](https://claude.ai/artifact/TtCi3oRN8VKbo6y9zbEoJf) (private until
shared from its Share menu).

* Tokens live in `src/app/globals.css`: raw values per theme on `[data-theme="noir"]` and
  `[data-theme="daylight"]`, exposed to Tailwind through `@theme inline`, so a utility like
  `bg-surface` follows whichever theme wraps it. Component classes (`.btn-primary`, `.card`,
  `.badge-*`, `.table`, `.ledger`, `.eyebrow`, `.display-*`, …) are defined there too.
* Type: Cormorant Garamond (display, italics for emphasis) and Inter Tight (UI and data,
  tabular numerals), loaded with `next/font`.
* Motion is measured and CSS-first (page transitions via React `<ViewTransition>`, scroll-driven
  reveals and parallax, hover depth). It all switches off under `prefers-reduced-motion`.
* Brand marks in `public/brand/` and `src/components/brand/` are outlined from the brand fonts
  (regenerate with `scripts/brand/`); photography is credited in `public/brand/photos/CREDITS.md`.
