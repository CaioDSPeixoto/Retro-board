"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiPlus, FiTarget, FiTrash2 } from "react-icons/fi";
import type { FinanceSavingsGoal } from "@/types/finance";
import {
  createSavingsGoal,
  updateGoalAmount,
  deleteSavingsGoal,
} from "@/app/[locale]/tools/finance/(protected)/goals-actions";
import Spinner from "@/components/ui/Spinner";
import PrivacyValue from "@/components/finance/PrivacyValue";

type Props = {
  goals: FinanceSavingsGoal[];
  boardId: string;
  locale: string;
};

export default function FinanceGoalsPanel({ goals, boardId, locale }: Props) {
  const t = useTranslations("FinancePage");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleCreate = (fd: FormData) => {
    setError(null);
    fd.set("boardId", boardId);
    fd.set("locale", locale);
    startTransition(async () => {
      const res = await createSavingsGoal(fd);
      if (res && "error" in res && res.error) {
        setError(res.error as string);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  };

  const handleAddAmount = (goalId: string, currentAmount: number) => {
    const input = prompt(t("goalsAddAmountPrompt"));
    if (!input) return;
    const add = parseFloat(input.replace(",", "."));
    if (Number.isNaN(add) || add <= 0) return;

    startTransition(async () => {
      await updateGoalAmount(goalId, currentAmount + add, locale);
      router.refresh();
    });
  };

  const handleDelete = (goalId: string) => {
    if (!confirm(t("goalsDeleteConfirm"))) return;
    startTransition(async () => {
      await deleteSavingsGoal(goalId, locale);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          {t("goalsEmpty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {goals.map((goal) => {
            const percent = goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;
            const isComplete = goal.currentAmount >= goal.targetAmount;

            return (
              <article
                key={goal.id}
                className={`rounded-2xl border p-4 ${isComplete ? "finance-success-soft" : "bg-[var(--color-surface)] border-[var(--color-border)]"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                      {goal.icon && <span>{goal.icon}</span>}
                      <span className="truncate">{goal.title}</span>
                    </h3>
                    {goal.deadline && (
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {t("goalsDeadline", { date: goal.deadline })}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id)}
                    disabled={isPending}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-danger-strong)] transition disabled:opacity-40"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <PrivacyValue>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {currency(goal.currentAmount)}
                      </span>
                    </PrivacyValue>
                    <PrivacyValue>
                      <span className="text-[var(--color-text-muted)]">
                        {currency(goal.targetAmount)}
                      </span>
                    </PrivacyValue>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all ${isComplete ? "bg-[var(--color-success-strong)]" : "bg-[var(--color-accent-primary)]"}`}
                      style={{ width: `${Math.max(percent, 2)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1 text-right font-semibold">
                    {percent.toFixed(0)}%
                  </p>
                </div>

                {!isComplete && (
                  <button
                    type="button"
                    onClick={() => handleAddAmount(goal.id, goal.currentAmount)}
                    disabled={isPending}
                    className="mt-2 w-full py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-accent-text)] hover:bg-[var(--color-accent-subtle)] transition disabled:opacity-50"
                  >
                    {t("goalsAddAmount")}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Create form */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center gap-2 mb-3 text-[var(--color-text-secondary)]">
          <FiTarget size={17} />
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">{t("goalsCreateTitle")}</h2>
        </div>
        <form ref={formRef} action={handleCreate} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            name="title"
            required
            placeholder={t("goalsNamePlaceholder")}
            className="md:col-span-2 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="targetAmount"
            type="number"
            step="0.01"
            min="1"
            required
            placeholder={t("goalsTargetPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="deadline"
            type="date"
            placeholder={t("goalsDeadlinePlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="icon"
            maxLength={4}
            placeholder="🎯"
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)] w-20"
          />
          <button
            type="submit"
            disabled={isPending}
            className="md:col-span-3 py-2.5 rounded-xl bg-[var(--color-accent-primary)] text-white text-sm font-bold hover:bg-[var(--color-accent-hover)] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending && <Spinner size="sm" color="white" />}
            <FiPlus size={16} />
            {t("goalsCreateButton")}
          </button>
        </form>
        {error && <p className="mt-2 text-xs finance-danger-text">{error}</p>}
      </section>
    </div>
  );
}
