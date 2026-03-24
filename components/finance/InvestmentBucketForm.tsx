"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import Spinner from "@/components/ui/Spinner";
import { saveBucket } from "@/app/[locale]/tools/finance/(protected)/actions";
import type { FinanceItem, InvestmentBucket, BucketAllocationType } from "@/types/finance";

type Props = {
  bucket: InvestmentBucket | null;
  boardId: string | null;
  locale: string;
  incomes: FinanceItem[];
  onClose: () => void;
};

export default function InvestmentBucketForm({ bucket, boardId, locale, incomes, onClose }: Props) {
  const t = useTranslations("FinanceInvestments");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(bucket?.name ?? "");
  const [balance, setBalance] = useState(bucket ? String(bucket.currentBalance) : "");
  const [allocationType, setAllocationType] = useState<BucketAllocationType | "none">(
    bucket?.allocationType ?? "none",
  );
  const [allocationValue, setAllocationValue] = useState(
    bucket?.allocationValue ? String(bucket.allocationValue) : "",
  );
  const [linkedIncomeId, setLinkedIncomeId] = useState(bucket?.linkedIncomeItemId ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Unique incomes by title (for fixed/recurring, show only one)
  const uniqueIncomes = incomes.reduce<FinanceItem[]>((acc, item) => {
    if (!acc.some((i) => i.title === item.title)) acc.push(item);
    return acc;
  }, []);

  const linkedIncomeTitle = uniqueIncomes.find((i) => i.id === linkedIncomeId)?.title ?? null;

  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (!name.trim()) { setError(t("errors.emptyName")); return; }

    const parsedBalance = parseFloat(balance.replace(",", "."));
    if (isNaN(parsedBalance) || parsedBalance < 0) { setError(t("errors.invalidBalance")); return; }

    const realAllocationType: BucketAllocationType | null =
      allocationType === "none" ? null : allocationType;

    let parsedAllocationValue = 0;
    if (realAllocationType) {
      parsedAllocationValue = parseFloat(allocationValue.replace(",", "."));
      if (isNaN(parsedAllocationValue) || parsedAllocationValue <= 0) {
        setError(t("errors.invalidAllocationValue"));
        return;
      }
      if (!linkedIncomeId) {
        setError(t("errors.needLinkedIncome"));
        return;
      }
    }

    const res = await saveBucket(
      {
        id: bucket?.id,
        boardId: boardId ?? "",
        name: name.trim(),
        currentBalance: parsedBalance,
        allocationType: realAllocationType,
        allocationValue: parsedAllocationValue,
        linkedIncomeItemId: realAllocationType ? linkedIncomeId : null,
        linkedIncomeTitle: realAllocationType ? linkedIncomeTitle : null,
      },
      locale,
    );

    if (res && "error" in res && res.error) {
      setError(res.error as string);
      return;
    }

    setSuccess(t("bucketSaved"));
    startTransition(() => {
      router.refresh();
      setTimeout(onClose, 600);
    });
  }

  return (
    <div
      className="rounded-2xl border p-5 space-y-4 animate-fadeInUp"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-base font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {bucket ? t("editBucket") : t("createBucket")}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-raised)]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Name */}
      <div>
        <label
          className="block text-xs font-bold uppercase tracking-wider mb-1 px-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t("bucketNameLabel")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("bucketNamePlaceholder")}
          className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
          style={{
            background: "var(--color-surface-raised)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      {/* Current Balance */}
      <div>
        <label
          className="block text-xs font-bold uppercase tracking-wider mb-1 px-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t("currentBalanceLabel")}
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="0,00"
          className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
          style={{
            background: "var(--color-surface-raised)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      {/* Auto Allocation Section */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: "var(--color-surface-raised)" }}
      >
        <h4
          className="text-sm font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t("autoAllocationTitle")}
        </h4>
        <p
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t("autoAllocationHint")}
        </p>

        {/* Allocation Type */}
        <div>
          <label
            className="block text-xs font-bold uppercase tracking-wider mb-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("allocationTypeLabel")}
          </label>
          <div className="flex gap-2">
            {(["none", "percentage", "fixed"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAllocationType(opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  allocationType === opt
                    ? "text-white shadow-sm"
                    : "hover:opacity-80"
                }`}
                style={{
                  background:
                    allocationType === opt
                      ? "var(--color-accent-primary)"
                      : "var(--color-surface)",
                  color:
                    allocationType === opt
                      ? "#fff"
                      : "var(--color-text-secondary)",
                }}
              >
                {opt === "none"
                  ? t("allocationNone")
                  : opt === "percentage"
                    ? t("allocationPercentage")
                    : t("allocationFixed")}
              </button>
            ))}
          </div>
        </div>

        {/* Allocation Value + Linked Income (only if type != none) */}
        {allocationType !== "none" && (
          <>
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t("allocationValueLabel")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={allocationValue}
                  onChange={(e) => setAllocationValue(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 pr-10 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                  style={{
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {allocationType === "percentage" ? "%" : "R$"}
                </span>
              </div>
              <p
                className="text-[11px] mt-1 px-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {allocationType === "percentage"
                  ? t("allocationPercentHint")
                  : t("allocationFixedHint")}
              </p>
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t("linkedIncomeLabel")}
              </label>
              {uniqueIncomes.length === 0 ? (
                <p
                  className="text-xs py-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {t("noIncomesAvailable")}
                </p>
              ) : (
                <select
                  value={linkedIncomeId}
                  onChange={(e) => setLinkedIncomeId(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all appearance-none"
                  style={{
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="">{t("linkedIncomePlaceholder")}</option>
                  {uniqueIncomes.map((income) => (
                    <option key={income.id} value={income.id}>
                      {income.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-[12px] text-red-500 px-1">{error}</p>}

      {/* Success */}
      {success && <p className="text-[12px] text-green-600 px-1">{success}</p>}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 min-h-[44px] py-3 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 text-white"
          style={{ background: "var(--color-accent-primary)" }}
        >
          {isPending ? <Spinner size="md" color="white" /> : t("saveBucket")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-3 font-bold rounded-xl transition-all"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
