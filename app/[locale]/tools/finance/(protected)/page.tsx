// app/[locale]/tools/finance/(protected)/page.tsx
export const dynamic = "force-dynamic";

import { format } from "date-fns";
import FinanceClientPage from "./FinanceClientPage";
import FinanceBoardsClient from "../FinanceBoardsClient";
import { getFinanceItemsData, getCategoriesData, getBoardsData, getInvitesData } from "./data";
import type { FinanceBoard } from "@/types/finance";
import { getSession } from "@/lib/auth/session";

export default async function FinancePage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ month?: string; boardId?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { month, boardId } = await searchParams;
  const { locale } = await params;

  const currentMonth = month || format(new Date(), "yyyy-MM");

  const sessionUserId = await getSession();
  const safeSessionUserId = sessionUserId ?? "";

  const boards: FinanceBoard[] = await getBoardsData();

  // LISTAGEM DE QUADROS (sem boardId)
  if (!boardId) {
    return (
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <FinanceBoardsClient
          locale={locale}
          currentMonth={currentMonth}
          initialBoards={boards}
        />
      </div>
    );
  }

  // VISUALIZAÇÃO DO QUADRO (com boardId)
  const [items, categories] = await Promise.all([
    getFinanceItemsData(currentMonth, boardId),
    getCategoriesData(),
  ]);

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
