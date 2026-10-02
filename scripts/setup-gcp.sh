#!/usr/bin/env bash
# One-time Google Cloud setup for the storefront.
#
#   ./scripts/setup-gcp.sh <PROJECT_ID> [REGION]
#
# Creates (idempotently): required APIs, Artifact Registry repo, Firestore database,
# a private Cloud Storage bucket for product photos, Cloud SQL Postgres instance + database + user,
# Secret Manager secrets, the Cloud Run runtime service account, and IAM bindings
# for Cloud Build. Prints the manual Firebase steps at the end.
#
# Costs: the Cloud SQL instance (db-f1-micro) bills while it exists (~$10/month).
set -euo pipefail

PROJECT_ID="${1:?usage: $0 <PROJECT_ID> [REGION]}"
REGION="${2:-us-central1}"
AR_REPO="foodhub"
SQL_INSTANCE="foodhub-pg"
SQL_DB="foodhub"
SQL_USER="app"
BUCKET="${PROJECT_ID}-media"
RUNTIME_SA_NAME="foodhub-run"
RUNTIME_SA="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

log() { printf "\n\033[1;32m==> %s\033[0m\n" "$*"; }

gcloud config set project "$PROJECT_ID" >/dev/null
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

log "Enabling APIs"
gcloud services enable \
  run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  sqladmin.googleapis.com firestore.googleapis.com storage.googleapis.com \
  secretmanager.googleapis.com identitytoolkit.googleapis.com firebase.googleapis.com \
  iam.googleapis.com

log "Artifact Registry repo: $AR_REPO"
gcloud artifacts repositories describe "$AR_REPO" --location="$REGION" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "$AR_REPO" --repository-format=docker --location="$REGION"

log "Firestore database (Native mode)"
gcloud firestore databases describe --database='(default)' >/dev/null 2>&1 || \
  gcloud firestore databases create --location="$REGION" --database='(default)'

log "Cloud Storage bucket: gs://$BUCKET (private; the app serves photos through /media)"
gcloud storage buckets describe "gs://$BUCKET" >/dev/null 2>&1 || \
  gcloud storage buckets create "gs://$BUCKET" --location="$REGION" \
    --uniform-bucket-level-access --public-access-prevention

log "Cloud SQL instance: $SQL_INSTANCE (this takes several minutes)"
if ! gcloud sql instances describe "$SQL_INSTANCE" >/dev/null 2>&1; then
  gcloud sql instances create "$SQL_INSTANCE" \
    --database-version=POSTGRES_16 --edition=ENTERPRISE --tier=db-f1-micro \
    --region="$REGION" --storage-size=10GB --storage-auto-increase
fi
gcloud sql databases describe "$SQL_DB" --instance="$SQL_INSTANCE" >/dev/null 2>&1 || \
  gcloud sql databases create "$SQL_DB" --instance="$SQL_INSTANCE"

DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"
if gcloud sql users list --instance="$SQL_INSTANCE" --format='value(name)' | grep -qx "$SQL_USER"; then
  gcloud sql users set-password "$SQL_USER" --instance="$SQL_INSTANCE" --password="$DB_PASSWORD"
else
  gcloud sql users create "$SQL_USER" --instance="$SQL_INSTANCE" --password="$DB_PASSWORD"
fi
CONNECTION_NAME="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"

log "Runtime service account: $RUNTIME_SA"
gcloud iam service-accounts describe "$RUNTIME_SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create "$RUNTIME_SA_NAME" --display-name="Food hub Cloud Run runtime"
for role in roles/cloudsql.client roles/datastore.user roles/storage.objectUser \
            roles/firebaseauth.admin roles/secretmanager.secretAccessor roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$RUNTIME_SA" --role="$role" >/dev/null
done

log "Cloud Build permissions"
CB_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
for role in roles/run.admin roles/artifactregistry.writer roles/logging.logWriter roles/storage.admin; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$CB_SA" --role="$role" >/dev/null
done
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:$CB_SA" --role=roles/iam.serviceAccountUser >/dev/null

log "Secrets (placeholders are created; update the Stripe/Firebase ones after setup)"
upsert_secret() { # name value
  if gcloud secrets describe "$1" >/dev/null 2>&1; then
    printf '%s' "$2" | gcloud secrets versions add "$1" --data-file=- >/dev/null
  else
    printf '%s' "$2" | gcloud secrets create "$1" --data-file=- --replication-policy=automatic >/dev/null
  fi
}
upsert_secret DATABASE_URL "postgresql://${SQL_USER}:${DB_PASSWORD}@localhost/${SQL_DB}?host=/cloudsql/${CONNECTION_NAME}"
for s in FIREBASE_API_KEY FIREBASE_APP_ID STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET; do
  gcloud secrets describe "$s" >/dev/null 2>&1 || upsert_secret "$s" "REPLACE_ME"
done
gcloud secrets describe SITE_URL >/dev/null 2>&1 || upsert_secret SITE_URL "https://REPLACE_WITH_CLOUD_RUN_URL"

cat <<MSG

=====================================================================
Google Cloud resources are ready in project: $PROJECT_ID ($REGION)

  Cloud SQL connection name : $CONNECTION_NAME
  Database user / password  : $SQL_USER / $DB_PASSWORD   (also stored in secret DATABASE_URL)
  Photo bucket (private)    : gs://$BUCKET
  Runtime service account   : $RUNTIME_SA

Manual steps that gcloud cannot do for you:
  1. Firebase: https://console.firebase.google.com -> Add project -> pick "$PROJECT_ID".
     Build > Authentication > Get started > enable "Email/Password".
     Project settings > General > Your apps > Add web app -> copy apiKey + appId, then:
       printf '%s' 'YOUR_API_KEY' | gcloud secrets versions add FIREBASE_API_KEY --data-file=-
       printf '%s' 'YOUR_APP_ID'  | gcloud secrets versions add FIREBASE_APP_ID  --data-file=-
  2. Stripe (test mode): https://dashboard.stripe.com/test/apikeys
       printf '%s' 'sk_test_...' | gcloud secrets versions add STRIPE_SECRET_KEY --data-file=-
     After the first deploy, add a webhook for https://<cloud-run-url>/api/webhooks/stripe
     (event: checkout.session.completed) and store its signing secret:
       printf '%s' 'whsec_...' | gcloud secrets versions add STRIPE_WEBHOOK_SECRET --data-file=-
  3. Deploy:  gcloud builds submit --config cloudbuild.yaml --substitutions=_ADMIN_EMAILS=you@example.com
     Then store the Cloud Run URL:  printf '%s' 'https://...run.app' | gcloud secrets versions add SITE_URL --data-file=-
     and add that URL to Firebase Authentication > Settings > Authorized domains.
  4. Seed demo data (from your laptop, with npm run db:proxy running in another tab):
       npm run seed
=====================================================================
MSG
