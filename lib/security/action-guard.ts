import "server-only";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkActionRateLimit(
  userId: string,
  action: string,
  options: RateLimitOptions,
): string | null {
  const now = Date.now();
  const key = `${action}:${userId}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (current.count >= options.limit) {
    return "Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.";
  }

  current.count += 1;
  return null;
}

export function logFinanceAction(
  action: string,
  details: Record<string, unknown>,
): void {
  console.info(
    JSON.stringify({
      scope: "finance",
      action,
      at: new Date().toISOString(),
      ...details,
    }),
  );
}
