"use client";

import type { FinanceBoard, FinanceItem } from "@/types/finance";
import { useState, useMemo, useEffect, useTransition } from "react";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiList,
  FiSettings,
  FiAlertCircle,
  FiShare2,
} from "react-icons/fi";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import FinanceItemCard from "@/components/finance/FinanceItemCard";
import FinanceFormModal from "@/components/finance/FinanceFormModal";
import FinanceMetricsPanel from "@/components/finance/FinanceMetricsPanel";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useTranslations } from "next-intl";

import { sendInviteByEmail } from "../../app/[locale]/tools/finance/(protected)/invite-actions";

type Props = {
  initialItems: FinanceItem[];
  initialCategories: string[];
  currentMonth: string;
  locale: string;
  boards: FinanceBoard[];
  currentBoardId?: string | null;
  sessionUserId: string;
};

function normalizeForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function getMonthRange(month: string): { start: string; end: string } {
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);

  const start = `${yearStr}-${monthStr}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const end = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

  return { start, end };
}

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
  const [isRoutePending, startRouteTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState<string>(t("defaultUserName"));
  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);
  const [items, setItems] = useState<FinanceItem[]>(initialItems);
  const [nameFilter, setNameFilter] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const [showMetrics, setShowMetrics] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [overdueInfoOpen, setOverdueInfoOpen] = useState(false);

  // range opcional (quando vier from/to na URL)
  const rangeFrom = searchParams?.get("from") || null;
  const rangeTo = searchParams?.get("to") || null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.displayName) setUserName(user.displayName.split(" ")[0]);
      else if (user?.email) setUserName(user.email.split("@")[0]);
      else setUserName(t("defaultUserName"));
    });
    return () => unsubscribe();
  }, [t]);

  useEffect(() => {
    if (rangeFrom || rangeTo) {
      setItems(initialItems);
      return;
    }

    const { start, end } = getMonthRange(currentMonth);

    let q = query(
      collection(db, "finance_items"),
      where("date", ">=", start),
      where("date", "<=", end),
    );

    if (currentBoardId) {
      q = query(q, where("boardId", "==", currentBoardId));
    } else {
      q = query(q, where("userId", "==", sessionUserId));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const docs: FinanceItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        docs.push({
          id: docSnap.id,
          userId: data.userId,
          boardId: data.boardId,
          title: data.title,
          amount: data.amount,
          date: data.date,
          type: data.type,
          status: data.status,
          category: data.category,
          createdAt: data.createdAt,
          isFixed: data.isFixed,
          isSynthetic: data.isSynthetic,
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          paidAmount: data.paidAmount,
          openAmount: data.openAmount,
          carriedFromMonth: data.carriedFromMonth,
          carriedFromItemId: data.carriedFromItemId,
          fixedTemplateId: data.fixedTemplateId,
          installmentGroupId: data.installmentGroupId,
          installmentIndex: data.installmentIndex,
          installmentTotal: data.installmentTotal,
          originalAmount: data.originalAmount,
          cardName: data.cardName,
          cardMode: data.cardMode,
        });
      });

      docs.sort((a, b) => {
        if (a.date === b.date) return a.title.localeCompare(b.title);
        return a.date.localeCompare(b.date);
      });

      setItems(docs);
    });

    return () => unsub();
  }, [
    currentMonth,
    currentBoardId,
    sessionUserId,
    rangeFrom,
    rangeTo,
    initialItems,
  ]);

  const currentBoard = useMemo(
    () => boards.find((b) => b.id === currentBoardId),
    [boards, currentBoardId],
  );

  const boardName = currentBoardId
    ? currentBoard?.name || t("allBoardsLabel")
    : t("allBoardsLabel");

  const isOwner = !!currentBoard && currentBoard.ownerId === sessionUserId;

  const currentDate = parseISO(currentMonth + "-01");
  const isShowingRealCurrentMonth =
    currentMonth === format(new Date(), "yyyy-MM");

  const handlePrevMonth = () => {
    const newMonth = format(subMonths(currentDate, 1), "yyyy-MM");
    const params = new URLSearchParams(searchParams?.toString());
    params.set("month", newMonth);
    if (currentBoardId) params.set("boardId", currentBoardId);
    else params.delete("boardId");
    // ao navegar de mês, volta para a LISTA
    params.delete("from");
    params.delete("to");
    startRouteTransition(() => {
      router.push(`/${locale}/tools/finance?${params.toString()}`);
      setShowMetrics(false);
    });
  };

  const handleNextMonth = () => {
    const newMonth = format(addMonths(currentDate, 1), "yyyy-MM");
    const params = new URLSearchParams(searchParams?.toString());
    params.set("month", newMonth);
    if (currentBoardId) params.set("boardId", currentBoardId);
    else params.delete("boardId");
    params.delete("from");
    params.delete("to");
    startRouteTransition(() => {
      router.push(`/${locale}/tools/finance?${params.toString()}`);
      setShowMetrics(false);
    });
  };

  const handleGoToCurrentMonth = () => {
    const todayMonth = format(new Date(), "yyyy-MM");
    const params = new URLSearchParams(searchParams?.toString());
    params.set("month", todayMonth);
    if (currentBoardId) params.set("boardId", currentBoardId);
    else params.delete("boardId");
    params.delete("from");
    params.delete("to");
    startRouteTransition(() => {
      router.push(`/${locale}/tools/finance?${params.toString()}`);
      setShowMetrics(false);
    });
  };

  const handleBoardChange = (boardId: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (boardId) params.set("boardId", boardId);
    else params.delete("boardId");
    params.set("month", currentMonth);
    params.delete("from");
    params.delete("to");
    startRouteTransition(() => {
      router.push(`/${locale}/tools/finance?${params.toString()}`);
      setShowMetrics(false);
    });
  };

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const isPaid = item.status === "paid";
        const isMoved = item.status === "moved";

        if (item.type === "income") {
          if (isPaid) acc.incomes += item.amount;
          else if (!isMoved) acc.incomesForecast += item.amount;
        } else {
          if (isPaid) acc.expenses += item.amount;
          else if (!isMoved) acc.expensesForecast += item.amount;
        }

        return acc;
      },
      {
        incomes: 0,
        expenses: 0,
        incomesForecast: 0,
        expensesForecast: 0,
      },
    );
  }, [items]);

  const balance = totals.incomes - totals.expenses;

  const todayStr = new Date().toISOString().split("T")[0];

  const visibleItems = useMemo(() => {
    const query = normalizeForSearch(nameFilter);
    if (!query) return items;

    return items.filter((item) =>
      normalizeForSearch(item.title || "").includes(query),
    );
  }, [items, nameFilter]);

  const overdueItems = useMemo(
    () =>
      items.filter(
        (item) =>
          !item.isSynthetic &&
          item.date < todayStr &&
          item.status !== "paid" &&
          item.status !== "moved",
      ),
    [items, todayStr],
  );

  const overdueTotal = useMemo(
    () =>
      overdueItems.reduce((sum, item) => {
        const openAmount = item.amount - (item.paidAmount || 0);
        return sum + Math.max(openAmount, 0);
      }, 0),
    [overdueItems],
  );

  useEffect(() => {
    if (showMetrics) {
      setShareOpen(false);
      setSelectionMode(false);
      setSelectedItems(new Set());
    }
    setOverdueInfoOpen(false);
  }, [showMetrics]);

  useEffect(() => {
    if (overdueItems.length === 0) setOverdueInfoOpen(false);
  }, [overdueItems.length]);

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedItems(new Set());
  };

  const handleToggleItemSelection = (itemId: string) => {
    const next = new Set(selectedItems);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setSelectedItems(next);
  };

  const selectedTotal = useMemo(() => {
    let total = 0;
    items.forEach((item) => {
      if (selectedItems.has(item.id)) {
        if (item.type === "income") total += item.amount;
        else total -= item.amount;
      }
    });
    return total;
  }, [items, selectedItems]);

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

  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="relative pb-24" aria-busy={isRoutePending}>
      {isRoutePending && (
        <div className="absolute inset-0 z-40 bg-gray-50/60 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-sm font-semibold text-gray-700">
              {t("loading")}
            </span>
          </div>
        </div>
      )}
      {/* SELECT DE QUADRO */}
      {boards.length > 0 && (
        <div className="px-6 pt-4 pb-2 flex justify-between items-end gap-2">
          <div className="flex-1">
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
          <Link
            href={
              currentBoardId
                ? `/${locale}/tools/finance/categories?boardId=${currentBoardId}`
                : `/${locale}/tools/finance/categories`
            }
            className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center justify-center"
            title={t("manageCategoriesLabel")}
          >
            <FiSettings size={16} />
          </Link>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-blue-600 pt-6 pb-12 px-6 rounded-b-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />

        <span className="sr-only">
          {userName} {boardName}
        </span>

        {/* CONTROLE DE MÊS */}
        <div className="mb-4">
          <div className="w-full bg-blue-700/40 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center justify-between shadow-sm">
            <button
              onClick={handlePrevMonth}
              aria-label={t("prevMonthAria")}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition flex items-center justify-center"
            >
              <FiChevronLeft />
            </button>

            <div className="flex-1 flex items-center justify-center gap-2">
              <span className="inline-flex items-center justify-center text-sm font-semibold capitalize tracking-wide">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNextMonth}
                aria-label={t("nextMonthAria")}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition flex items-center justify-center"
              >
                <FiChevronRight />
              </button>

              {!isShowingRealCurrentMonth && (
                <button
                  type="button"
                  onClick={handleGoToCurrentMonth}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center text-[11px] font-semibold uppercase tracking-wide"
                >
                  {t("goTodayLabel")}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-blue-100 text-sm mb-1">{t("balanceTitle")}</p>
          <h2 className="text-4xl font-extrabold">{currency(balance)}</h2>
        </div>

        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
            <p className="text-xs text-blue-100 mb-1">{t("entriesLabel")}</p>
            <p className="text-lg font-bold text-green-300">
              + {currency(totals.incomes)}
            </p>

            <p className="text-xs text-blue-100 mb-1">
              {t("entriesForecastLabel")}
            </p>
            <p className="text-lg font-bold text-green-300">
              + {currency(totals.incomesForecast)}
            </p>
          </div>

          <div className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
            <p className="text-xs text-blue-100 mb-1">{t("exitsLabel")}</p>
            <p className="text-lg font-bold text-red-300">
              - {currency(totals.expenses)}
            </p>

            <p className="text-xs text-blue-100 mb-1">
              {t("exitsForecastLabel")}
            </p>
            <p className="text-lg font-bold text-red-300">
              - {currency(totals.expensesForecast)}
            </p>
          </div>
        </div>
      </div>

      {/* SHARE (só dono) */}
      {false && currentBoard && isOwner && (
        <div className="px-6 mt-4 mb-6">
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setShareOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-white/80 hover:bg-white border border-gray-200 text-gray-700 shadow-sm transition"
              aria-label={t("shareTitle")}
              title={t("shareTitle")}
            >
              <FiShare2 size={18} />
            </button>

            {shareOpen && (
              <div className="w-full bg-white border border-blue-100 rounded-2xl shadow-sm px-4 pb-4 pt-3">
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
            {!showMetrics && (
              <button
                onClick={toggleSelectionMode}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${selectionMode
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
              >
                {selectionMode ? t("cancelSelection") : t("selectButton")}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex bg-gray-100 rounded-xl p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowMetrics(false)}
                className={`px-3 py-1 rounded-lg transition-all ${!showMetrics
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
                  }`}
              >
                {t("tabListLabel")}
              </button>
              <button
                type="button"
                onClick={() => setShowMetrics(true)}
                className={`px-3 py-1 rounded-lg transition-all ${showMetrics
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
                  }`}
              >
                {t("tabMetricsLabel")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTA DE ATRASO – só na aba Lista, em colapse */}
      {!showMetrics && (
        <div className="px-6 mb-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder={t("searchByNamePlaceholder")}
              className="flex-1 p-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            {overdueItems.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOverdueInfoOpen((prev) => !prev)}
                  className="relative p-2 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 transition"
                  aria-label={t("overdueTitle")}
                  title={t("overdueTitle")}
                >
                  <FiAlertCircle size={18} />
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {overdueItems.length}
                  </span>
                </button>

                {overdueInfoOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 shadow-lg rounded-xl p-3 z-50">
                    <p className="text-xs font-semibold text-gray-800">
                      {t("overdueSubtitle", { count: overdueItems.length })}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {t("overdueSummaryLabel")}:{" "}
                      <span className="font-semibold text-amber-700">
                        {currency(overdueTotal)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentBoard && isOwner && (
              <button
                type="button"
                onClick={() => setShareOpen((prev) => !prev)}
                className="p-2 rounded-xl bg-white/80 hover:bg-white border border-gray-200 text-gray-700 shadow-sm transition"
                aria-label={t("shareTitle")}
                title={t("shareTitle")}
              >
                <FiShare2 size={18} />
              </button>
            )}
          </div>

          <div className="flex justify-end mt-1">
            <span className="text-[11px] text-gray-500 font-medium">
              {t("transactionsCount", { count: visibleItems.length })}
            </span>
          </div>

          {shareOpen && currentBoard && isOwner && (
            <div className="mt-2 bg-white border border-blue-100 rounded-2xl shadow-sm px-4 pb-4 pt-3">
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
      )}

      {false && !showMetrics && overdueItems.length > 0 && (
        <div className="mb-4">
          <details className="bg-amber-50/50 border border-amber-100/70 rounded-xl px-3 py-2 group opacity-80 hover:opacity-100 transition">
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
              <div>
                <p className="text-[11px] text-amber-700 font-semibold">
                  {t("overdueTitle")}{" "}
                  <span className="text-amber-600 font-medium">
                    • {t("overdueSubtitle", { count: overdueItems.length })}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-amber-800">
                  {currency(overdueTotal)}
                </p>
              </div>
            </summary>

            <div className="mt-3 max-h-52 overflow-y-auto space-y-2">
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
                        {currency(Math.max(openAmount, 0))}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {t("openAmountLabel")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      )}

      {showMetrics ? (
        <FinanceMetricsPanel
          items={items}
          currentMonth={currentMonth}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
        />
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 mb-2">
            {items.length === 0 ? t("noTransactions") : t("noResults")}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="text-blue-600 font-bold text-sm"
          >
            {t("addNow")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {visibleItems.map((item) => (
            <FinanceItemCard
              key={item.id}
              item={item}
              locale={locale}
              onEdit={handleEditItem}
              selectionMode={selectionMode}
              selected={selectedItems.has(item.id)}
              onToggleSelection={handleToggleItemSelection}
            />
          ))}
        </div>
      )}

      {
        selectionMode && selectedItems.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-xl rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{t("selectedTotalLabel")}</span>
              <span className={`text-lg font-bold ${selectedTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                {currency(selectedTotal)}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200 mx-1" />
            <span className="text-xs text-gray-400 font-medium">
              {selectedItems.size} {selectedItems.size === 1 ? t("itemSingular") : t("itemPlural")}
            </span>
          </div>
        )
      }

      {/* BOTÃO FLOAT – só na LISTA e se NÃO estiver em seleção */}
      {
        !showMetrics && !selectionMode && (
          <button
            onClick={handleOpenCreateModal}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-400 flex items-center justify-center hover:scale-110 active:scale-95 transition z-40"
            aria-label={t("addNow")}
          >
            <FiPlus size={28} />
          </button>
        )
      }

      {/* MODAL */}
      <FinanceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        locale={locale}
        initialCategories={initialCategories}
        initialItem={editingItem}
        boardId={currentBoardId ?? null}
        currentMonth={currentMonth}
      />
    </div >
  );
}
