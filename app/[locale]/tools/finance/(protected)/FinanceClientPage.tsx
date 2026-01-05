"use client";

import { FinanceBoard, FinanceItem } from "@/types/finance";
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
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useTranslations } from "next-intl";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

type Props = {
  initialItems: FinanceItem[];
  initialCategories: string[];
  currentMonth: string;
  locale: string;
  boards: FinanceBoard[];
  currentBoardId?: string | null;
};

export default function FinanceClientPage({
  initialItems,
  initialCategories,
  currentMonth,
  locale,
  boards,
  currentBoardId,
}: Props) {
  const t = useTranslations("FinancePage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState("Gestor");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);
  const [boardName, setBoardName] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [showPendingPopup, setShowPendingPopup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.displayName) {
        setUserName(user.displayName.split(" ")[0]);
      } else if (user?.email) {
        setUserName(user.email.split("@")[0]);
      }
      setCurrentUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  const currentBoard = useMemo(
    () => boards.find((b) => b.id === currentBoardId),
    [boards, currentBoardId],
  );

  useEffect(() => {
    if (!currentBoardId) {
      setBoardName(t("allBoardsLabel"));
      return;
    }
    const board = boards.find((b) => b.id === currentBoardId);
    setBoardName(board?.name || t("allBoardsLabel"));
  }, [boards, currentBoardId, t]);

  const isOwner =
    !!currentBoard && !!currentUserId && currentBoard.ownerId === currentUserId;

  // Busca aprovações pendentes (solicitações para entrar em quadros onde eu sou dono)
  useEffect(() => {
    if (!currentUserId) return;

    const fetchPending = async () => {
      try {
        const invitesRef = collection(db, "finance_board_invites");
        const snap = await getDocs(
          query(
            invitesRef,
            where("ownerId", "==", currentUserId),
            where("status", "==", "pending"),
          ),
        );
        const count = snap.size;
        setPendingApprovalsCount(count);
        setShowPendingPopup(count > 0);
      } catch (err) {
        console.error("Erro ao buscar aprovações pendentes:", err);
      }
    };

    fetchPending();
  }, [currentUserId]);

  const currentDate = parseISO(currentMonth + "-01");

  const handlePrevMonth = () => {
    const newMonth = format(subMonths(currentDate, 1), "yyyy-MM");
    const params = new URLSearchParams(searchParams?.toString());
    params.set("month", newMonth);
    if (currentBoardId) {
      params.set("boardId", currentBoardId);
    } else {
      params.delete("boardId");
    }
    router.push(`/${locale}/tools/finance?${params.toString()}`);
  };

  const handleNextMonth = () => {
    const newMonth = format(addMonths(currentDate, 1), "yyyy-MM");
    const params = new URLSearchParams(searchParams?.toString());
    params.set("month", newMonth);
    if (currentBoardId) {
      params.set("boardId", currentBoardId);
    } else {
      params.delete("boardId");
    }
    router.push(`/${locale}/tools/finance?${params.toString()}`);
  };

  const handleBoardChange = (boardId: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (boardId) {
      params.set("boardId", boardId);
    } else {
      params.delete("boardId");
    }
    params.set("month", currentMonth);
    router.push(`/${locale}/tools/finance?${params.toString()}`);
  };

  const totals = useMemo(() => {
    return initialItems.reduce(
      (acc, item) => {
        if (item.type === "income") acc.incomes += item.amount;
        else acc.expenses += item.amount;
        return acc;
      },
      { incomes: 0, expenses: 0 },
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

  const handleClickIncomes = () => {
    const params = new URLSearchParams();
    params.set("month", currentMonth);
    if (currentBoardId) params.set("boardId", currentBoardId);
    router.push(`/${locale}/tools/finance/incomes?${params.toString()}`);
  };

  const handleClickExpenses = () => {
    const params = new URLSearchParams();
    params.set("month", currentMonth);
    if (currentBoardId) params.set("boardId", currentBoardId);
    router.push(`/${locale}/tools/finance/expenses?${params.toString()}`);
  };

  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || !currentBoard || !currentUserId) return;

    setInviteLoading(true);
    setInviteMessage(null);
    setInviteError(null);

    try {
      const boardRef = doc(db, "finance_boards", currentBoard.id);
      const boardSnap = await getDoc(boardRef);

      if (!boardSnap.exists()) {
        setInviteError("Quadro não encontrado.");
        setInviteLoading(false);
        return;
      }

      await addDoc(collection(db, "finance_board_invites"), {
        boardId: currentBoard.id,
        boardName: currentBoard.name,
        ownerId: currentBoard.ownerId,
        type: "email",
        email,
        status: "pending",
        createdBy: currentUserId,
        createdAt: new Date().toISOString(),
      });

      setInviteEmail("");
      setInviteMessage(t("inviteSent"));
    } catch (err) {
      console.error("Erro ao enviar convite por email:", err);
      setInviteError("Erro ao enviar convite. Tente novamente.");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="pb-24">
      {/* POPUP DE APROVAÇÕES PENDENTES */}
      {showPendingPopup && pendingApprovalsCount > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              {t("pendingApprovalsTitle")}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t("pendingApprovalsMessage", {
                count: pendingApprovalsCount,
              })}
            </p>
            <button
              onClick={() => setShowPendingPopup(false)}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition"
            >
              {t("pendingApprovalsClose")}
            </button>
          </div>
        </div>
      )}

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

        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-lg font-medium opacity-90">
              {t("hello")}, {userName}!
            </h1>
            <p className="text-xs text-blue-100 mt-1">
              {t("currentBoardPrefix")}{" "}
              <span className="font-semibold">{boardName}</span>
            </p>
          </div>

          <div className="flex gap-4 items-center bg-blue-700/50 p-1 rounded-full px-4">
            <button onClick={handlePrevMonth}>
              <FiChevronLeft />
            </button>
            <span className="text-sm font-semibold capitalize min-w-[120px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <button onClick={handleNextMonth}>
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-blue-100 text-sm mb-1">
            {t("balanceTitle")}
          </p>
          <h2 className="text-4xl font-extrabold">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(balance)}
          </h2>
        </div>

        <div className="flex gap-4 mt-6">
          <div
            className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl cursor-pointer"
            onClick={handleClickIncomes}
          >
            <p className="text-xs text-blue-100 mb-1">
              {t("entriesLabel")}
            </p>
            <p className="text-lg font-bold text-green-300">
              +
              {" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.incomes)}
            </p>
          </div>
          <div
            className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl cursor-pointer"
            onClick={handleClickExpenses}
          >
            <p className="text-xs text-blue-100 mb-1">
              {t("exitsLabel")}
            </p>
            <p className="text-lg font-bold text-red-300">
              -
              {" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.expenses)}
            </p>
          </div>
        </div>
      </div>

      {/* BLOCO DE COMPARTILHAMENTO DO QUADRO (apenas dono) */}
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
                className={`text-gray-400 transition-transform ${
                  shareOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {shareOpen && (
              <div className="border-t border-blue-50 px-4 pb-4 pt-2">
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {t("shareCodeLabel")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentBoard.id}
                      className="flex-1 p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-700"
                    />
                  </div>
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
                      {inviteLoading ? "Enviando..." : t("shareEmailButton")}
                    </button>
                  </div>
                </form>

                {inviteMessage && (
                  <p className="mt-2 text-xs text-green-600">
                    {inviteMessage}
                  </p>
                )}
                {inviteError && (
                  <p className="mt-2 text-xs text-red-600">
                    {inviteError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTAS EM ATRASO */}
      {overdueItems.length > 0 && (
        <div className="px-6 mt-2 mb-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-xs text-amber-700 font-semibold">
                  {t("overdueTitle")}
                </p>
                <p className="text-[11px] text-amber-600">
                  {t("overdueSubtitle", {
                    count: overdueItems.length,
                  })}
                </p>
              </div>
              <p className="text-sm font-bold text-amber-800">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(overdueTotal)}
              </p>
            </div>

            <div className="max-h-52 overflow-y-auto mt-2 space-y-2">
              {overdueItems.map((item) => {
                const openAmount =
                  item.amount - (item.paidAmount || 0);
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
                        saldo em aberto
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LISTA */}
      <div className="px-6 mt-2">
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="font-bold text-gray-700">
            {t("transactionsTitle")}
          </h3>
          <span className="text-xs text-gray-400">
            {t("transactionsCount", {
              count: initialItems.length,
            })}
          </span>
        </div>

        {initialItems.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 mb-2">
              {t("noTransactions")}
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
