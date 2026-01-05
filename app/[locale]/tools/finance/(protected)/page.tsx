// app/[locale]/tools/finance/page.tsx
export const dynamic = "force-dynamic";

import { format } from "date-fns";
import FinanceClientPage from "./FinanceClientPage";
import {
  getFinanceItemsData,
  getCategoriesData,
  getBoardsData,
} from "./data";
import { createFinanceBoard } from "./actions";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import FinanceInvitesPanel from "./FinanceInvitesPanel";
import FinanceJoinByCode from "./FinanceJoinByCode";
import { FinanceBoard } from "@/types/finance";

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

  const boards: FinanceBoard[] = await getBoardsData();

  // ====== LISTAGEM DE QUADROS (SEM boardId) ======
  if (!boardId) {
    const tBoards = await getTranslations("FinanceBoards");

    async function handleCreateBoard(formData: FormData) {
      "use server";
      const name = (formData.get("name") as string) || "";
      const trimmed = name.trim();

      // validação: exige nome preenchido
      if (!trimmed) {
        // não redireciona, deixa o browser mostrar a validação nativa (required)
        return;
      }

      const res = await createFinanceBoard(trimmed, locale);

      if (res && "boardId" in res && res.boardId) {
        redirect(
          `/${locale}/tools/finance?boardId=${res.boardId}&month=${currentMonth}`,
        );
      }

      redirect(`/${locale}/tools/finance`);
    }

    return (
      <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
        <h1 className="text-3xl font-extrabold text-blue-600 mb-4">
          <span className="bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
            {tBoards("title")}
          </span>
        </h1>

        <p className="text-gray-700 mb-8">{tBoards("description")}</p>

        {/* Criar novo quadro */}
        <div className="mb-8 bg-white border border-blue-100 rounded-xl shadow-sm p-4">
          <form
            action={handleCreateBoard}
            className="flex flex-col gap-3 md:flex-row"
          >
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {tBoards("newBoardLabel")}
              </label>
              <input
                type="text"
                name="name"
                placeholder={tBoards("newBoardPlaceholder")}
                required
                autoComplete="off"
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-200 mt-2 md:mt-0"
              >
                {tBoards("createButton")}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de quadros */}
        {boards.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              {tBoards("emptyTitle")}
            </h2>
            <p className="text-sm text-gray-500">
              {tBoards("emptySubtitle")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/${locale}/tools/finance?boardId=${board.id}&month=${currentMonth}`}
                className="border border-blue-200 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 transition bg-white flex flex-col justify-between"
              >
                <div>
                  <h2 className="font-semibold text-lg text-gray-800 mb-1 truncate">
                    {board.name}
                  </h2>
                  <p className="text-xs text-gray-500 mb-2">
                    {board.isPersonal
                      ? tBoards("personalTag")
                      : tBoards("sharedTag")}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {board.memberIds?.length || 1}{" "}
                    {board.memberIds && board.memberIds.length > 1
                      ? "membros"
                      : "membro"}
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {tBoards("openBoard")} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Entrar com código de quadro */}
        <FinanceJoinByCode locale={locale} />

        {/* Convites e solicitações (para mim e para meus boards) */}
        <FinanceInvitesPanel locale={locale} />
      </div>
    );
  }

  // ====== VISUALIZAÇÃO DO QUADRO (COM boardId) ======
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
    />
  );
}
