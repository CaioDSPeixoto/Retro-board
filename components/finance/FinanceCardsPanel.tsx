"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { FinanceCard, FinanceItem } from "@/types/finance";
import { createFinanceCard } from "@/app/[locale]/tools/finance/(protected)/actions";
import Spinner from "@/components/ui/Spinner";

type Props = {
  cards: FinanceCard[];
  items: FinanceItem[];
  boardId?: string | null;
  locale: string;
};

export default function FinanceCardsPanel({ cards, items, boardId, locale }: Props) {
  const t = useTranslations("FinancePage");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cardTotals = useMemo(() => {
    const map = new Map<string, number>();

    for (const item of items) {
      if (item.type !== "expense" || item.status === "moved") continue;
      const key = item.cardId || item.cardName;
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + Number(item.amount || 0));
    }

    return map;
  }, [items]);

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
          <p className="text-xs text-red-500 mb-3">{error}</p>
        )}

        <form
          action={async (fd) => {
            setError(null);
            fd.set("locale", locale);
            if (boardId) fd.set("boardId", boardId);

            const res = await createFinanceCard(fd);
            if (res && "error" in res && res.error) {
              setError(res.error as string);
              return;
            }

            startTransition(() => router.refresh());
            (document.getElementById("finance-card-form") as HTMLFormElement | null)?.reset();
          }}
          id="finance-card-form"
          className="grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <input
            name="name"
            required
            placeholder={t("cardNamePlaceholder")}
            className="md:col-span-2 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="lastDigits"
            maxLength={4}
            inputMode="numeric"
            placeholder={t("cardLastDigitsPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="limit"
            type="number"
            step="0.01"
            min="0"
            placeholder={t("cardLimitPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="closingDay"
            type="number"
            min={1}
            max={31}
            placeholder={t("cardClosingDayPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <input
            name="dueDay"
            type="number"
            min={1}
            max={31}
            placeholder={t("cardDueDayPlaceholder")}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          />
          <select
            name="mode"
            defaultValue="credit"
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)]"
          >
            <option value="credit">{t("cardModeCredit")}</option>
            <option value="debit">{t("cardModeDebit")}</option>
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="md:col-span-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending && <Spinner size="sm" color="white" />}
            {t("cardCreateButton")}
          </button>
        </form>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
            {t("cardsEmpty")}
          </div>
        ) : (
          cards.map((card) => {
            const used = cardTotals.get(card.id) ?? cardTotals.get(card.name) ?? 0;
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

                {limit > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] mb-1">
                      <span>{t("cardLimitLabel")}: {currency(limit)}</span>
                      <span>{percent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${percent}%` }} />
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
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
