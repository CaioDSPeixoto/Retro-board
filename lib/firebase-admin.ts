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

  const cleaned =
    raw.startsWith("'") && raw.endsWith("'")
      ? raw.slice(1, -1)
      : raw.startsWith('"') && raw.endsWith('"')
        ? raw.slice(1, -1)
        : raw;

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

/**
 * Cache de verificação de revogação de tokens.
 * checkRevoked faz round-trip ao Google (~200-500ms).
 * Cacheamos o resultado por 5 minutos por uid — seguro porque:
 * - Tokens Firebase expiram em 1h de qualquer forma
 * - Em caso de revogação urgente, o cache expira em no máximo 5min
 */
const revocationCache = new Map<string, { valid: boolean; expiresAt: number }>();
const REVOCATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function verifyIdTokenCached(idToken: string): Promise<import("firebase-admin/auth").DecodedIdToken> {
  // Decodifica sem checkRevoked primeiro (operação local, sem round-trip)
  const decoded = await adminAuth.verifyIdToken(idToken, false);
  const uid = decoded.uid;
  const now = Date.now();

  const cached = revocationCache.get(uid);
  if (cached && cached.expiresAt > now) {
    // Cache hit — pular round-trip ao Google
    if (!cached.valid) throw new Error("auth/id-token-revoked");
    return decoded;
  }

  // Cache miss ou expirado — verificar revogação com round-trip
  await adminAuth.verifyIdToken(idToken, true);
  revocationCache.set(uid, { valid: true, expiresAt: now + REVOCATION_CACHE_TTL });

  return decoded;
}

/** Invalida o cache de revogação ao fazer logout */
export function invalidateRevocationCache(uid: string): void {
  revocationCache.delete(uid);
}
