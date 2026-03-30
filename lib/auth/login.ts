import { cookies } from "next/headers";
import { createHmac } from "crypto";

/**
 * Assina o userId com HMAC-SHA256 para evitar forjamento de cookie.
 * Formato do cookie: `{userId}.{signature}`
 */
function signSession(userId: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is required");
  const sig = createHmac("sha256", secret).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

export async function createMockSession(userId: string) {
  const cookieStore = await cookies();
  const signed = signSession(userId);

  cookieStore.set("finance_session", signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 1, // 1 dia
  });
}