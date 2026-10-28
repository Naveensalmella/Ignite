import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// True when the deployment has the Firebase env vars it needs.
// The UI shows a setup screen instead of crashing when this is false.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

// Without config, getAuth() throws (auth/invalid-api-key) and breaks the build.
// Use inert placeholders instead — the UI shows a setup screen and never calls Firebase.
const effectiveConfig = isFirebaseConfigured
  ? firebaseConfig
  : { apiKey: "not-configured", authDomain: "not-configured.firebaseapp.com", projectId: "not-configured", appId: "not-configured" };

// Reuse the existing app on hot reloads instead of throwing "app already exists".
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(effectiveConfig);

function createFirestore(): Firestore {
  // In the browser keep a local IndexedDB cache: faster loads, works offline,
  // and writes made offline are synced when the connection returns.
  // Falls back to the in-memory cache if IndexedDB is unavailable.
  if (typeof window !== "undefined") {
    try {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      // Already initialized (hot reload) — reuse the existing instance.
    }
  }
  return getFirestore(app);
}

export const auth: Auth = getAuth(app);
export const db: Firestore = createFirestore();
export default app;
