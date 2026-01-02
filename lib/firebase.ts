// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log("Firebase Config Check:", Object.fromEntries(
  Object.entries(firebaseConfig).map(([k, v]) => [k, v ? "Present" : "Missing"])
));

if (!firebaseConfig.apiKey) {
  throw new Error("Firebase API Key is missing! Check your .env.local and REBUILD your app.");
}

// Check if we are running on server or client
if (typeof window === 'undefined') {
  console.log("Firebase initialized on SERVER");
} else {
  console.log("Firebase initialized on CLIENT");
}



// Garante que não inicialize múltiplas vezes (hot reload no Next pode causar isso)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
