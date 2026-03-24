"use client";

import { useTranslations } from "next-intl";
import type { InterestType } from "@/types/finance";

type Props = {
  interestType: InterestType | "";
  interestRate: string;
  interestFixed: string;
  onInterestTypeChange: (type: InterestType | "") => void;
  onInterestRateChange: (value: string) => void;
  onInterestFixedChange: (value: string) => void;
};

export default function InterestFieldsConfig({
  interestType,
  interestRate,
  interestFixed,
  onInterestTypeChange,
  onInterestRateChange,
  onInterestFixedChange,
}: Props) {
  const t = useTranslations("FinanceForm");

  const rateNum = parseFloat(interestRate);
  const fixedNum = parseFloat(interestFixed);

  const showRateError = interestRate !== "" && (isNaN(rateNum) || rateNum < 0 || rateNum > 100);
  const showFixedError = interestFixed !== "" && (isNaN(fixedNum) || fixedNum < 0);

  const showRate = interestType === "percentage" || interestType === "both";
  const showFixed = interestType === "fixed" || interestType === "both";

  const typeOptions: { value: InterestType; label: string }[] = [
    { value: "percentage", label: t("interestPercentage") },
    { value: "fixed", label: t("interestFixed") },
    { value: "both", label: t("interestBoth") },
  ];

  return (
    <div
      className="rounded-xl border p-3 space-y-3 transition-all duration-200"
      style={{
        background: "var(--color-surface-raised)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Interest Type Selector */}
      <div>
        <label
          className="block text-xs font-bold uppercase tracking-wider mb-1 px-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t("interestTypeLabel")}
        </label>
        <div className="flex gap-2">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                onInterestTypeChange(interestType === opt.value ? "" : opt.value)
              }
              className={`flex-1 min-h-[44px] py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                interestType === opt.value
                  ? "border-blue-500 text-blue-500"
                  : ""
              }`}
              style={
                interestType !== opt.value
                  ? {
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }
                  : { background: "var(--color-accent-subtle)" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rate Field */}
      {showRate && (
        <div className="transition-all duration-200">
          <label
            className="block text-xs font-bold uppercase tracking-wider mb-1 px-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("interestRateLabel")}
          </label>
          <input
            name="interestRate"
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={interestRate}
            onChange={(e) => onInterestRateChange(e.target.value)}
            placeholder="0.00"
            className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
            }}
          />
          {showRateError && (
            <p className="text-[11px] mt-1 px-1 text-red-500">
              {t("errors.invalidInterestRate")}
            </p>
          )}
        </div>
      )}

      {/* Fixed Value Field */}
      {showFixed && (
        <div className="transition-all duration-200">
          <label
            className="block text-xs font-bold uppercase tracking-wider mb-1 px-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("interestFixedLabel")}
          </label>
          <input
            name="interestFixed"
            type="number"
            step="0.01"
            min={0}
            value={interestFixed}
            onChange={(e) => onInterestFixedChange(e.target.value)}
            placeholder="0.00"
            className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
            }}
          />
          {showFixedError && (
            <p className="text-[11px] mt-1 px-1 text-red-500">
              {t("errors.invalidInterestFixed")}
            </p>
          )}
        </div>
      )}

      {/* Hidden inputs for form submission */}
      {interestType && (
        <input type="hidden" name="interestType" value={interestType} />
      )}
    </div>
  );
}
