"use server";

import { createMockSession } from "@/lib/auth/login";
import { destroySession } from "@/lib/auth/logout";
import { adminAuth } from "@/lib/firebase-admin";
import { ensureUserProfile } from "@/lib/auth/user-profile";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

const VALID_LOCALES = new Set(routing.locales);

function sanitizeLocale(locale: unknown): string {
  const l = String(locale || "pt").toLowerCase();
  return VALID_LOCALES.has(l as any) ? l : "pt";
}

export async function loginAction(idToken: string, locale: string) {
  if (!idToken || typeof idToken !== "string") return;

  const safeLocale = sanitizeLocale(locale);

  // checkRevoked: true rejeita tokens de contas com senha alterada ou deletadas
  const decoded = await adminAuth.verifyIdToken(idToken, true);

  await ensureUserProfile(
    decoded.uid,
    decoded.email || "",
    decoded.name || decoded.email?.split("@")[0],
  );

  await createMockSession(decoded.uid);
  redirect(`/${safeLocale}/tools/finance`);
}

export async function logoutFinance(formData: FormData) {
  const safeLocale = sanitizeLocale(formData.get("locale"));
  await destroySession();
  redirect(`/${safeLocale}/tools/finance/login`);
}
