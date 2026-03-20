// app/[locale]/tools/finance/(protected)/expenses/page.tsx
export const dynamic = "force-dynamic";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getFinanceItemsData } from "../data";
import FinanceItemCard from "@/components/finance/FinanceItemCard";
import { getTranslations } from "next-intl/server";

export default async function ExpensesPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ month?: string; boardId?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { month, boardId } = await searchParams;
  const { locale } = await params;
  const t = await getTranslations("Finance");

  const currentMonth = month || format(new Date(), "yyyy-MM");
  const items = await getFinanceItemsData(currentMonth, boardId);
  const expenseItems = items.filter((i) => i.type === "expense");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
        {t("expensesTitle")} –{" "}
        {format(new Date(`${currentMonth}-01`), "MMMM yyyy", {
          locale: ptBR,
        })}
      </h1>

      {expenseItems.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {t("noExpensesThisMonth")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {expenseItems.map((item) => (
            <FinanceItemCard
              key={item.id}
              item={item}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
