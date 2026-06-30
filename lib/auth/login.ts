import { cookies } from "next/headers";

const FINANCE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

export async function createFinanceSession(idToken: string) {
  const cookieStore = await cookies();
  const expiresIn = FINANCE_SESSION_MAX_AGE_SECONDS * 1000;
  const { adminAuth } = await import("@/lib/firebase-admin-auth");
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn,
  });

  cookieStore.set("finance_session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: FINANCE_SESSION_MAX_AGE_SECONDS,
  });
}
