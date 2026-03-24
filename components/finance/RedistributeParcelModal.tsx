"use client";

import { useState, useTransition, useMemo } from "react";
import { FiX, FiLock, FiCheck } from "react-icons/fi";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import { redistributeInstallments } from "@/app/[locale]/tools/finance/(protected)/actions";
import type { FinanceItem } from "@/types/finance";
import { useModalA11y } from "@/hooks/useModalA11y";

type Props = {
  installments: FinanceItem[];
  onClose: () => void;
  locale: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function RedistributeParcelModal({
  installments,
  onClose,
  locale,
}: Props) {
  const t = useTranslations("FinanceForm");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const modalRef = useModalA11y(true, onClose);

  const sorted = useMemo(
    () =>
      [...installments].sort(
        (a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0),
      ),
    [installments],
  );

  const [editedValues, setEditedValues] = useState<Record<string, string>>(
    () => {
      const map: Record<string, string> = {};
      for (const item of sorted) {
        if (item.status === "pending") {
          map[item.id] = String(item.amount);
        }
      }
      return map;
    },
  );

  const originalTotalCents = useMemo(
    () => sorted.reduce((sum, item) => sum + Math.round(item.amount * 100), 0),
    [sorted],
  );

  const nonPendingTotalCents = useMemo(
    () =>
      sorted
        .filter((item) => item.status !== "pending")
        .reduce((sum, item) => sum + Math.round(item.amount * 100), 0),
    [sorted],
  );

  const currentSumCents = useMemo(() => {
    let sum = nonPendingTotalCents;
    for (const item of sorted) {
      if (item.status === "pending") {
        const val = parseFloat(editedValues[item.id] || "0");
        sum += Number.isNaN(val) ? 0 : Math.round(val * 100);
      }
    }
    return sum;
  }, [sorted, editedValues, nonPendingTotalCents]);

  const differenceCents = originalTotalCents - currentSumCents;
  const isValid = Math.abs(differenceCents) <= 1;

  const groupId = sorted[0]?.installmentGroupId;

  const handleValueChange = (itemId: string, raw: string) => {
    setEditedValues((prev) => ({ ...prev, [itemId]: raw }));
  };

  const handleConfirm = async () => {
    if (!isValid || !groupId) return;
    setError(null);

    const pendingItems = sorted.filter((item) => item.status === "pending");
    const newAmounts = pendingItems.map((item) => {
      const val = parseFloat(editedValues[item.id] || "0");
      return Number.isNaN(val) ? 0 : val;
    });

    const res = await redistributeInstallments(groupId, newAmounts, locale);

    if (res && "error" in res && res.error) {
      setError(res.error as string);
      return;
    }

    setSuccess(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => onClose(), 1200);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className="relative w-full sm:w-[480px] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border flex flex-col"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {t("redistributeTitle")}
          </h2>
          <button
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-text-muted)" }}
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Scrollable installment list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-3 min-h-0">
          {sorted.map((item) => {
            const isPending = item.status === "pending";
            const index = item.installmentIndex ?? 0;
            const total = item.installmentTotal ?? sorted.length;

            return (
              <div
                key={item.id}
                className="rounded-xl border p-3"
                style={{
                  background: isPending
                    ? "var(--color-surface-raised)"
                    : "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  opacity: isPending ? 1 : 0.7,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {index}/{total}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {item.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editedValues[item.id] ?? ""}
                        onChange={(e) =>
                          handleValueChange(item.id, e.target.value)
                        }
                        className="w-full sm:w-32 p-2 rounded-lg border-2 border-transparent focus:border-blue-500 outline-none text-sm text-right"
                        style={{
                          background: "var(--color-surface)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <FiLock
                          size={13}
                          style={{ color: "var(--color-text-muted)" }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {formatCurrency(item.amount)}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--color-accent-subtle)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {t("redistributeReadonly")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky summary + button */}
        <div
          className="mt-4 pt-4 border-t space-y-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* Summary rows */}
          <div className="grid grid-cols-2 gap-y-1 text-sm">
            <span style={{ color: "var(--color-text-muted)" }}>
              {t("redistributeOriginalTotal")}
            </span>
            <span
              className="text-right font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {formatCurrency(originalTotalCents / 100)}
            </span>

            <span style={{ color: "var(--color-text-muted)" }}>
              {t("redistributeCurrentSum")}
            </span>
            <span
              className="text-right font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {formatCurrency(currentSumCents / 100)}
            </span>

            <span style={{ color: "var(--color-text-muted)" }}>
              {t("redistributeDifference")}
            </span>
            <span
              className={`text-right font-bold ${
                isValid ? "text-green-600" : "text-red-500"
              }`}
            >
              {formatCurrency(differenceCents / 100)}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg p-2 flex items-center gap-2">
              <FiCheck size={16} />
              {t("redistributeSuccess")}
            </div>
          )}

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || isPending || success}
            className="w-full py-3 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Spinner size="md" color="white" />
            ) : (
              t("redistributeConfirm")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
