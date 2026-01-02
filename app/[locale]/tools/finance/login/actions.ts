"use server";

import { createMockSession } from "@/lib/auth/login";
import { destroySession } from "@/lib/auth/logout";
import { redirect } from "next/navigation";

// Now receives userId directly, as validation happens on client (firebase) or inside component (admin check)
export async function loginAction(userId: string, locale: string) {
  if (!userId) return;

  await createMockSession(userId);

  redirect(`/${locale}/tools/finance`);
}

export async function logoutFinance(formData: FormData) {
  const locale = formData.get("locale")?.toString() || "pt";

  await destroySession();
  redirect(`/${locale}/tools/finance/login`);
}