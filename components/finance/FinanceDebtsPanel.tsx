"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiAlertTriangle, FiCheckCircle, FiCreditCard, FiPlus, FiTrendingDown } from "react-icons/fi";
import type { FinanceDebt, FinanceDebtStatus, FinanceDebtType } from "@/types/finance";
import {
  createFinanceDebt,
  payFinanceDebt,
} from "@/app/[locale]/tools/finance/(protected)/actions";
import Spinner from "@/components/ui/Spinner";

type Props = {
  debts: FinanceDebt[];
  boardId: string;
  locale: string;
};

const DEBT_TYPES: FinanceDebtType[] = [
  "card",
  "invoice",
  "house_bill",
  "loan",
  "person",
  "financing",
  "other",
];

function statusTone(status: FinanceDebtStatus) {
  if (status === "paid") return "finance-success-soft";
  if (status === "overdue") return "finance-danger-soft";
  if (status === "renegotiated") return "finance-warning-soft";
  return "finance-info-soft";
}

export default function FinanceDebtsPanel({ debts, boardId, locale }: Props) {
  const t = useTranslations("FinancePage");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const debtTypeLabels: Record<FinanceDebtType, string> = {
    card: t("debtType_card"),
    invoice: t("debtType_invoice"),
    house_bill: t("debtType_house_bill"),
    loan: t("debtType_loan"),
    person: t("debtType_person"),
    financing: t("debtType_financing"),
    other: t("debtType_other"),
  };
  const debtStatusLabels: Record<FinanceDebtStatus, string> = {
    active: t("debtStatus_active"),
    overdue: t("debtStatus_overdue"),
    paid: t("debtStatus_paid"),
    renegotiated: t("debtStatus_renegotiated"),
  };

  const summary = useMemo(() => {
    return debts.reduce(
      (acc, debt) => {
        if (debt.status === "paid") {
          acc.paidCount += 1;
          return acc;
        }

        acc.openCount += 1;
        acc.openBalance += debt.currentBalance;
        if (debt.status === "overdue" || debt.dueDate < today) {
          acc.overdueCount += 1;
          acc.overdueBalance += debt.currentBalance;
        }
        return acc;
      },
      {
        openBalance: 0,
        overdueBalance: 0,
        openCount: 0,
        overdueCount: 0,
        paidCount: 0,
      },
    );
  }, [debts, today]);

  const sortedDebts = useMemo(() => {
    const statusOrder: Record<FinanceDebtStatus, number> = {
      overdue: 0,
      active: 1,
      renegotiated: 2,
      paid: 3,
    };
    return [...debts].sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [debts]);

  const handleCreateDebt = (formData: FormData) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      formData.set("boardId", boardId);
      formData.set("locale", locale);
      const result = await createFinanceDebt(formData);
      if (result && "error" in result && result.error) {
        setError(String(result.error));
        return;
      }

      formRef.current?.reset();
      setMessage(t("debtCreateSuccess"));
      router.refresh();
    });
  };

  const handlePayDebt = (formData: FormData) => {
    setError(null);
    setMessage(null);
    const id = String(formData.get("id") || "");
    setPaymentDebtId(id);
    startTransition(async () => {
      formData.set("locale", locale);
      const result = await payFinanceDebt(formData);
      if (result && "error" in result && result.error) {
        setError(String(result.error));
        setPaymentDebtId(null);
        return;
      }

      setMessage(t("debtPaymentSuccess"));
      setPaymentDebtId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiTrendingDown size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("debtOpenBalanceTitle")}
            </h2>
          </div>
          <p className="text-2xl font-extrabold finance-danger-text">
            {currency(summary.openBalance)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {t("debtOpenBalanceHint", { count: summary.openCount })}
          </p>
        </div>

        <div className={`rounded-2xl border p-4 ${summary.overdueCount > 0 ? "finance-danger-soft" : "finance-success-soft"}`}>
          <div className="mb-2 flex items-center gap-2">
            <FiAlertTriangle size={17} />
            <h2 className="text-sm font-bold">{t("debtOverdueTitle")}</h2>
          </div>
          <p className="text-2xl font-extrabold">
            {currency(summary.overdueBalance)}
          </p>
          <p className="mt-1 text-xs">
            {t("debtOverdueHint", { count: summary.overdueCount })}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiCheckCircle size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("debtPaidTitle")}
            </h2>
          </div>
          <p className="text-2xl font-extrabold finance-success-text">
            {summary.paidCount}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {t("debtPaidHint")}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-3 flex items-center gap-2 text-[var(--color-text-secondary)]">
          <FiPlus size={17} />
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
            {t("debtCreateTitle")}
          </h2>
        </div>
        <form ref={formRef} action={handleCreateDebt} className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <input
            name="name"
            placeholder={t("debtNamePlaceholder")}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] md:col-span-2"
            required
          />
          <select
            name="type"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text-primary)]"
            defaultValue="other"
          >
            {DEBT_TYPES.map((type) => (
              <option key={type} value={type}>
                {debtTypeLabels[type]}
              </option>
            ))}
          </select>
          <input
            name="originalAmount"
            inputMode="decimal"
            placeholder={t("debtOriginalAmountPlaceholder")}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            required
          />
          <input
            name="currentBalance"
            inputMode="decimal"
            placeholder={t("debtCurrentBalancePlaceholder")}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
          <input
            name="dueDate"
            type="date"
            defaultValue={today}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text-primary)]"
            required
          />
          <input
            name="installments"
            type="number"
            min="1"
            placeholder={t("debtInstallmentsPlaceholder")}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
          <input
            name="category"
            placeholder={t("debtCategoryPlaceholder")}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] md:col-span-2"
          />
          <input
            name="notes"
            placeholder={t("debtNotesPlaceholder")}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] md:col-span-2"
          />
          <button
            type="submit"
            disabled={isPending || !boardId}
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent-primary)] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && !paymentDebtId && <Spinner size="sm" color="white" />}
            {t("debtCreateButton")}
          </button>
        </form>
        {error && <p className="mt-2 text-xs finance-danger-text">{error}</p>}
        {message && <p className="mt-2 text-xs finance-success-text">{message}</p>}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">
          {t("debtListTitle")}
        </h2>
        {sortedDebts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
            {t("debtListEmpty")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {sortedDebts.map((debt) => (
              <article
                key={debt.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FiCreditCard className="shrink-0 text-[var(--color-text-muted)]" size={15} />
                      <h3 className="truncate text-sm font-bold text-[var(--color-text-primary)]">
                        {debt.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                      {debtTypeLabels[debt.type]} • {t("debtDueDateLabel")}: {debt.dueDate}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${statusTone(debt.status)}`}>
                    {debtStatusLabels[debt.status]}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-[var(--color-surface)] p-2">
                    <p className="text-[var(--color-text-muted)]">{t("debtCurrentBalanceLabel")}</p>
                    <p className="font-bold finance-danger-text">{currency(debt.currentBalance)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--color-surface)] p-2">
                    <p className="text-[var(--color-text-muted)]">{t("debtOriginalAmountLabel")}</p>
                    <p className="font-bold text-[var(--color-text-primary)]">{currency(debt.originalAmount)}</p>
                  </div>
                </div>

                {(debt.category || debt.notes || debt.installments) && (
                  <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                    {[debt.category, debt.installments ? t("debtInstallmentsLabel", { count: debt.installments }) : "", debt.notes]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}

                {debt.status !== "paid" && (
                  <form action={handlePayDebt} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="id" value={debt.id} />
                    <input
                      name="amount"
                      inputMode="decimal"
                      placeholder={t("debtPaymentAmountPlaceholder")}
                      className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                      required
                    />
                    <input
                      name="paidAt"
                      type="date"
                      defaultValue={today}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)]"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-success-strong)] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {paymentDebtId === debt.id && <Spinner size="sm" color="white" />}
                      {t("debtPayButton")}
                    </button>
                  </form>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
