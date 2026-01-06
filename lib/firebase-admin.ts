// lib/firebase-admin.ts
import "server-only";

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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

const serviceAccount = parseServiceAccount();

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
      });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
