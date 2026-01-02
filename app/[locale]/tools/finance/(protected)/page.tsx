export const dynamic = "force-dynamic";

import { getFinanceItems, getCategories } from "./actions";
import { format } from "date-fns";
import FinanceClientPage from "./FinanceClientPage";

export default async function FinancePage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ month?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { month } = await searchParams;
  const { locale } = await params;

  const currentMonth = month || format(new Date(), "yyyy-MM");

  const [items, categories] = await Promise.all([
    getFinanceItems(currentMonth),
    getCategories(),
  ]);

  return (
    <FinanceClientPage
      initialItems={items}
      initialCategories={categories}
      currentMonth={currentMonth}
      locale={locale}
    />
  );
}
