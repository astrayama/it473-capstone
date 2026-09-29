import "server-only";

/**
 * Google Cloud settings (server only). Defaults point at the team's shared project so a
 * Cloud Run revision without extra env vars still finds its data; override them locally
 * or for another project with GOOGLE_CLOUD_PROJECT / FIREBASE_PROJECT_ID / GCS_BUCKET.
 */
export const GCP_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "it473-capstone-project";

/** Private bucket holding product photos (`products/{id}/images/primary.jpg`). Served via /media. */
export const MEDIA_BUCKET = process.env.GCS_BUCKET || `${GCP_PROJECT_ID}-media`;

export const FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN || `${GCP_PROJECT_ID}.firebaseapp.com`;
