import "server-only";

/**
 * Rate limiter simples em memória para server actions.
 * Limita por chave (userId ou IP) com janela deslizante.
 *
 * Nota: em produção com múltiplas instâncias, usar Redis.
 * Para single-instance (Vercel serverless), funciona bem.
 */

type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

// Limpa entradas antigas a cada 5 minutos
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

/**
 * Verifica se a chave excedeu o limite.
 * @param key - Identificador único (userId, IP, etc.)
 * @param maxRequests - Máximo de requisições na janela
 * @param windowMs - Janela de tempo em ms (default: 60s)
 * @returns true se bloqueado, false se permitido
 */
export function isRateLimited(
  key: string,
  maxRequests: number,
  windowMs = 60_000
): boolean {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    return true;
  }

  entry.timestamps.push(now);
  return false;
}
