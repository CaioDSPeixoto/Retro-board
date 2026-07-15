"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiEdit3,
  FiActivity,
  FiPlus,
  FiRepeat,
  FiTrendingDown,
} from "react-icons/fi";
import type { FinanceDebt, FinanceDebtPayment, FinanceDebtStatus, FinanceDebtType } from "@/types/finance";
import {
  createFinanceDebt,
  createDebtInstallmentItems,
  payFinanceDebt,
  renegotiateFinanceDebt,
} from "@/app/[locale]/tools/finance/(protected)/actions";
import Spinner from "@/components/ui/Spinner";
import PrivacyValue from "@/components/finance/PrivacyValue";
import { calculateDebtPayoff, type DebtStrategyType } from "@/lib/finance/debt-strategy";

type Props = {
  debts: FinanceDebt[];
  payments?: FinanceDebtPayment[];
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

function addMonthsKey(monthKey: string, monthsToAdd: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + monthsToAdd, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthShortLabel(monthKey: string) {
  const [, month] = monthKey.split("-");
  return month;
}

export default function FinanceDebtsPanel({ debts, payments = [], boardId, locale }: Props) {
  const t = useTranslations("FinancePage");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [renegotiatingDebtId, setRenegotiatingDebtId] = useState<string | null>(null);
  const [splittingDebtId, setSplittingDebtId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);
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
        if (debt.dueDate.slice(0, 7) === currentMonth) {
          acc.dueThisMonthBalance += debt.currentBalance;
          acc.dueThisMonthCount += 1;
        }
        if ((debt.installments || 0) > 1) {
          acc.installmentBalance += debt.currentBalance;
          acc.installmentCount += 1;
        }
        return acc;
      },
      {
        openBalance: 0,
        overdueBalance: 0,
        dueThisMonthBalance: 0,
        installmentBalance: 0,
        openCount: 0,
        overdueCount: 0,
        dueThisMonthCount: 0,
        installmentCount: 0,
        paidCount: 0,
      },
    );
  }, [currentMonth, debts, today]);

  const debtByType = useMemo(() => {
    return DEBT_TYPES.map((type) => {
      const typeDebts = debts.filter((debt) => debt.type === type && debt.status !== "paid");
      const balance = typeDebts.reduce((total, debt) => total + debt.currentBalance, 0);
      return { type, balance, count: typeDebts.length };
    }).filter((entry) => entry.balance > 0);
  }, [debts]);

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

  const urgentDebt = useMemo(
    () => sortedDebts.find((debt) => debt.status !== "paid") ?? null,
    [sortedDebts],
  );

  const maxTypeBalance = debtByType.reduce(
    (max, entry) => Math.max(max, entry.balance),
    0,
  );
  const debtEvolution = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => addMonthsKey(currentMonth, index - 5));
    const currentOpenBalance = debts
      .filter((debt) => debt.status !== "paid")
      .reduce((total, debt) => total + debt.currentBalance, 0);
    const trackedPayments = payments.reduce((total, payment) => total + payment.amount, 0);
    const trackedStartBalance = currentOpenBalance + trackedPayments;
    let accumulatedPayments = 0;

    return months.map((month) => {
      const paidInMonth = payments
        .filter((payment) => payment.paidAt.slice(0, 7) === month)
        .reduce((total, payment) => total + payment.amount, 0);
      accumulatedPayments += paidInMonth;
      return {
        month,
        paid: paidInMonth,
        balance: Math.max(trackedStartBalance - accumulatedPayments, 0),
      };
    });
  }, [currentMonth, debts, payments]);
  const maxEvolutionBalance = debtEvolution.reduce(
    (max, entry) => Math.max(max, entry.balance),
    0,
  );

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

  const handleRenegotiateDebt = (formData: FormData) => {
    setError(null);
    setMessage(null);
    const id = String(formData.get("id") || "");
    setRenegotiatingDebtId(id);
    startTransition(async () => {
      formData.set("locale", locale);
      const result = await renegotiateFinanceDebt(formData);
      if (result && "error" in result && result.error) {
        setError(String(result.error));
        return;
      }

      setMessage(t("debtRenegotiateSuccess"));
      setRenegotiatingDebtId(null);
      router.refresh();
    });
  };

  const handleCreateInstallments = (formData: FormData) => {
    setError(null);
    setMessage(null);
    const id = String(formData.get("id") || "");
    setSplittingDebtId(id);
    startTransition(async () => {
      formData.set("locale", locale);
      const result = await createDebtInstallmentItems(formData);
      if (result && "error" in result && result.error) {
        setError(String(result.error));
        return;
      }

      setMessage(t("debtInstallmentsCreateSuccess"));
      setSplittingDebtId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiTrendingDown size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("debtOpenBalanceTitle")}
            </h2>
          </div>
          <p className="text-2xl font-extrabold finance-danger-text">
            <PrivacyValue>{currency(summary.openBalance)}</PrivacyValue>
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
            <PrivacyValue>{currency(summary.overdueBalance)}</PrivacyValue>
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

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiCalendar size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("debtDueThisMonthTitle")}
            </h2>
          </div>
          <p className="text-2xl font-extrabold text-[var(--color-text-primary)]">
            <PrivacyValue>{currency(summary.dueThisMonthBalance)}</PrivacyValue>
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {t("debtDueThisMonthHint", { count: summary.dueThisMonthCount })}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiRepeat size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("debtInstallmentFutureTitle")}
            </h2>
          </div>
          <p className="text-2xl font-extrabold text-[var(--color-text-primary)]">
            <PrivacyValue>{currency(summary.installmentBalance)}</PrivacyValue>
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {t("debtInstallmentFutureHint", { count: summary.installmentCount })}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiAlertTriangle size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("debtPriorityTitle")}
            </h2>
          </div>
          {urgentDebt ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">
                    {urgentDebt.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {debtTypeLabels[urgentDebt.type]} • {t("debtDueDateLabel")}: {urgentDebt.dueDate}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${statusTone(urgentDebt.status)}`}>
                  {debtStatusLabels[urgentDebt.status]}
                </span>
              </div>
              <p className="mt-3 text-lg font-extrabold finance-danger-text">
                <PrivacyValue>{currency(urgentDebt.currentBalance)}</PrivacyValue>
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {urgentDebt.status === "overdue" || urgentDebt.dueDate < today
                  ? t("debtPriorityOverdueHint")
                  : t("debtPriorityUpcomingHint")}
              </p>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
              {t("debtPriorityEmpty")}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiBarChart2 size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("debtByTypeTitle")}
            </h2>
          </div>
          {debtByType.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
              {t("debtByTypeEmpty")}
            </p>
          ) : (
            <div className="space-y-2">
              {debtByType.map((entry) => {
                const percent = maxTypeBalance > 0 ? (entry.balance / maxTypeBalance) * 100 : 0;
                return (
                  <div key={entry.type} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {debtTypeLabels[entry.type]}
                      </span>
                      <span className="font-semibold finance-danger-text">
                        <PrivacyValue>{currency(entry.balance)}</PrivacyValue>
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
                      <div
                        className="h-2 rounded-full bg-[var(--color-accent-primary)]"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                      {t("debtByTypeCount", { count: entry.count })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-3 flex items-center gap-2 text-[var(--color-text-secondary)]">
          <FiActivity size={17} />
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
            {t("debtEvolutionTitle")}
          </h2>
        </div>
        {payments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
            {t("debtEvolutionEmpty")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {debtEvolution.map((entry) => {
              const height = maxEvolutionBalance > 0 ? Math.max((entry.balance / maxEvolutionBalance) * 100, 6) : 6;
              return (
                <div key={entry.month} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
                  <div className="flex h-28 items-end justify-center rounded-lg bg-[var(--color-surface)] px-2">
                    <div
                      className="w-full rounded-t-lg bg-[var(--color-accent-primary)]"
                      style={{ height: `${height}%` }}
                      title={currency(entry.balance)}
                    />
                  </div>
                  <p className="mt-2 text-center text-xs font-bold text-[var(--color-text-primary)]">
                    {monthShortLabel(entry.month)}
                  </p>
                  <p className="mt-1 text-center text-[11px] font-semibold finance-danger-text">
                    <PrivacyValue>{currency(entry.balance)}</PrivacyValue>
                  </p>
                  {entry.paid > 0 && (
                    <p className="mt-1 text-center text-[10px] text-[var(--color-text-muted)]">
                      <PrivacyValue>{t("debtEvolutionPaidLabel", { value: currency(entry.paid) })}</PrivacyValue>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
                    <p className="font-bold finance-danger-text"><PrivacyValue>{currency(debt.currentBalance)}</PrivacyValue></p>
                  </div>
                  <div className="rounded-lg bg-[var(--color-surface)] p-2">
                    <p className="text-[var(--color-text-muted)]">{t("debtOriginalAmountLabel")}</p>
                    <p className="font-bold text-[var(--color-text-primary)]"><PrivacyValue>{currency(debt.originalAmount)}</PrivacyValue></p>
                  </div>
                </div>

                {debt.originalAmount > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[11px] text-[var(--color-text-muted)]">
                      <span>{t("debtProgressLabel")}</span>
                      <span>
                        {Math.min(100, Math.max(0, ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100)).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
                      <div
                        className="h-2 rounded-full bg-[var(--color-success-strong)]"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {(debt.category || debt.notes || debt.installments) && (
                  <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                    {[debt.category, debt.installments ? t("debtInstallmentsLabel", { count: debt.installments }) : "", debt.notes]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}

                {debt.status !== "paid" && (
                  <>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setRenegotiatingDebtId((current) => (current === debt.id ? null : debt.id))}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)]"
                      >
                        <FiEdit3 size={13} />
                        {t("debtRenegotiateButton")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplittingDebtId((current) => (current === debt.id ? null : debt.id))}
                        disabled={!!debt.linkedInstallmentGroupId}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FiRepeat size={13} />
                        {debt.linkedInstallmentGroupId ? t("debtInstallmentsLinkedButton") : t("debtCreateInstallmentsButton")}
                      </button>
                    </div>

                    {renegotiatingDebtId === debt.id && (
                      <form action={handleRenegotiateDebt} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
                        <input type="hidden" name="id" value={debt.id} />
                        <input
                          name="currentBalance"
                          inputMode="decimal"
                          defaultValue={String(debt.currentBalance).replace(".", ",")}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)]"
                          required
                        />
                        <input
                          name="dueDate"
                          type="date"
                          defaultValue={debt.dueDate}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)]"
                          required
                        />
                        <input
                          name="installments"
                          type="number"
                          min="1"
                          defaultValue={debt.installments ?? ""}
                          placeholder={t("debtInstallmentsPlaceholder")}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                        />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-accent-primary)] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                        >
                          {isPending && renegotiatingDebtId === debt.id && <Spinner size="sm" color="white" />}
                          {t("debtSaveRenegotiationButton")}
                        </button>
                        <input
                          name="notes"
                          defaultValue={debt.notes ?? ""}
                          placeholder={t("debtNotesPlaceholder")}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] sm:col-span-4"
                        />
                      </form>
                    )}

                    {splittingDebtId === debt.id && !debt.linkedInstallmentGroupId && (
                      <form action={handleCreateInstallments} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <input type="hidden" name="id" value={debt.id} />
                        <input
                          name="installments"
                          type="number"
                          min="1"
                          max="60"
                          defaultValue={debt.installments ?? 1}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)]"
                          required
                        />
                        <input
                          name="firstDueDate"
                          type="date"
                          defaultValue={debt.dueDate}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)]"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-accent-primary)] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                        >
                          {isPending && splittingDebtId === debt.id && <Spinner size="sm" color="white" />}
                          {t("debtGenerateInstallmentsButton")}
                        </button>
                      </form>
                    )}

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
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Debt Strategy Calculator */}
      <DebtStrategySection debts={debts} />
    </div>
  );
}

function DebtStrategySection({ debts }: { debts: FinanceDebt[] }) {
  const t = useTranslations("FinancePage");
  const [open, setOpen] = useState(false);
  const [monthlyExtra, setMonthlyExtra] = useState(500);
  const [strategy, setStrategy] = useState<DebtStrategyType>("avalanche");

  const openDebts = debts.filter((d) => d.status !== "paid" && d.currentBalance > 0);

  const result = useMemo(
    () => calculateDebtPayoff(openDebts, monthlyExtra, strategy),
    [openDebts, monthlyExtra, strategy],
  );

  const altResult = useMemo(
    () => calculateDebtPayoff(openDebts, monthlyExtra, strategy === "avalanche" ? "snowball" : "avalanche"),
    [openDebts, monthlyExtra, strategy],
  );

  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (openDebts.length < 2) return null;

  if (!open) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
          <h2 className="text-sm font-bold text-[var(--color-accent-text)]">{t("debtStrategyTitle")}</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{t("debtStrategyHint")}</p>
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">{t("debtStrategyTitle")}</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:underline">
          {t("debtStrategyClose")}
        </button>
      </div>

      {/* Strategy selector */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setStrategy("avalanche")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${strategy === "avalanche" ? "border-[var(--color-accent-primary)] text-[var(--color-accent-text)] bg-[var(--color-accent-subtle)]" : "border-[var(--color-border)] text-[var(--color-text-secondary)]"}`}
        >
          {t("debtStrategyAvalanche")}
        </button>
        <button
          type="button"
          onClick={() => setStrategy("snowball")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${strategy === "snowball" ? "border-[var(--color-accent-primary)] text-[var(--color-accent-text)] bg-[var(--color-accent-subtle)]" : "border-[var(--color-border)] text-[var(--color-text-secondary)]"}`}
        >
          {t("debtStrategySnowball")}
        </button>
      </div>

      {/* Monthly budget input */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">
          {t("debtStrategyMonthlyBudget")}
        </label>
        <input
          type="number"
          min={100}
          step={50}
          value={monthlyExtra}
          onChange={(e) => setMonthlyExtra(Math.max(100, Number(e.target.value)))}
          className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
        />
        <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{t("debtStrategyMonthlyHint")}</p>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-3">
        <div className="rounded-xl bg-[var(--color-surface-raised)] p-3 text-center">
          <p className="text-[10px] text-[var(--color-text-muted)]">{t("debtStrategyMonths")}</p>
          <p className="text-xl font-extrabold text-[var(--color-text-primary)]">{result.months}</p>
        </div>
        <div className="rounded-xl bg-[var(--color-surface-raised)] p-3 text-center">
          <p className="text-[10px] text-[var(--color-text-muted)]">{t("debtStrategyTotalPaid")}</p>
          <p className="text-sm font-bold finance-danger-text">
            <PrivacyValue>{currency(result.totalPaid)}</PrivacyValue>
          </p>
        </div>
        <div className="rounded-xl bg-[var(--color-surface-raised)] p-3 text-center">
          <p className="text-[10px] text-[var(--color-text-muted)]">{t("debtStrategyInterest")}</p>
          <p className="text-sm font-bold text-[var(--color-text-primary)]">
            <PrivacyValue>{currency(result.totalInterest)}</PrivacyValue>
          </p>
        </div>
      </div>

      {/* Comparison */}
      {altResult.months !== result.months && (
        <p className="text-[11px] text-[var(--color-text-muted)] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2">
          {t("debtStrategyComparison", {
            alt: strategy === "avalanche" ? t("debtStrategySnowball") : t("debtStrategyAvalanche"),
            months: String(altResult.months),
            interest: currency(altResult.totalInterest),
          })}
        </p>
      )}
    </section>
  );
}
