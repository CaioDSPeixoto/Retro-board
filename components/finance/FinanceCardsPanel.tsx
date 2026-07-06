"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { FinanceCard, FinanceItem } from "@/types/finance";
import {
  createFinanceCard,
  deleteFinanceCard,
  updateFinanceCard,
} from "@/app/[locale]/tools/finance/(protected)/actions";
import { getCardStatementCycle } from "@/lib/finance/card-cycle";
import { calculateCardDashboard } from "@/lib/finance/card-dashboard";
import { getMonthRange } from "@/lib/finance/utils";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Spinner from "@/components/ui/Spinner";
import { mapFinanceItem } from "@/lib/finance/schema";

type Props = {
  cards: FinanceCard[];
  items: FinanceItem[];
  boardId?: string | null;
  locale: string;
  currentMonth: string;
  sessionUserId: string;
};

export default function FinanceCardsPanel({
  cards,
  items,
  boardId,
  locale,
  currentMonth,
  sessionUserId,
}: Props) {
  const t = useTranslations("FinancePage");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<FinanceCard | null>(null);
  const [cardItems, setCardItems] = useState<FinanceItem[]>(items);

  useEffect(() => {
    if (cards.length === 0) {
      setCardItems(items);
      return;
    }

    const ranges = cards.map((card) => {
      const cycle = getCardStatementCycle(currentMonth, card.closingDay, card.dueDay);
      if (cycle) return cycle;
      const monthRange = getMonthRange(currentMonth);
      return { start: monthRange.start, end: monthRange.end };
    });
    const start = ranges.reduce((min, range) => (range.start < min ? range.start : min), ranges[0].start);
    const end = ranges.reduce((max, range) => (range.end > max ? range.end : max), ranges[0].end);

    let itemsQuery = query(
      collection(db, "finance_items"),
      where("date", ">=", start),
      where("date", "<=", end),
    );

    itemsQuery = boardId
      ? query(itemsQuery, where("boardId", "==", boardId))
      : query(itemsQuery, where("userId", "==", sessionUserId));

    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const docs: FinanceItem[] = [];
        snapshot.forEach((docSnap) => {
          docs.push(mapFinanceItem(docSnap));
        });
        setError(null);
        setCardItems(docs);
      },
      () => setError(t("errors.realtimeUnavailable")),
    );

    return () => unsubscribe();
  }, [boardId, cards, currentMonth, items, sessionUserId]);

  const cardsDashboard = useMemo(
    () => calculateCardDashboard(cards, cardItems, currentMonth),
    [cardItems, cards, currentMonth],
  );

  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">
          {t("cardCreateTitle")}
        </h2>
        <p className="-mt-2 mb-3 text-xs text-[var(--color-text-muted)]">
          {t("cardProfileScopeHint")}
        </p>

        {error && (
          <p className="text-xs finance-danger-text mb-3">{error}</p>
        )}

        <form
          key={editingCard?.id || "new-card"}
          action={async (fd) => {
            setError(null);
            fd.set("locale", locale);

            if (editingCard) fd.set("id", editingCard.id);

            const res = editingCard
              ? await updateFinanceCard(fd)
              : await createFinanceCard(fd);
            if (res && "error" in res && res.error) {
              setError(res.error as string);
              return;
            }

            startTransition(() => router.refresh());
            formRef.current?.reset();
            setEditingCard(null);
          }}
          id="finance-card-form"
          ref={formRef}
          className="grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <input
            name="name"
            required
            defaultValue={editingCard?.name || ""}
            placeholder={t("cardNamePlaceholder")}
            aria-label={t("cardNamePlaceholder")}
            className="md:col-span-2 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="lastDigits"
            maxLength={4}
            inputMode="numeric"
            pattern="[0-9]{1,4}"
            defaultValue={editingCard?.lastDigits || ""}
            placeholder={t("cardLastDigitsPlaceholder")}
            aria-label={t("cardLastDigitsPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="limit"
            type="number"
            step="0.01"
            min="0"
            defaultValue={editingCard?.limit ?? ""}
            placeholder={t("cardLimitPlaceholder")}
            aria-label={t("cardLimitPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="closingDay"
            type="number"
            min={1}
            max={31}
            defaultValue={editingCard?.closingDay ?? ""}
            placeholder={t("cardClosingDayPlaceholder")}
            aria-label={t("cardClosingDayPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="dueDay"
            type="number"
            min={1}
            max={31}
            defaultValue={editingCard?.dueDay ?? ""}
            placeholder={t("cardDueDayPlaceholder")}
            aria-label={t("cardDueDayPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <select
            name="mode"
            defaultValue={editingCard?.mode || "credit"}
            aria-label={t("cardModeLabel")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          >
            <option value="credit">{t("cardModeCredit")}</option>
            <option value="debit">{t("cardModeDebit")}</option>
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="md:col-span-6 py-2.5 rounded-xl bg-[var(--color-accent-primary)] text-white text-sm font-bold hover:bg-[var(--color-accent-hover)] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending && <Spinner size="sm" color="white" />}
            {editingCard ? t("cardUpdateButton") : t("cardCreateButton")}
          </button>
          {editingCard && (
            <button
              type="button"
              onClick={() => {
                setEditingCard(null);
                formRef.current?.reset();
              }}
              className="md:col-span-6 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
            >
              {t("cardCancelEditButton")}
            </button>
          )}
        </form>
      </section>

      {cards.length > 0 && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("cardsDashboardTitle")}
            </h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              {t("cardsDashboardHint", { count: cardsDashboard.cardsWithLimit })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-[var(--color-surface-raised)] p-3">
              <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                {t("cardsTotalLimitLabel")}
              </p>
              <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
                {currency(cardsDashboard.totalLimit)}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-raised)] p-3">
              <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                {t("cardsUsedLimitLabel")}
              </p>
              <p className="mt-1 text-lg font-bold finance-danger-text">
                {currency(cardsDashboard.totalUsed)}
              </p>
              {cardsDashboard.totalLimit > 0 && (
                <p className={`mt-0.5 text-[11px] font-semibold ${cardsDashboard.totalUsagePercent > 100 ? "finance-danger-text" : "text-[var(--color-text-muted)]"}`}>
                  {t("cardsUsagePercentLabel", { percent: cardsDashboard.totalUsagePercent.toFixed(0) })}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-[var(--color-surface-raised)] p-3">
              <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                {cardsDashboard.totalAvailable >= 0
                  ? t("cardsAvailableLimitLabel")
                  : t("cardsOverLimitLabel")}
              </p>
              <p className={`mt-1 text-lg font-bold ${cardsDashboard.totalAvailable >= 0 ? "finance-success-text" : "finance-danger-text"}`}>
                {currency(Math.abs(cardsDashboard.totalAvailable))}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
            {t("cardsEmpty")}
          </div>
        ) : (
          cards.map((card) => {
            const used = cardsDashboard.cardTotals.get(card.id) ?? 0;
            const cycle = getCardStatementCycle(currentMonth, card.closingDay, card.dueDay);
            const limit = Number(card.limit || 0);
            const usagePercent = limit > 0 ? (used / limit) * 100 : 0;
            const progressPercent = Math.min(usagePercent, 100);
            const available = limit - used;

            return (
              <article
                key={card.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                      {card.name}
                    </h3>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {card.mode === "credit" ? t("cardModeCredit") : t("cardModeDebit")}
                      {card.lastDigits ? ` - final ${card.lastDigits}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[var(--color-accent-primary)]">
                    {currency(used)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                  {cycle
                    ? t("cardStatementCycleLabel", { start: cycle.start, end: cycle.end })
                    : t("cardMonthUsageLabel")}
                </p>
                {!cycle && (
                  <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">
                    {t("cardMonthUsageHint")}
                  </p>
                )}

                {limit > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] mb-1">
                      <span>{t("cardLimitLabel")}: {currency(limit)}</span>
                      <span className={usagePercent > 100 ? "finance-danger-text font-bold" : ""}>
                        {usagePercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${usagePercent > 100 ? "bg-[var(--color-danger-strong)]" : "bg-[var(--color-accent-primary)]"}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className={`mt-1 text-[11px] font-semibold ${available >= 0 ? "text-[var(--color-text-secondary)]" : "finance-danger-text"}`}>
                      {available >= 0
                        ? t("cardAvailableLimitLabel")
                        : t("cardOverLimitLabel")}: {currency(Math.abs(available))}
                    </p>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-[var(--color-surface-raised)] p-2">
                    <p className="text-[var(--color-text-muted)]">{t("cardClosingDayLabel")}</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {card.closingDay || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-surface-raised)] p-2">
                    <p className="text-[var(--color-text-muted)]">{t("cardDueDayLabel")}</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {card.dueDay || "-"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCard(card)}
                    aria-label={t("cardEditButton")}
                    className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)]"
                  >
                    {t("cardEditButton")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(async () => {
                        const fd = new FormData();
                        fd.set("id", card.id);
                        fd.set("locale", locale);
                        const res = await deleteFinanceCard(fd);
                        if (res && "error" in res && res.error) {
                          setError(res.error as string);
                          return;
                        }
                        router.refresh();
                      });
                    }}
                    disabled={isPending}
                    aria-label={t("cardDeleteButton")}
                    className="rounded-lg border finance-danger-soft px-2.5 py-1.5 text-[11px] font-semibold disabled:opacity-60"
                  >
                    {t("cardDeleteButton")}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
