export type FirestoreDocumentLike = {
  id: string;
  data: () => Record<string, unknown> | undefined;
};

type TimestampLike = {
  toDate: () => Date;
};

function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as TimestampLike).toDate === "function"
  );
}

export function getDocumentData(doc: FirestoreDocumentLike): Record<string, unknown> {
  const data = doc.data();
  if (data && typeof data === "object" && !Array.isArray(data)) return data;
  return {};
}

export function readString(
  data: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = data[key];
  return typeof value === "string" ? value : fallback;
}

export function readOptionalString(
  data: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = data[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function readNumber(
  data: Record<string, unknown>,
  key: string,
  fallback = 0,
): number {
  const value = data[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function readOptionalNumber(
  data: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = data[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function readBoolean(
  data: Record<string, unknown>,
  key: string,
  fallback = false,
): boolean {
  const value = data[key];
  return typeof value === "boolean" ? value : fallback;
}

export function readStringArray(
  data: Record<string, unknown>,
  key: string,
): string[] {
  const value = data[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function readEnum<T extends string>(
  data: Record<string, unknown>,
  key: string,
  values: readonly T[],
  fallback: T,
): T {
  const value = data[key];
  return typeof value === "string" && values.includes(value as T)
    ? (value as T)
    : fallback;
}

export function readOptionalEnum<T extends string>(
  data: Record<string, unknown>,
  key: string,
  values: readonly T[],
): T | undefined {
  const value = data[key];
  return typeof value === "string" && values.includes(value as T)
    ? (value as T)
    : undefined;
}

export function readDateString(
  data: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = data[key];
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (isTimestampLike(value)) return value.toDate().toISOString();
  return fallback;
}

export function removeUndefinedValues<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
}
