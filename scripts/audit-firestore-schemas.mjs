import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

function hasString(data, key) {
  return typeof data[key] === "string" && data[key].trim().length > 0;
}

function hasNumber(data, key) {
  return typeof data[key] === "number" && Number.isFinite(data[key]);
}

function checkFinanceItem(id, data) {
  const issues = [];
  if (!hasString(data, "userId")) issues.push("userId ausente");
  if (!hasString(data, "title")) issues.push("title ausente");
  if (!hasNumber(data, "amount")) issues.push("amount invalido");
  if (!hasString(data, "date")) issues.push("date ausente");
  if (!["income", "expense"].includes(data.type)) issues.push("type invalido");
  if (!["paid", "pending", "partial", "moved"].includes(data.status)) {
    issues.push("status invalido");
  }
  return issues.map((issue) => ({ collection: "finance_items", id, issue }));
}

function checkFinanceBoard(id, data) {
  const issues = [];
  if (!hasString(data, "name")) issues.push("name ausente");
  if (!hasString(data, "ownerId")) issues.push("ownerId ausente");
  if (!Array.isArray(data.memberIds)) issues.push("memberIds invalido");
  return issues.map((issue) => ({ collection: "finance_boards", id, issue }));
}

function checkFinanceCard(id, data) {
  const issues = [];
  if (!hasString(data, "userId")) issues.push("userId ausente");
  if (!hasString(data, "name")) issues.push("name ausente");
  if (!["credit", "debit"].includes(data.mode)) issues.push("mode invalido");
  return issues.map((issue) => ({ collection: "finance_cards", id, issue }));
}

function checkRoom(id, data) {
  const issues = [];
  if (!hasString(data, "roomName")) issues.push("roomName ausente");
  if (typeof data.requireName !== "boolean") issues.push("requireName invalido");
  return issues.map((issue) => ({ collection: "rooms", id, issue }));
}

async function auditCollection(db, collection, checker) {
  const snap = await db.collection(collection).get();
  return snap.docs.flatMap((doc) => checker(doc.id, doc.data()));
}

const app =
  getApps()[0] ||
  initializeApp({
    credential: cert(parseServiceAccount()),
  });
const db = getFirestore(app);

const issues = [
  ...(await auditCollection(db, "finance_items", checkFinanceItem)),
  ...(await auditCollection(db, "finance_boards", checkFinanceBoard)),
  ...(await auditCollection(db, "finance_cards", checkFinanceCard)),
  ...(await auditCollection(db, "rooms", checkRoom)),
];

if (issues.length === 0) {
  console.log("Nenhum documento fora do schema basico foi encontrado.");
  process.exit(0);
}

console.table(issues);
process.exit(1);
