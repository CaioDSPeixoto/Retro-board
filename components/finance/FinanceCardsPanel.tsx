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
import { getCardStatementCycle, isDateInCycle } from "@/lib/finance/card-cycle";
import { getMonthRange } from "@/lib/finance/utils";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Spinner from "@/components/ui/Spinner";

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
          const data = docSnap.data() as any;
          docs.push({
            id: docSnap.id,
            userId: data.userId,
            boardId: data.boardId,
            title: data.title,
            amount: data.amount,
            date: data.date,
            type: data.type,
            status: data.status,
            category: data.category,
            createdAt: data.createdAt,
            isFixed: data.isFixed,
            isSynthetic: data.isSynthetic,
            createdBy: data.createdBy,
            createdByName: data.createdByName,
            paidAmount: data.paidAmount,
            openAmount: data.openAmount,
            carriedFromMonth: data.carriedFromMonth,
            carriedFromItemId: data.carriedFromItemId,
            fixedTemplateId: data.fixedTemplateId,
            installmentGroupId: data.installmentGroupId,
            installmentIndex: data.installmentIndex,
            installmentTotal: data.installmentTotal,
            originalAmount: data.originalAmount,
            cardId: data.cardId,
            cardName: data.cardName,
            cardMode: data.cardMode,
            cardLastDigits: data.cardLastDigits,
          });
        });
        setError(null);
        setCardItems(docs);
      },
      () => setError(t("errors.realtimeUnavailable")),
    );

    return () => unsubscribe();
  }, [boardId, cards, currentMonth, items, sessionUserId]);

  const cardTotals = useMemo(() => {
    const map = new Map<string, number>();

    for (const card of cards) {
      const cycle = getCardStatementCycle(currentMonth, card.closingDay, card.dueDay);
      const used = cardItems.reduce((total, item) => {
        if (item.type !== "expense" || item.status === "moved") return total;
        const matchesCard = item.cardId === card.id || (!item.cardId && item.cardName === card.name);
        if (!matchesCard) return total;
        if (cycle && !isDateInCycle(item.date, cycle)) return total;
        return total + Number(item.amount || 0);
      }, 0);

      map.set(card.id, used);
    }

    return map;
  }, [cardItems, cards, currentMonth]);

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

        {error && (
          <p className="text-xs finance-danger-text mb-3">{error}</p>
        )}

        <form
          key={editingCard?.id || "new-card"}
          action={async (fd) => {
            setError(null);
            fd.set("locale", locale);
            if (boardId) fd.set("boardId", boardId);

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
            className="md:col-span-2 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="lastDigits"
            maxLength={4}
            inputMode="numeric"
            pattern="[0-9]{1,4}"
            defaultValue={editingCard?.lastDigits || ""}
            placeholder={t("cardLastDigitsPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="limit"
            type="number"
            step="0.01"
            min="0"
            defaultValue={editingCard?.limit ?? ""}
            placeholder={t("cardLimitPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="closingDay"
            type="number"
            min={1}
            max={31}
            defaultValue={editingCard?.closingDay ?? ""}
            placeholder={t("cardClosingDayPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="dueDay"
            type="number"
            min={1}
            max={31}
            defaultValue={editingCard?.dueDay ?? ""}
            placeholder={t("cardDueDayPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <select
            name="mode"
            defaultValue={editingCard?.mode || "credit"}
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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
            {t("cardsEmpty")}
          </div>
        ) : (
          cards.map((card) => {
            const used = cardTotals.get(card.id) ?? 0;
            const cycle = getCardStatementCycle(currentMonth, card.closingDay, card.dueDay);
            const limit = Number(card.limit || 0);
            const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

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
                      {card.lastDigits ? ` · final ${card.lastDigits}` : ""}
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
                      <span>{percent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div className="h-2 rounded-full bg-[var(--color-accent-primary)]" style={{ width: `${percent}%` }} />
                    </div>
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
