"use server";

import { createMockSession } from "@/lib/auth/login";
import { destroySession } from "@/lib/auth/logout";
import { adminAuth } from "@/lib/firebase-admin";
import { ensureUserProfile } from "@/lib/auth/user-profile";
import { redirect } from "next/navigation";

export async function loginAction(idToken: string, locale: string) {
  if (!idToken) return;

  const decoded = await adminAuth.verifyIdToken(idToken);

  // Garante que o perfil do usuário existe no Firestore
  await ensureUserProfile(
    decoded.uid,
    decoded.email || "",
    decoded.name || decoded.email?.split("@")[0],
  );

  await createMockSession(decoded.uid);
  redirect(`/${locale}/tools/finance`);
}

export async function logoutFinance(formData: FormData) {
  const locale = formData.get("locale")?.toString() || "pt";
  await destroySession();
  redirect(`/${locale}/tools/finance/login`);
}
