import { cookies } from "next/headers";

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("finance_session");
  if (!session?.value) return null;

  try {
    const { adminAuth } = await import("@/lib/firebase-admin-auth");
    const decoded = await adminAuth.verifySessionCookie(session.value, true);
    return decoded.uid;
  } catch {
    return null;
  }
}
