// app/[locale]/tools/finance/(protected)/categories/[category]/page.tsx
export const dynamic = "force-dynamic";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getFinanceItemsData } from "../../data";
import FinanceItemCard from "@/components/finance/FinanceItemCard";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function CategoryPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ month?: string; boardId?: string }>;
  params: Promise<{ locale: string; category: string }>;
}) {
  const { month, boardId } = await searchParams;
  const { locale, category } = await params;
  const t = await getTranslations("Finance");

  const decodedCategory = decodeURIComponent(category);
  const currentMonth = month || format(new Date(), "yyyy-MM");

  const items = await getFinanceItemsData(currentMonth, boardId);
  const categoryItems = items.filter((i) => i.category === decodedCategory);

  // monta o link de "voltar para o quadro" preservando mês e boardId
  const qs = new URLSearchParams();
  qs.set("month", currentMonth);
  if (boardId) {
    qs.set("boardId", boardId);
  }
  const backHref = `/${locale}/tools/finance?${qs.toString()}`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      {/* Botão de voltar para o quadro */}
      <div className="mb-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <span className="text-lg leading-none">←</span>
          <span>Voltar para o quadro</span>
        </Link>
      </div>

      <h1 className="text-xl font-bold text-gray-800">
        {decodedCategory} –{" "}
        {format(new Date(`${currentMonth}-01`), "MMMM yyyy", {
          locale: ptBR,
        })}
      </h1>

      {categoryItems.length === 0 ? (
        <p className="text-gray-400 text-sm">
          {t("noCategoryThisMonth")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {categoryItems.map((item) => (
            <FinanceItemCard key={item.id} item={item} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
