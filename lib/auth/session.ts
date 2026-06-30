import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("finance_session");
  if (!session?.value) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(session.value, true);
    return decoded.uid;
  } catch {
    cookieStore.delete("finance_session");
    return null;
  }
}
