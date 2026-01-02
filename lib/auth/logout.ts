import { cookies } from "next/headers";

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("finance_session");
}