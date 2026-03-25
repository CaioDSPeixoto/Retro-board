"use client";

import { useTranslations } from "next-intl";
import { FiArrowUpRight } from "react-icons/fi";
import Link from "next/link";

type Props = {
  locale: string;
  className?: string;
};

export default function UpgradePrompt({ locale, className = "" }: Props) {
  const t = useTranslations("Plans");

  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl border border-amber-300/40 bg-amber-50/50 ${className}`}>
      <p className="text-xs text-amber-700 flex-1">{t("upgradeToCreate")}</p>
      <Link
        href={`/${locale}/tools/pricing`}
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
      >
        {t("viewPlans")} <FiArrowUpRight size={12} />
      </Link>
    </div>
  );
}
