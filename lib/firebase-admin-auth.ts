import "server-only";

import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebase-admin";

export const adminAuth = getAuth(adminApp);
