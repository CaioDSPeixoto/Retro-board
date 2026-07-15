// lib/firebase-admin.ts
import "server-only";

import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function parseServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (b64 && b64.trim()) {
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json);
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY missing in .env.local (or use FIREBASE_SERVICE_ACCOUNT_KEY_BASE64)"
    );
  }

  // remove aspas externas se existirem
  const cleaned =
    raw.startsWith("'") && raw.endsWith("'")
      ? raw.slice(1, -1)
      : raw.startsWith('"') && raw.endsWith('"')
        ? raw.slice(1, -1)
        : raw;

  // garante \n correto caso venha com \n "cru"
  const normalized = cleaned.replace(/\\n/g, "\n");

  return JSON.parse(normalized);
}

let _app: App | undefined;
let _db: Firestore | undefined;

function getAdminApp(): App {
  if (_app) return _app;

  _app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert(parseServiceAccount()),
        });

  return _app;
}

function getAdminDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getAdminApp());
  return _db;
}

export const adminApp = new Proxy({} as App, {
  get(_, prop) {
    return (getAdminApp() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_, prop) {
    const db = getAdminDb();
    const value = (db as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") return value.bind(db);
    return value;
  },
});
