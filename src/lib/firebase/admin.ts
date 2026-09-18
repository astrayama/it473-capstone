import "server-only";
import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Firebase Admin SDK (server only). Authenticates with Application Default
 * Credentials: the Cloud Run service account in production, or
 * `gcloud auth application-default login` on a developer machine.
 */
function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT,
  });
}

export function adminAuth() {
  return getAuth(app());
}

export function firestore() {
  return getFirestore(app());
}
