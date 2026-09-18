# Deployment guide (Google Cloud)

Everything below uses `gcloud`. Install the Google Cloud CLI first
(https://cloud.google.com/sdk/docs/install) and run `gcloud auth login`.

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
the Firestore database, the photo bucket `gs://YOUR_PROJECT_ID-product-images` (public
read), a Cloud SQL PostgreSQL 16 instance `foodhub-pg` (db-f1-micro, about $10/month) with
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
* `GCS_BUCKET` — `YOUR_PROJECT_ID-product-images`
* `ADMIN_EMAILS` — your email(s)
* Stripe keys optional (leave blank to skip payment locally)

Then:

```bash
brew install cloud-sql-proxy                 # or download from https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases
gcloud auth application-default login        # lets the Admin SDK / Storage client authenticate as you
npm run db:proxy                             # terminal 1
npm run db:deploy && npm run seed            # terminal 2, first time only
npm run dev                                  # http://localhost:3000
```

Add `localhost` to Firebase *Authorized domains* (it is there by default).

To test Stripe webhooks locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
and put the printed `whsec_` in `.env`.

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
| Photo upload fails | Bucket exists and runtime SA has `storage.objectAdmin`; locally, ADC user needs the same. |
| Order stays PENDING_PAYMENT after paying | Webhook endpoint/secret not set; check Stripe dashboard → Webhooks → recent deliveries. |

## Cost control

Cloud Run scales to zero. Cloud SQL is the only always-on cost; stop it when not demoing:
`gcloud sql instances patch foodhub-pg --activation-policy=NEVER` (and `ALWAYS` to resume).
