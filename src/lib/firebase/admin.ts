import "server-only";
import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { GCP_PROJECT_ID } from "@/config/gcp";

/**
 * Firebase Admin SDK (server only). Authenticates with Application Default
 * Credentials: the Cloud Run service account in production, or
 * `gcloud auth application-default login` on a developer machine.
 */
function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({ projectId: GCP_PROJECT_ID });
}

export function adminAuth() {
  return getAuth(app());
}

export function firestore() {
  return getFirestore(app());
}
