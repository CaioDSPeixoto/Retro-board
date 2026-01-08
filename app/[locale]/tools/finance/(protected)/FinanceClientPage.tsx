// app/[locale]/tools/finance/(protected)/FinanceClientPage.tsx
"use client";

import type { FinanceBoard, FinanceItem } from "@/types/finance";
import { useState, useMemo, useEffect } from "react";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiUsers,
  FiChevronDown,
} from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import FinanceItemCard from "@/components/finance/FinanceItemCard";
import FinanceFormModal from "@/components/finance/FinanceFormModal";
import FinanceMetricsPanel from "@/components/finance/FinanceMetricsPanel";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useTranslations } from "next-intl";

import { sendInviteByEmail } from "./invite-actions";

type Props = {
  initialItems: FinanceItem[];
  initialCategories: string[];
  currentMonth: string;
  locale: string;
  boards: FinanceBoard[];
  currentBoardId?: string | null;
  sessionUserId: string; // vem do server (cookie)
};

export default function FinanceClientPage({
  initialItems,
  initialCategories,
  currentMonth,
  locale,
  boards,
  currentBoardId,
  sessionUserId,
}: Props) {
  const t = useTranslations("FinancePage");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState<string>(t("defaultUserName"));
  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const [showMetrics, setShowMetrics] = useState(false);
  const [overdueOpen, setOverdueOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.displayName) setUserName(user.displayName.split(" ")[0]);
      else if (user?.email) setUserName(user.email.split("@")[0]);
      else setUserName(t("defaultUserName"));
    });
    return () => unsubscribe();
  }, [t]);

  const currentBoard = useMemo(
    () => boards.find((b) => b.id === currentBoardId),
    [boards, currentBoardId],
  );

  const boardName = currentBoardId
    ? currentBoard?.name || t("allBoardsLabel")
    : t("allBoardsLabel");

  const isOwner = !!currentBoard && currentBoard.ownerId === sessionUserId;

  const currentDate = parseISO(currentMonth + "-01");

  const handlePrevMonth = () => {
    const newMonth = format(subMonths(currentDate, 1), "yyyy-MM");
    const params = new URLSearchParams(searchParams?.toString());
    params.set("month", newMonth);
    if (currentBoardId) params.set("boardId", currentBoardId);
    else params.delete("boardId");
    router.push(`/${locale}/tools/finance?${params.toString()}`);
  };

  const handleNextMonth = () => {
    const newMonth = format(addMonths(currentDate, 1), "yyyy-MM");
    const params = new URLSearchParams(searchParams?.toString());
    params.set("month", newMonth);
    if (currentBoardId) params.set("boardId", currentBoardId);
    else params.delete("boardId");
    router.push(`/${locale}/tools/finance?${params.toString()}`);
  };

  const handleBoardChange = (boardId: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (boardId) params.set("boardId", boardId);
    else params.delete("boardId");
    params.set("month", currentMonth);
    router.push(`/${locale}/tools/finance?${params.toString()}`);
    setShowMetrics(false); // volta pra lista ao trocar de quadro
  };

  const totals = useMemo(() => {
    return initialItems.reduce(
      (acc, item) => {
        const isPaid = item.status === "paid";

        if (item.type === "income") {
          if (isPaid) acc.incomes += item.amount;
          else acc.incomesForecast += item.amount;
        } else {
          if (isPaid) acc.expenses += item.amount;
          else acc.expensesForecast += item.amount;
        }

        return acc;
      },
      { incomes: 0, expenses: 0, incomesForecast: 0, expensesForecast: 0 },
    );
  }, [initialItems]);

  const balance = totals.incomes - totals.expenses;

  const todayStr = new Date().toISOString().split("T")[0];

  const overdueItems = useMemo(
    () =>
      initialItems.filter(
        (item) =>
          !item.isSynthetic &&
          item.date < todayStr &&
          item.status !== "paid" &&
          item.date.startsWith(currentMonth),
      ),
    [initialItems, todayStr, currentMonth],
  );

  const overdueTotal = useMemo(
    () =>
      overdueItems.reduce((sum, item) => {
        const openAmount = item.amount - (item.paidAmount || 0);
        return sum + Math.max(openAmount, 0);
      }, 0),
    [overdueItems],
  );

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: FinanceItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBoard) return;

    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    setInviteLoading(true);
    setInviteMessage(null);
    setInviteError(null);

    const res = await sendInviteByEmail(currentBoard.id, email, locale);

    if (res && "error" in res && res.error) {
      setInviteError(res.error as string);
    } else {
      setInviteEmail("");
      setInviteMessage(t("inviteSent"));
    }

    setInviteLoading(false);
  };

  return (
    <div className="pb-24">
      {/* SELECT DE QUADRO */}
      {boards.length > 0 && (
        <div className="px-6 pt-4 pb-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("boardLabel")}
          </label>
          <select
            value={currentBoardId ?? ""}
            onChange={(e) => handleBoardChange(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t("allBoardsLabel")}</option>
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-blue-600 pt-6 pb-12 px-6 rounded-b-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />

        {/* mantém valores usados sem aparecer */}
        <span className="sr-only">
          {userName} {boardName}
        </span>

        {/* CONTROLE DE MÊS */}
        <div className="mb-4">
          <div className="w-full bg-blue-700/40 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center justify-between shadow-sm">
            <button
              onClick={handlePrevMonth}
              aria-label="Mês anterior"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition flex items-center justify-center"
            >
              <FiChevronLeft />
            </button>

            <div className="flex-1 text-center">
              <span className="inline-flex items-center justify-center text-sm font-semibold capitalize tracking-wide">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              aria-label="Próximo mês"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition flex items-center justify-center"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-blue-100 text-sm mb-1">{t("balanceTitle")}</p>
          <h2 className="text-4xl font-extrabold">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(balance)}
          </h2>
        </div>

        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
            <p className="text-xs text-blue-100 mb-1">{t("entriesLabel")}</p>
            <p className="text-lg font-bold text-green-300">
              +{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.incomes)}
            </p>

            <p className="text-xs text-blue-100 mb-1">
              {t("entriesForecastLabel")}
            </p>
            <p className="text-lg font-bold text-green-300">
              +{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.incomesForecast)}
            </p>
          </div>

          <div className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
            <p className="text-xs text-blue-100 mb-1">{t("exitsLabel")}</p>
            <p className="text-lg font-bold text-red-300">
              -{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.expenses)}
            </p>

            <p className="text-xs text-blue-100 mb-1">
              {t("exitsForecastLabel")}
            </p>
            <p className="text-lg font-bold text-red-300">
              -{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.expensesForecast)}
            </p>
          </div>
        </div>
      </div>

      {/* SHARE (só dono) */}
      {currentBoard && isOwner && (
        <div className="px-6 mt-4 mb-6">
          <div className="bg-white border border-blue-100 rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => setShareOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <FiUsers className="text-blue-600" size={18} />
                <span className="text-sm font-semibold text-gray-800">
                  {t("shareTitle")}
                </span>
              </div>
              <FiChevronDown
                className={`text-gray-400 transition-transform ${shareOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {shareOpen && (
              <div className="border-t border-blue-50 px-4 pb-4 pt-2">
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {t("shareCodeLabel")}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentBoard.id}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-700"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    {t("shareCodeHint")}
                  </p>
                </div>

                <form
                  onSubmit={handleInviteByEmail}
                  className="mt-3 flex flex-col gap-3 md:flex-row"
                >
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {t("shareEmailLabel")}
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder={t("shareEmailPlaceholder")}
                      className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-900"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={inviteLoading || !inviteEmail.trim()}
                      className="w-full md:w-auto px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-md shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1 md:mt-0"
                    >
                      {inviteLoading ? t("sending") : t("shareEmailButton")}
                    </button>
                  </div>
                </form>

                {inviteMessage && (
                  <p className="mt-2 text-xs text-green-600">{inviteMessage}</p>
                )}
                {inviteError && (
                  <p className="mt-2 text-xs text-red-600">{inviteError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LISTA / MÉTRICAS */}
      <div className="px-6 mt-2">
        <div className="flex justify-between items-center mb-4 px-2">
          <div>
            <h3 className="font-bold text-gray-700">
              {showMetrics ? "Métricas do mês" : t("transactionsTitle")}
            </h3>
            {!showMetrics && (
              <span className="text-xs text-gray-400">
                {t("transactionsCount", { count: initialItems.length })}
              </span>
            )}
          </div>

          <div className="inline-flex bg-gray-100 rounded-xl p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setShowMetrics(false)}
              className={`px-3 py-1 rounded-lg transition-all ${!showMetrics
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
                }`}
            >
              Lista
            </button>
            <button
              type="button"
              onClick={() => setShowMetrics(true)}
              className={`px-3 py-1 rounded-lg transition-all ${showMetrics
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
                }`}
            >
              Métricas
            </button>
          </div>
        </div>

                {/* CONTAS EM ATRASO (colapse, apenas na aba Lista) */}
        {!showMetrics && overdueItems.length > 0 && (
          <div className="mb-4">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl shadow-sm">
              {/* Cabeçalho clicável */}
              <button
                type="button"
                onClick={() => setOverdueOpen((prev) => !prev)}
                className="w-full px-3 py-2 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 text-left">
                  <p className="text-xs text-amber-800 font-semibold">
                    {t("overdueTitle")}
                  </p>
                  <p className="text-[11px] text-amber-700">
                    {t("overdueSubtitle", { count: overdueItems.length })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-amber-800 whitespace-nowrap">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(overdueTotal)}
                  </p>
                  <FiChevronDown
                    className={`text-amber-800 transition-transform ${
                      overdueOpen ? "rotate-180" : ""
                    }`}
                    size={16}
                  />
                </div>
              </button>

              {/* Lista expandida */}
              {overdueOpen && (
                <div className="border-t border-amber-100 px-3 pb-3 pt-2 max-h-52 overflow-y-auto space-y-2">
                  {overdueItems.map((item) => {
                    const openAmount = item.amount - (item.paidAmount || 0);

                    return (
                      <div
                        key={item.id}
                        className="flex justify-between items-center bg-white/70 rounded-xl px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {format(new Date(item.date), "dd 'de' MMM, yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] text-amber-700 font-semibold">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Math.max(openAmount, 0))}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {t("openAmountLabel")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {showMetrics ? (
          <FinanceMetricsPanel
            items={initialItems}
            currentMonth={currentMonth}
          />
        ) : initialItems.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 mb-2">{t("noTransactions")}</p>
            <button
              onClick={handleOpenCreateModal}
              className="text-blue-600 font-bold text-sm"
            >
              {t("addNow")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {initialItems.map((item) => (
              <FinanceItemCard
                key={item.id}
                item={item}
                locale={locale}
                onEdit={handleEditItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* BOTÃO FLOAT */}
      <button
        onClick={handleOpenCreateModal}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-400 flex items-center justify-center hover:scale-110 active:scale-95 transition z-40"
        aria-label={t("addNow")}
      >
        <FiPlus size={28} />
      </button>

      {/* MODAL */}
      <FinanceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        locale={locale}
        initialCategories={initialCategories}
        initialItem={editingItem}
        boardId={currentBoardId ?? null}
      />
    </div>
  );
}
