// app/[locale]/tools/finance/(protected)/page.tsx
export const dynamic = "force-dynamic";

import { format } from "date-fns";
import FinanceClientPage from "@/components/finance/FinanceClientPage";
import FinanceBoardsClient from "@/components/finance/FinanceBoardsClient";
import {
  getFinanceItemsData,
  getCategoriesData,
  getBoardsData,
  getCashBalanceBeforeMonth,
  getPreviousMonthCashBalance,
  getFinanceCardsData,
  getFinanceDebtsData,
  getFinanceDebtPaymentsData,
  getFinanceFixedTemplatesData,
} from "./data";
import type { FinanceBoard, FinanceItem, FinanceCard, FinanceDebt, FinanceDebtPayment } from "@/types/finance";
import type { FinanceStatus } from "@/types/finance";
import { getSession } from "@/lib/auth/session";
import { createProjectedFixedItems } from "@/lib/finance/fixed-projection";
import { redirect } from "next/navigation";

type SearchParams = {
  month?: string;
  boardId?: string;
  from?: string;
  to?: string;
  view?: string;
  due?: string;
  status?: string;
  accountsDue?: string;
  accountsStatus?: string;
};

const FINANCE_VIEWS = new Set(["list", "planning", "debts", "metrics", "cards"]);
const LIST_DUE_FILTERS = new Set(["all", "overdue", "today", "tomorrow", "next7", "next30", "open", "settled"]);
const LIST_STATUS_FILTERS = new Set(["all", "paid", "pending", "partial", "moved"]);

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

function getProjectionMonthList(startMonth: string, monthsCount: number): string[] {
  const [year, month] = startMonth.split("-").map(Number);
  return Array.from({ length: monthsCount }, (_, index) => {
    const date = new Date(year, month - 1 + index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

export default async function FinancePage({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ locale: string }>;
}) {
  const { month, boardId, from, to, view, due, status, accountsDue, accountsStatus } = await searchParams;
  const { locale } = await params;

  const currentMonth = month || format(new Date(), "yyyy-MM");
  const initialView = FINANCE_VIEWS.has(view || "") ? view : "list";
  const requestedDue = due || accountsDue;
  const requestedStatus = status || accountsStatus;
  const initialDueFilter = LIST_DUE_FILTERS.has(requestedDue || "") ? requestedDue : "all";
  const initialStatusFilter = LIST_STATUS_FILTERS.has(requestedStatus || "")
    ? requestedStatus
    : "all";

  const sessionUserId = await getSession();
  const safeSessionUserId = sessionUserId ?? "";

  const boards: FinanceBoard[] = await getBoardsData(safeSessionUserId);

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
      months.map((m) => getFinanceItemsData(m, boardId, safeSessionUserId)),
    );
    items = results.flat();
  } else {
    items = await getFinanceItemsData(currentMonth, boardId, safeSessionUserId);
  }

  // Paralleliza queries independentes
  const [categories, previousCashBalance, previousMonthCashBalance, cards, debts, debtPayments, fixedTemplates] = await Promise.all([
    getCategoriesData(boardId, safeSessionUserId),
    getCashBalanceBeforeMonth(currentMonth, boardId, safeSessionUserId),
    getPreviousMonthCashBalance(currentMonth, boardId, safeSessionUserId),
    getFinanceCardsData(boardId, safeSessionUserId),
    getFinanceDebtsData(boardId, safeSessionUserId),
    getFinanceDebtPaymentsData(boardId, safeSessionUserId),
    getFinanceFixedTemplatesData(boardId, safeSessionUserId),
  ]);

  const projectionMonths = getProjectionMonthList(currentMonth, 6);
  const projectionResults = await Promise.all(
    projectionMonths.map((projectionMonth) =>
      projectionMonth === currentMonth
        ? Promise.resolve(items.filter((item) => item.date.slice(0, 7) === currentMonth))
        : getFinanceItemsData(projectionMonth, boardId, safeSessionUserId),
    ),
  );
  const existingProjectionItems = projectionResults.flat();
  const projectedFixedItems = createProjectedFixedItems(
    fixedTemplates,
    projectionMonths,
    existingProjectionItems,
    safeSessionUserId,
  );
  const projectionItems = [...existingProjectionItems, ...projectedFixedItems];

  return (
    <div className="max-w-5xl mx-auto px-6 pb-10 pt-4">
      <FinanceClientPage
        initialItems={items}
        initialCategories={categories}
        currentMonth={currentMonth}
        locale={locale}
        boards={boards}
        currentBoardId={boardId}
        sessionUserId={safeSessionUserId}
        previousCashBalance={previousCashBalance}
        previousMonthCashBalance={previousMonthCashBalance}
        initialCards={cards}
        initialDebts={debts}
        initialDebtPayments={debtPayments}
        initialProjectionItems={projectionItems}
        initialView={initialView as "list" | "planning" | "debts" | "metrics" | "cards"}
        initialDueFilter={initialDueFilter as "all" | "overdue" | "today" | "tomorrow" | "next7" | "next30" | "open" | "settled"}
        initialStatusFilter={initialStatusFilter as "all" | FinanceStatus}
      />
    </div>
  );
}
