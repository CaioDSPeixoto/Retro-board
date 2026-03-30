import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifica a assinatura HMAC do cookie e retorna o userId se válido.
 * Retorna null se o cookie estiver ausente, malformado ou com assinatura inválida.
 */
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("finance_session")?.value;
  if (!raw) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return null;

  const userId = raw.slice(0, lastDot);
  const providedSig = raw.slice(lastDot + 1);

  if (!userId) return null;

  const expectedSig = createHmac("sha256", secret).update(userId).digest("hex");

  // timingSafeEqual previne timing attacks
  try {
    const a = Buffer.from(providedSig, "hex");
    const b = Buffer.from(expectedSig, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return userId;
}
