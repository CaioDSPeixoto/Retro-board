import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";

const COLLECTIONS = [
  "finance_boards",
  "finance_board_invites",
  "finance_cards",
  "finance_categories",
  "finance_fixed_templates",
  "finance_items",
  "rooms",
];

function parseServiceAccount() {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64?.trim()) {
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY missing");

  const cleaned =
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('"') && raw.endsWith('"'))
      ? raw.slice(1, -1)
      : raw;

  return JSON.parse(cleaned.replace(/\\n/g, "\n"));
}

function serializeValue(value) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        serializeValue(nestedValue),
      ]),
    );
  }

  return value;
}

async function exportCollection(db, collectionName) {
  const snap = await db.collection(collectionName).get();
  const docs = snap.docs.map((doc) => ({
    id: doc.id,
    data: serializeValue(doc.data()),
  }));

  if (collectionName !== "rooms") return docs;

  return Promise.all(
    docs.map(async (room) => {
      const cardsSnap = await db.collection("rooms").doc(room.id).collection("cards").get();
      return {
        ...room,
        subcollections: {
          cards: cardsSnap.docs.map((doc) => ({
            id: doc.id,
            data: serializeValue(doc.data()),
          })),
        },
      };
    }),
  );
}

const app =
  getApps()[0] ||
  initializeApp({
    credential: cert(parseServiceAccount()),
  });
const db = getFirestore(app);

const backup = {
  exportedAt: new Date().toISOString(),
  collections: Object.fromEntries(
    await Promise.all(
      COLLECTIONS.map(async (collectionName) => [
        collectionName,
        await exportCollection(db, collectionName),
      ]),
    ),
  ),
};

const outputDir = resolve("exports");
await mkdir(outputDir, { recursive: true });

const fileName = `firestore-backup-${backup.exportedAt.replace(/[:.]/g, "-")}.json`;
const outputPath = resolve(outputDir, fileName);
await writeFile(outputPath, `${JSON.stringify(backup, null, 2)}\n`, "utf8");

console.log(`Backup exportado em ${outputPath}`);
