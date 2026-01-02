import { getFinanceItems } from "./actions";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import FinanceClientPage from "./FinanceClientPage"; // Vamos separar o Client Component

export default async function FinancePage({
  searchParams,
  params
}: {
  searchParams: Promise<{ month?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { month } = await searchParams;
  const { locale } = await params;

  // Define mês atual se não vier na URL
  const currentMonth = month || format(new Date(), "yyyy-MM");

  // Busca dados
  const items = await getFinanceItems(currentMonth);

  return (
    <FinanceClientPage
      initialItems={items}
      currentMonth={currentMonth}
      locale={locale}
    />
  );
}