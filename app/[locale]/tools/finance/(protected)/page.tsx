// app/[locale]/tools/finance/(protected)/page.tsx
export const dynamic = "force-dynamic";

import { format } from "date-fns";
import FinanceClientPage from "./FinanceClientPage";
import FinanceBoardsClient from "../FinanceBoardsClient";
import {
  getFinanceItemsData,
  getCategoriesData,
  getBoardsData,
} from "./data";
import type { FinanceBoard, FinanceItem } from "@/types/finance";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

type SearchParams = {
  month?: string;
  boardId?: string;
  from?: string;
  to?: string;
};

function getMonthList(fromMonth: string, toMonth: string): string[] {
  // ambos no formato "yyyy-MM"
  const [fyStr, fmStr] = fromMonth.split("-");
  const [tyStr, tmStr] = toMonth.split("-");

  let fy = parseInt(fyStr, 10);
  let fm = parseInt(fmStr, 10);
  let ty = parseInt(tyStr, 10);
  let tm = parseInt(tmStr, 10);

  // normaliza se vier invertido
  if (fy > ty || (fy === ty && fm > tm)) {
    [fy, ty] = [ty, fy];
    [fm, tm] = [tm, fm];
  }

  const months: string[] = [];
  let cy = fy;
  let cm = fm;

  while (cy < ty || (cy === ty && cm <= tm)) {
    const mStr = String(cm).padStart(2, "0");
    months.push(`${cy}-${mStr}`);

    cm += 1;
    if (cm > 12) {
      cm = 1;
      cy += 1;
    }
  }

  return months;
}

export default async function FinancePage({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ locale: string }>;
}) {
  const { month, boardId, from, to } = await searchParams;
  const { locale } = await params;

  const currentMonth = month || format(new Date(), "yyyy-MM");

  const sessionUserId = await getSession();
  const safeSessionUserId = sessionUserId ?? "";

  const boards: FinanceBoard[] = await getBoardsData();

  if (boardId) {
    const boardExists = boards.some((b) => b.id === boardId);
    if (!boardExists) {
      redirect(`/${locale}/tools/finance`);
    }
  }

  // LISTAGEM DE QUADROS (sem boardId)
  if (!boardId) {
    return (
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <FinanceBoardsClient
          locale={locale}
          currentMonth={currentMonth}
          initialBoards={boards}
          sessionUserId={safeSessionUserId}
        />
      </div>
    );
  }

  // VISUALIZAÇÃO DO QUADRO (com boardId) — mês ou intervalo
  let items: FinanceItem[] = [];
  const rangeFrom = from || null;
  const rangeTo = to || null;

  if (rangeFrom && rangeTo) {
    const months = getMonthList(rangeFrom, rangeTo);
    const results = await Promise.all(
      months.map((m) => getFinanceItemsData(m, boardId)),
    );
    items = results.flat();
  } else {
    items = await getFinanceItemsData(currentMonth, boardId);
  }

  const categories = await getCategoriesData();

  return (
    <FinanceClientPage
      initialItems={items}
      initialCategories={categories}
      currentMonth={currentMonth}
      locale={locale}
      boards={boards}
      currentBoardId={boardId}
      sessionUserId={safeSessionUserId}
    />
  );
}
