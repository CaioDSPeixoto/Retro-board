"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FinanceBoard } from "@/types/finance";
import { createFinanceBoard } from "@/app/[locale]/tools/finance/(protected)/actions";
import FinanceJoinByCode from "./(protected)/FinanceJoinByCode";

type Props = {
  locale: string;
  currentMonth: string;
  initialBoards: FinanceBoard[];
};

export default function FinanceBoardsClient({ locale, currentMonth, initialBoards }: Props) {
  const tBoards = useTranslations("FinanceBoards");
  const router = useRouter();

  const [boards, setBoards] = useState<FinanceBoard[]>(initialBoards);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const membersLabel = useMemo(() => {
    return (count: number) => (count > 1 ? "membros" : "membro");
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) return;

    setCreating(true);
    setError(null);

    const res = await createFinanceBoard(trimmed, locale);

    if (res && "error" in res && res.error) {
      setError(tBoards("errors.general"));
      setCreating(false);
      return;
    }

    const boardId = (res as any).boardId as string;

    router.push(`/${locale}/tools/finance?boardId=${boardId}&month=${currentMonth}`);
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
      <h1 className="text-3xl font-extrabold text-blue-600 mb-4">
        <span className="bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
          {tBoards("title")}
        </span>
      </h1>

      <p className="text-gray-700 mb-8">{tBoards("description")}</p>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="mb-8 bg-white border border-blue-100 rounded-xl shadow-sm p-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-3 md:flex-row">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tBoards("newBoardLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tBoards("newBoardPlaceholder")}
              required
              autoComplete="off"
              className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-200 mt-2 md:mt-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? tBoards("createButton") + "..." : tBoards("createButton")}
            </button>
          </div>
        </form>
      </div>

      {boards.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            {tBoards("emptyTitle")}
          </h2>
          <p className="text-sm text-gray-500">{tBoards("emptySubtitle")}</p>
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
                  {board.isPersonal ? tBoards("personalTag") : tBoards("sharedTag")}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {board.memberIds?.length || 1} {membersLabel(board.memberIds?.length || 1)}
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  {tBoards("openBoard")} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <FinanceJoinByCode locale={locale}/>
    </div>
  );
}