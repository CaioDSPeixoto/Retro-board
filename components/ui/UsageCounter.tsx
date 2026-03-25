"use client";

import { useTranslations } from "next-intl";

type Props = {
  current: number;
  max: number;
  className?: string;
};

export default function UsageCounter({ current, max, className = "" }: Props) {
  const t = useTranslations("Plans");

  if (max === -1) return null;

  const percent = max > 0 ? (current / max) * 100 : 0;
  const atLimit = current >= max;
  const nearLimit = percent >= 80;

  const color = atLimit
    ? "text-red-500"
    : nearLimit
      ? "text-amber-600"
      : "text-[var(--color-text-muted)]";

  return (
    <span className={`text-xs font-semibold ${color} ${className}`}>
      {t("usage", { current, max })}
    </span>
  );
}
