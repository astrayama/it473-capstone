import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/** Public Firebase web config, passed from the server at runtime (see FirebaseProvider). */
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

let cachedApp: FirebaseApp | undefined;

export function getFirebaseAuth(config: FirebaseWebConfig): Auth {
  if (!cachedApp) {
    cachedApp = getApps()[0] ?? initializeApp(config);
  }
  return getAuth(cachedApp);
}

/** Turns Firebase Auth error codes into something a customer can read. */
export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with that email already exists. Try signing in.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a minute and try again.";
    default:
      return (err as Error)?.message ?? "Something went wrong.";
  }
}
