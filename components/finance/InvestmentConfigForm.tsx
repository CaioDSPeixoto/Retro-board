"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FiCheck } from "react-icons/fi";
import Spinner from "@/components/ui/Spinner";
import { saveInvestmentConfig } from "@/app/[locale]/tools/finance/(protected)/actions";
import type { InvestmentConfig, InvestmentCategory } from "@/types/finance";

type Props = {
  boardId: string | null;
  initialConfig?: InvestmentConfig | null;
  locale: string;
};

const CATEGORIES: { key: InvestmentCategory; labelKey: string }[] = [
  { key: "emergency", labelKey: "emergencyLabel" },
  { key: "fixed-income", labelKey: "fixedIncomeLabel" },
  { key: "variable-income", labelKey: "variableIncomeLabel" },
];

export default function InvestmentConfigForm({ boardId, initialConfig, locale }: Props) {
  const t = useTranslations("FinanceInvestments");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialValues = CATEGORIES.reduce(
    (acc, cat) => {
      const found = initialConfig?.allocations?.find((a) => a.category === cat.key);
      acc[cat.key] = found ? String(found.percentage) : "";
      return acc;
    },
    {} as Record<InvestmentCategory, string>,
  );

  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const parsedValues = CATEGORIES.map((cat) => {
    const num = parseFloat(values[cat.key]);
    return Number.isNaN(num) ? 0 : num;
  });
  const sum = parsedValues.reduce((a, b) => a + b, 0);
  const sumIsValid = Math.abs(sum - 100) < 0.01;

  function handleChange(category: InvestmentCategory, value: string) {
    setValues((prev) => ({ ...prev, [category]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit() {
    if (!sumIsValid) {
      setError(t("allocationSumError"));
      return;
    }

    setError("");
    setSuccess("");

    const allocations = CATEGORIES.map((cat, i) => ({
      category: cat.key,
      percentage: parsedValues[i],
    }));

    const res = await saveInvestmentConfig(boardId, allocations, locale);

    if (res && "error" in res && res.error) {
      setError(res.error as string);
      return;
    }

    setSuccess(t("configSaved"));
    startTransition(() => router.refresh());
  }

  return (
    <div
      className="rounded-2xl border p-5 space-y-4 transition-all duration-200"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <h3
        className="text-base font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {t("configTitle")}
      </h3>

      <div className="space-y-3">
        {CATEGORIES.map((cat, i) => (
          <div key={cat.key}>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1 px-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              {t(cat.labelKey)}
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={values[cat.key]}
                onChange={(e) => handleChange(cat.key, e.target.value)}
                placeholder="0"
                className="w-full p-3 pr-10 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                style={{
                  background: "var(--color-surface-raised)",
                  color: "var(--color-text-primary)",
                }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
                style={{ color: "var(--color-text-muted)" }}
              >
                %
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time sum display */}
      <div
        className="flex items-center justify-between px-1 text-sm font-semibold"
        style={{ color: sumIsValid ? "var(--color-text-secondary)" : undefined }}
      >
        <span style={{ color: "var(--color-text-muted)" }}>
          {t("allocationLabel")}
        </span>
        <span
          className={sumIsValid ? "text-green-600" : "text-red-500"}
        >
          {sum.toFixed(1)}%
        </span>
      </div>

      {/* Error */}
      {error && (
        <p className="text-[12px] text-red-500 px-1">{error}</p>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-1.5 text-[12px] text-green-600 px-1">
          <FiCheck size={14} />
          <span>{success}</span>
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !sumIsValid}
        className="w-full min-h-[44px] py-3 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: sumIsValid ? "var(--color-accent-primary)" : "var(--color-border)",
          color: sumIsValid ? "#fff" : "var(--color-text-muted)",
        }}
      >
        {isPending ? (
          <Spinner size="md" color="white" />
        ) : (
          t("saveConfig")
        )}
      </button>
    </div>
  );
}
