// app/[locale]/tools/finance/(protected)/incomes/page.tsx
export const dynamic = "force-dynamic";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getFinanceItemsData } from "../data";
import FinanceItemCard from "@/components/finance/FinanceItemCard";
import { getTranslations } from "next-intl/server";

export default async function IncomesPage({
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
  const incomeItems = items.filter((i) => i.type === "income");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">
        {t("incomesTitle")} –{" "}
        {format(new Date(`${currentMonth}-01`), "MMMM yyyy", {
          locale: ptBR,
        })}
      </h1>

      {incomeItems.length === 0 ? (
        <p className="text-gray-400 text-sm">
          {t("noIncomesThisMonth")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {incomeItems.map((item) => (
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
