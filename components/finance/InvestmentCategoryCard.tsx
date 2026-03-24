"use client";

import { useTranslations } from "next-intl";
import { FiShield, FiLock, FiTrendingUp } from "react-icons/fi";
import type { InvestmentCategory } from "@/types/finance";

type Props = {
  category: InvestmentCategory;
  totalAmount: number;
  suggestedAmount?: number;
  percentage?: number;
};

const CATEGORY_STYLES: Record<
  InvestmentCategory,
  { bg: string; text: string; labelKey: string; Icon: typeof FiShield }
> = {
  emergency: { bg: "bg-green-100", text: "text-green-600", labelKey: "emergencyLabel", Icon: FiShield },
  "fixed-income": { bg: "bg-blue-100", text: "text-blue-600", labelKey: "fixedIncomeLabel", Icon: FiLock },
  "variable-income": { bg: "bg-purple-100", text: "text-purple-600", labelKey: "variableIncomeLabel", Icon: FiTrendingUp },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function InvestmentCategoryCard({ category, totalAmount, suggestedAmount, percentage }: Props) {
  const t = useTranslations("FinanceInvestments");
  const { bg, text, labelKey, Icon } = CATEGORY_STYLES[category];

  return (
    <div
      className="rounded-xl border shadow-sm p-4 flex items-center gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className={`p-3 rounded-full ${bg} ${text} shrink-0`}>
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
            {t(labelKey)}
          </h4>
          {percentage !== undefined && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${bg} ${text}`}>
              {percentage}%
            </span>
          )}
        </div>

        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {t("investedLabel")}
        </p>
        <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
          {formatCurrency(totalAmount)}
        </p>

        {suggestedAmount !== undefined && (
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {t("suggestedLabel")}: {formatCurrency(suggestedAmount)}
          </p>
        )}
      </div>
    </div>
  );
}
