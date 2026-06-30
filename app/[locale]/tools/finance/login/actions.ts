"use server";

import { createFinanceSession } from "@/lib/auth/login";
import { destroySession } from "@/lib/auth/logout";
import { adminAuth } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";

export async function loginAction(idToken: string, locale: string) {
  if (!idToken) return;

  await adminAuth.verifyIdToken(idToken);
  await createFinanceSession(idToken);
  redirect(`/${locale}/tools/finance`);
}

export async function logoutFinance(formData: FormData) {
  const locale = formData.get("locale")?.toString() || "pt";
  await destroySession();
  redirect(`/${locale}/tools/finance/login`);
}
