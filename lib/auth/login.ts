import { cookies } from "next/headers";

export async function createMockSession(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set("finance_session", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 1, // 1 dias
  });
}