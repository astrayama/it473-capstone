# Deployment guide (Google Cloud)

Everything below uses `gcloud`. Install the Google Cloud CLI first
(https://cloud.google.com/sdk/docs/install) and run `gcloud auth login`.

## The shared project: `it473-capstone-project`

The team's project already has the Firestore database (`catalog` and `categories`), the
private media bucket `gs://it473-capstone-project-media`, the Cloud SQL instance `foodhub-pg`,
Secret Manager secrets, and the Cloud Run service `capstone-app-v1`, which a Cloud Build
trigger redeploys from `main`. **Merging to `main` deploys.**

> **Don't** run `scripts/setup-gcp.sh` or `firebase deploy` against this project. The script
> resets the database password and changes your global gcloud project, and the repo's deny-all
> `firestore.rules` would replace whatever rules the team has set. Pass `--project` explicitly.

### Owner checklist (needs Owner or equivalent on the project)

The app runs as `foodhub-run@it473-capstone-project.iam.gserviceaccount.com`, which already
has `roles/datastore.user` (Firestore) and `roles/cloudsql.client`. Still to do:

1. **Photos.** Let the app read the media bucket and save admin photo uploads. Replacing a
   photo overwrites `primary.jpg`, and an overwrite needs delete permission, so the role is
   `objectUser` (read, create, overwrite) rather than `objectCreator`:
   ```bash
   gcloud storage buckets add-iam-policy-binding gs://it473-capstone-project-media \
     --member=serviceAccount:foodhub-run@it473-capstone-project.iam.gserviceaccount.com \
     --role=roles/storage.objectUser --project=it473-capstone-project
   ```
   Until then, product photos fall back to the brand placeholder; nothing breaks. The bucket
   stays private (Public Access Prevention enforced) and no signed URLs are used: browsers get
   photos from `/media` through `foodhub-lb` and Cloud CDN, and admin uploads go through the
   app's own route as `foodhub-run`.
2. **Sign-in.** No Firebase web app is registered yet, so the login and apply pages show
   "not available". In the Firebase console: *Authentication → Get started → Email/Password*,
   then *Project settings → Your apps → Add app → Web*, and store the keys:
   ```bash
   printf '%s' 'AIza...' | gcloud secrets versions add FIREBASE_API_KEY --data-file=- --project=it473-capstone-project
   printf '%s' '1:...:web:...' | gcloud secrets versions add FIREBASE_APP_ID --data-file=- --project=it473-capstone-project
   ```
   Then expose them (and `ADMIN_EMAILS`, `SITE_URL`) to `capstone-app-v1`, and add its host
   under *Authentication → Settings → Authorized domains*.
3. **Stock, accounts and orders.** Start Cloud SQL when needed (it bills while running; the
   current tier is `db-custom-2-8192`), apply migrations and seed stock rows for the catalog:
   ```bash
   gcloud sql instances patch foodhub-pg --activation-policy=ALWAYS --project=it473-capstone-project
   npm run db:proxy          # in another terminal
   npm run db:deploy && npm run seed
   ```
   `npm run seed` never writes the Firestore catalog. It creates missing stock rows (40 on hand
   by default, `SEED_DEFAULT_STOCK`) and never overwrites existing counts.
4. **Optional:** set `GCS_BUCKET=it473-capstone-project-media` and `GOOGLE_CLOUD_PROJECT` on the
   service. The code defaults to these values already.

### Local development against the shared project

```bash
gcloud auth application-default login --disable-quota-project
cp .env.example .env
npm install && npm run dev
```

`--disable-quota-project` matters when your account can read the project but can't use it as
a billing/quota project (e.g. Viewer). With Viewer you can browse the storefront (Firestore)
and see photos; admin and ordering need Cloud SQL and sign-in (above).

---

The rest of this guide sets up a **new** project from scratch.

## 1. Create a project and enable billing

```bash
gcloud projects create YOUR_PROJECT_ID --name="Prairie Crest Foods"
gcloud billing projects link YOUR_PROJECT_ID --billing-account=XXXXXX-XXXXXX-XXXXXX
gcloud config set project YOUR_PROJECT_ID
```

## 2. Provision the Google Cloud resources

```bash
./scripts/setup-gcp.sh YOUR_PROJECT_ID us-central1
```

This is idempotent. It enables APIs and creates: an Artifact Registry repo (`foodhub`),
the Firestore database, the private photo bucket `gs://YOUR_PROJECT_ID-media`, a Cloud SQL PostgreSQL 16 instance `foodhub-pg` (db-f1-micro, about $10/month) with
database `foodhub` and user `app`, the runtime service account `foodhub-run@...`, IAM bindings
for Cloud Build, and Secret Manager secrets (`DATABASE_URL` is filled in; the others are
placeholders you replace in step 3).

The script prints the generated database password and the Cloud SQL connection name — keep
them for your `.env`.

## 3. Firebase and Stripe (manual, once)

**Firebase Authentication**
1. https://console.firebase.google.com → *Add project* → choose the existing `YOUR_PROJECT_ID`.
2. *Build → Authentication → Get started → Email/Password → Enable*.
3. *Project settings → General → Your apps → Add app → Web*. Copy `apiKey` and `appId`:
   ```bash
   printf '%s' 'AIza...' | gcloud secrets versions add FIREBASE_API_KEY --data-file=-
   printf '%s' '1:123:web:abc' | gcloud secrets versions add FIREBASE_APP_ID --data-file=-
   ```

**Stripe (test mode)**
1. https://dashboard.stripe.com/test/apikeys → copy the secret key:
   ```bash
   printf '%s' 'sk_test_...' | gcloud secrets versions add STRIPE_SECRET_KEY --data-file=-
   ```
2. The webhook is configured after the first deploy (step 5).

## 4. First deploy

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_ADMIN_EMAILS=you@example.com,another@example.com
```

Cloud Build builds the image, pushes it, runs `prisma migrate deploy` through the
`foodhub-migrate` Cloud Run Job, and deploys `foodhub-web`. The build prints the service URL,
or run `gcloud run services describe foodhub-web --region us-central1 --format='value(status.url)'`.

Then tell the app and Firebase about the URL:

```bash
printf '%s' 'https://foodhub-web-xxxx-uc.a.run.app' | gcloud secrets versions add SITE_URL --data-file=-
gcloud run services update foodhub-web --region us-central1 --update-secrets=SITE_URL=SITE_URL:latest
```

Firebase console → *Authentication → Settings → Authorized domains* → add the Cloud Run host.

## 5. Stripe webhook

Stripe dashboard → *Developers → Webhooks → Add endpoint*:
`https://<cloud-run-url>/api/webhooks/stripe`, event `checkout.session.completed`
(optionally `checkout.session.expired`). Copy the signing secret:

```bash
printf '%s' 'whsec_...' | gcloud secrets versions add STRIPE_WEBHOOK_SECRET --data-file=-
gcloud run services update foodhub-web --region us-central1 --update-secrets=STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest
```

Test cards: `4242 4242 4242 4242`, any future expiry, any CVC.

## 6. Seed demo data

From your laptop, with `.env` filled in (see below) and the proxy running:

```bash
npm run db:proxy      # terminal 1
npm run seed          # terminal 2
```

Sign in at `https://<cloud-run-url>/login` with the first `ADMIN_EMAILS` address and
`Admin1234!`, then open **Admin**.

## 7. Continuous deployment from GitHub

1. Cloud console → *Cloud Build → Repositories → Connect repository* → GitHub →
   `astrayama/it473-capstone` (installs the Cloud Build GitHub app).
2. Create the trigger:
   ```bash
   gcloud builds triggers create github \
     --name=deploy-main --repo-owner=astrayama --repo-name=it473-capstone \
     --branch-pattern='^main$' --build-config=cloudbuild.yaml \
     --substitutions=_ADMIN_EMAILS=you@example.com
   ```
Every push to `main` now builds, migrates, and deploys.

## Local development against the dev project

```bash
cp .env.example .env
```
Fill in:
* `GOOGLE_CLOUD_PROJECT`, `FIREBASE_PROJECT_ID` — your project id
* `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_APP_ID` — from the Firebase web app
* `CLOUD_SQL_CONNECTION_NAME` — printed by the setup script (`PROJECT:REGION:foodhub-pg`)
* `DATABASE_URL=postgresql://app:<password>@127.0.0.1:5432/foodhub`
* `GCS_BUCKET` — `YOUR_PROJECT_ID-media`
* `ADMIN_EMAILS` — your email(s)
* Stripe keys optional (leave blank to skip payment locally)

Then:

```bash
brew install cloud-sql-proxy                 # or download from https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases
gcloud auth application-default login        # lets the Admin SDK / Storage client authenticate as you (add --disable-quota-project if you only have Viewer)
npm run db:proxy                             # terminal 1
npm run db:deploy && npm run seed            # terminal 2, first time only
npm run dev                                  # http://localhost:3000
```

Add `localhost` to Firebase *Authorized domains* (it is there by default).

To test payments locally, put a Stripe **test** key (`sk_test_…`) in `.env` as
`STRIPE_SECRET_KEY`. The cart then shows the test card (`4242 4242 4242 4242`), and the
confirmation page confirms the payment with Stripe directly, so webhooks are optional locally.
To exercise the webhook too: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
and put the printed `whsec_` in `.env` as `STRIPE_WEBHOOK_SECRET`.

## Changing the database schema

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate -- --name describe_change` (creates SQL under `prisma/migrations/`).
3. Commit the migration. The next Cloud Build run applies it before deploying.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Build step `migrate` fails with connection refused | Cloud SQL instance name / region in `cloudbuild.yaml` substitutions; `DATABASE_URL` secret uses `?host=/cloudsql/PROJECT:REGION:INSTANCE`. |
| Pages show "Something went wrong" | Cloud Run logs: `gcloud run services logs read foodhub-web --region us-central1`. Usually a missing secret or IAM role. |
| Sign-in form says "not configured" | `FIREBASE_API_KEY` / `FIREBASE_APP_ID` secrets still `REPLACE_ME`. |
| `auth/unauthorized-domain` on sign-in | Add the Cloud Run host to Firebase Authorized domains. |
| Photo upload fails | Runtime SA has `roles/storage.objectUser` on the media bucket; locally, your ADC user needs the same. |
| Order stays PENDING_PAYMENT after paying | Webhook endpoint/secret not set; check Stripe dashboard → Webhooks → recent deliveries. |

## Cost control

Cloud Run scales to zero. Cloud SQL is the only always-on cost; stop it when not demoing:
`gcloud sql instances patch foodhub-pg --activation-policy=NEVER` (and `ALWAYS` to resume).
