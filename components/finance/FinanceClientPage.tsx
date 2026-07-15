"use client";

import type { FinanceBudget, FinanceBoard, FinanceCard, FinanceDebt, FinanceDebtPayment, FinanceItem, FinanceSavingsGoal, FinanceStatus, FinanceTemplate } from "@/types/finance";
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
  FiEye,
  FiEyeOff,
  FiDownload,
} from "react-icons/fi";
import { usePrivacy } from "@/components/finance/PrivacyProvider";
import PrivacyValue from "@/components/finance/PrivacyValue";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import FinanceItemCard from "@/components/finance/FinanceItemCard";
import FinanceFormModal from "@/components/finance/FinanceFormModal";
import FinanceMetricsPanel from "@/components/finance/FinanceMetricsPanel";
import FinanceCardsPanel from "@/components/finance/FinanceCardsPanel";
import FinancePlanningPanel from "@/components/finance/FinancePlanningPanel";
import FinanceDebtsPanel from "@/components/finance/FinanceDebtsPanel";
import FinanceGoalsPanel from "@/components/finance/FinanceGoalsPanel";
import {
  bulkFinanceItemsAction,
  ensureFixedItemsForCurrentMonth,
  normalizeCarriedPartialItemsForMonth,
} from "@/app/[locale]/tools/finance/(protected)/actions";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useTranslations } from "next-intl";
import Spinner from "@/components/ui/Spinner";
import { getMonthRange, normalizeForSearch } from "@/lib/finance/utils";
import { exportFinanceItemsCsv } from "@/lib/finance/export-csv";
import {
  getBulkSelectionTotal,
  getFinanceTotals,
  getOpenAmount,
  getPaidAmount,
  isBulkActionEligible,
  type BulkFinanceAction,
} from "@/lib/finance/calculations";
import { mapFinanceItem } from "@/lib/finance/schema";

import { sendInviteByEmail } from "../../app/[locale]/tools/finance/(protected)/invite-actions";

type FinanceView = "list" | "planning" | "debts" | "metrics" | "cards" | "goals";
type FinanceListDueFilter = "all" | "overdue" | "today" | "tomorrow" | "next7" | "next30" | "open" | "settled";
type FinanceListSort = "dateAsc" | "dateDesc" | "amountDesc" | "amountAsc" | "status";

function addDaysKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function PrivacyToggleButton() {
  const { privacyEnabled, togglePrivacy } = usePrivacy();
  const t = useTranslations("FinancePage");
  return (
    <button
      type="button"
      onClick={togglePrivacy}
      className={`min-w-[44px] min-h-[44px] rounded-xl border transition flex items-center justify-center ${
        privacyEnabled
          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700"
          : "bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] border-[var(--color-border)]"
      }`}
      title={privacyEnabled ? t("privacyModeDisable") : t("privacyModeEnable")}
      aria-pressed={privacyEnabled}
      aria-label={privacyEnabled ? t("privacyModeActiveAria") : t("privacyModeInactiveAria")}
    >
      {privacyEnabled ? <FiEyeOff size={18} /> : <FiEye size={18} />}
    </button>
  );
}

type Props = {
  initialItems: FinanceItem[];
  initialCategories: string[];
  currentMonth: string;
  locale: string;
  boards: FinanceBoard[];
  currentBoardId?: string | null;
  sessionUserId: string;
  previousCashBalance?: number;
  previousMonthCashBalance?: number;
  initialCards?: FinanceCard[];
  initialDebts?: FinanceDebt[];
  initialDebtPayments?: FinanceDebtPayment[];
  initialProjectionItems?: FinanceItem[];
  initialBudgets?: FinanceBudget[];
  previousMonthItems?: FinanceItem[];
  initialGoals?: FinanceSavingsGoal[];
  initialTemplates?: FinanceTemplate[];
  initialView?: FinanceView;
  initialDueFilter?: FinanceListDueFilter;
  initialStatusFilter?: "all" | FinanceStatus;
};

export default function FinanceClientPage({
  initialItems,
  initialCategories,
  currentMonth,
  locale,
  boards,
  currentBoardId,
  sessionUserId,
  previousCashBalance = 0,
  previousMonthCashBalance = 0,
  initialCards = [],
  initialDebts = [],
  initialDebtPayments = [],
  initialProjectionItems = [],
  initialBudgets = [],
  previousMonthItems = [],
  initialGoals = [],
  initialTemplates = [],
  initialView = "list",
  initialDueFilter = "all",
  initialStatusFilter = "all",
}: Props) {
  const t = useTranslations("FinancePage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRoutePending, startRouteTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState<string>(t("defaultUserName"));
  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);
  const [items, setItems] = useState<FinanceItem[]>(initialItems);
  const [cards, setCards] = useState<FinanceCard[]>(initialCards);
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FinanceStatus>(initialStatusFilter);
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [dueFilter, setDueFilter] = useState<FinanceListDueFilter>(initialDueFilter);
  const [sortOption, setSortOption] = useState<FinanceListSort>("dateAsc");
  const [tagFilter, setTagFilter] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const [activeView, setActiveView] = useState<FinanceView>(initialView);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<BulkFinanceAction | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [overdueInfoOpen, setOverdueInfoOpen] = useState(false);
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAccumulatedBalance, setShowAccumulatedBalance] = useState(false);
  const { privacyEnabled, togglePrivacy } = usePrivacy();
  const showMetrics = activeView === "metrics";
  const showCards = activeView === "cards";
  const showPlanning = activeView === "planning";
  const showDebts = activeView === "debts";
  const showGoals = activeView === "goals";

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
    setCards(initialCards);
  }, [initialCards]);

  useEffect(() => {
    if (rangeFrom || rangeTo) {
      setItems(initialItems);
      return;
    }

    let cancelled = false;

    ensureFixedItemsForCurrentMonth(currentMonth, locale, currentBoardId ?? null)
      .then((res) => {
        if (cancelled) return;
        if (res && "created" in res && Number(res.created || 0) > 0) {
          router.refresh();
        }
      })
      .catch(() => undefined);

    normalizeCarriedPartialItemsForMonth(currentMonth, locale, currentBoardId ?? null)
      .then((res) => {
        if (cancelled) return;
        if (res && "normalized" in res && Number(res.normalized || 0) > 0) {
          router.refresh();
        }
      })
      .catch(() => undefined);

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

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs: FinanceItem[] = [];
        snapshot.forEach((docSnap) => {
          docs.push(mapFinanceItem(docSnap));
        });

        docs.sort((a, b) => {
          if (a.date === b.date) return a.title.localeCompare(b.title);
          return a.date.localeCompare(b.date);
        });

        setItems(docs);
      },
      () => undefined,
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [
    currentMonth,
    currentBoardId,
    locale,
    router,
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

  const resetViewParams = (params: URLSearchParams) => {
    params.set("view", "list");
    params.delete("due");
    params.delete("status");
    params.delete("accountsDue");
    params.delete("accountsStatus");
  };

  const handleViewChange = (view: FinanceView) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("view", view);
    params.delete("due");
    params.delete("status");
    params.delete("accountsDue");
    params.delete("accountsStatus");
    setActiveView(view);
    startRouteTransition(() => {
      router.replace(`/${locale}/tools/finance?${params.toString()}`, { scroll: false });
    });
  };

  const handlePrevMonth = () => {
    const newMonth = format(subMonths(currentDate, 1), "yyyy-MM");
    const params = new URLSearchParams(searchParams?.toString());
    params.set("month", newMonth);
    if (currentBoardId) params.set("boardId", currentBoardId);
    else params.delete("boardId");
    // ao navegar de mês, volta para a LISTA
    params.delete("from");
    params.delete("to");
    resetViewParams(params);
    startRouteTransition(() => {
      router.push(`/${locale}/tools/finance?${params.toString()}`);
      setActiveView("list");
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
    resetViewParams(params);
    startRouteTransition(() => {
      router.push(`/${locale}/tools/finance?${params.toString()}`);
      setActiveView("list");
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
    resetViewParams(params);
    startRouteTransition(() => {
      router.push(`/${locale}/tools/finance?${params.toString()}`);
      setActiveView("list");
    });
  };

  const handleBoardChange = (boardId: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (boardId) params.set("boardId", boardId);
    else params.delete("boardId");
    params.set("month", currentMonth);
    params.delete("from");
    params.delete("to");
    resetViewParams(params);
    startRouteTransition(() => {
      router.push(`/${locale}/tools/finance?${params.toString()}`);
      setActiveView("list");
    });
  };

  const totals = useMemo(() => {
    return getFinanceTotals(items);
  }, [items]);

  const balance = totals.balance;
  const accumulatedBalance = previousCashBalance + balance;

  const todayStr = new Date().toISOString().split("T")[0];

  const visibleItems = useMemo(() => {
    const query = normalizeForSearch(nameFilter);

    return items
      .filter((item) => {
        const matchesName =
          !query || normalizeForSearch(item.title || "").includes(query);
        const matchesStatus =
          statusFilter === "all" || item.status === statusFilter;
        const matchesType = typeFilter === "all" || item.type === typeFilter;
        const matchesTag = !tagFilter || (item.tags && item.tags.some((t) => normalizeForSearch(t).includes(normalizeForSearch(tagFilter))));
        const matchesDue =
          dueFilter === "all" ||
          (dueFilter === "overdue" && item.date < todayStr && item.status !== "paid" && item.status !== "moved") ||
          (dueFilter === "today" && item.date === todayStr && item.status !== "paid" && item.status !== "moved") ||
          (dueFilter === "tomorrow" && item.date === addDaysKey(todayStr, 1) && item.status !== "paid" && item.status !== "moved") ||
          (dueFilter === "next7" && item.date >= todayStr && item.date <= addDaysKey(todayStr, 7) && item.status !== "paid" && item.status !== "moved") ||
          (dueFilter === "next30" && item.date >= todayStr && item.date <= addDaysKey(todayStr, 30) && item.status !== "paid" && item.status !== "moved") ||
          (dueFilter === "open" && item.status !== "paid" && item.status !== "moved") ||
          (dueFilter === "settled" && item.status === "paid");

        return matchesName && matchesStatus && matchesType && matchesTag && matchesDue;
      })
      .toSorted((left, right) => {
        if (sortOption === "dateDesc") return right.date.localeCompare(left.date);
        if (sortOption === "amountDesc") return getOpenAmount(right) - getOpenAmount(left);
        if (sortOption === "amountAsc") return getOpenAmount(left) - getOpenAmount(right);
        if (sortOption === "status") {
          const statusOrder: Record<FinanceStatus, number> = {
            partial: 0,
            pending: 1,
            paid: 2,
            moved: 3,
          };
          return statusOrder[left.status] - statusOrder[right.status] || left.date.localeCompare(right.date);
        }
        return left.date.localeCompare(right.date);
      });
  }, [items, nameFilter, statusFilter, typeFilter, tagFilter, dueFilter, sortOption, todayStr]);

  const titleSuggestions = useMemo(() => {
    const titles = new Set<string>();
    for (const item of items) {
      if (item.title && !item.isSynthetic) titles.add(item.title);
    }
    return Array.from(titles).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const activeFilterCount = useMemo(() => {
    return [
      nameFilter.trim(),
      statusFilter !== "all",
      typeFilter !== "all",
      tagFilter.trim(),
      dueFilter !== "all",
      sortOption !== "dateAsc",
    ].filter(Boolean).length;
  }, [dueFilter, nameFilter, sortOption, statusFilter, tagFilter, typeFilter]);

  const selectableVisibleItems = useMemo(
    () => visibleItems.filter((item) => !item.isSynthetic && item.status !== "moved"),
    [visibleItems],
  );

  const allVisibleSelected =
    selectableVisibleItems.length > 0 &&
    selectableVisibleItems.every((item) => selectedItems.has(item.id));

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
        return sum + getOpenAmount(item);
      }, 0),
    [overdueItems],
  );

  const clearFilters = () => {
    setNameFilter("");
    setStatusFilter("all");
    setTypeFilter("all");
    setTagFilter("");
    setDueFilter("all");
    setSortOption("dateAsc");
  };

  useEffect(() => {
    setDueFilter(initialDueFilter);
  }, [initialDueFilter]);

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    if (activeView !== "list") {
      setShareOpen(false);
      setSelectionMode(false);
      setSelectedItems(new Set());
    }
    setOverdueInfoOpen(false);
  }, [activeView]);

  useEffect(() => {
    if (overdueItems.length === 0) setOverdueInfoOpen(false);
  }, [overdueItems.length]);

  useEffect(() => {
    if (!bulkMessage) return;
    const timeout = window.setTimeout(() => setBulkMessage(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [bulkMessage]);

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedItems(new Set());
    setBulkError(null);
    setBulkMessage(null);
  };

  const handleToggleItemSelection = (itemId: string) => {
    const next = new Set(selectedItems);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setSelectedItems(next);
    setBulkError(null);
    setBulkMessage(null);
  };

  const handleSelectVisibleItems = () => {
    setSelectedItems(new Set(selectableVisibleItems.map((item) => item.id)));
    setBulkError(null);
    setBulkMessage(null);
  };

  const handleClearSelectedItems = () => {
    setSelectedItems(new Set());
    setBulkError(null);
    setBulkMessage(null);
  };

  const selectedTotal = useMemo(() => {
    return getBulkSelectionTotal(items, selectedItems);
  }, [items, selectedItems]);

  const selectedActionableItems = useMemo(
    () =>
      items.filter(
        (item) =>
          selectedItems.has(item.id) &&
          !item.isSynthetic &&
          item.status !== "moved",
      ),
    [items, selectedItems],
  );

  const selectedPayableItems = useMemo(
    () =>
      selectedActionableItems.filter((item) => isBulkActionEligible(item, "pay")),
    [selectedActionableItems],
  );

  const selectedMovableItems = useMemo(
    () =>
      selectedActionableItems.filter((item) => isBulkActionEligible(item, "move")),
    [selectedActionableItems],
  );

  const selectedDeletableItems = useMemo(
    () =>
      selectedActionableItems.filter((item) => isBulkActionEligible(item, "delete")),
    [selectedActionableItems],
  );

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleBulkAction = async (action: BulkFinanceAction) => {
    const eligibleItems =
      action === "pay"
        ? selectedPayableItems
        : action === "move"
          ? selectedMovableItems
          : selectedDeletableItems;

    if (eligibleItems.length === 0 || bulkLoading) return;

    setBulkLoading(action);
    setBulkError(null);
    setBulkMessage(null);

    const res = await bulkFinanceItemsAction(eligibleItems.map((item) => item.id), action, locale);
    if (res && "error" in res && res.error) {
      setBulkError(res.error as string);
      setBulkLoading(null);
      return;
    }

    const changed = res && "changed" in res ? Number(res.changed || 0) : 0;
    const skipped = res && "skipped" in res ? Number(res.skipped || 0) : 0;
    setSelectedItems(new Set());
    setSelectionMode(false);
    setBulkLoading(null);
    setBulkMessage(t("bulkResultMessage", { changed, skipped }));
    router.refresh();
  };

  const handleEditItem = (item: FinanceItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDuplicateItem = (item: FinanceItem) => {
    const today = new Date().toISOString().split("T")[0];
    const duplicated: FinanceItem = {
      ...item,
      id: "",
      date: today,
      status: "pending",
      paidAmount: 0,
      openAmount: item.amount,
      createdAt: new Date().toISOString(),
      carriedFromMonth: undefined,
      carriedFromItemId: undefined,
      carriedToMonth: undefined,
      carriedRemainderAmount: undefined,
      installmentGroupId: undefined,
      installmentIndex: undefined,
      installmentTotal: undefined,
      originalAmount: undefined,
    };
    setEditingItem(duplicated);
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

  const visibleExpenses = visibleItems.filter((item) => item.type === "expense");
  const visibleIncomes = visibleItems.filter((item) => item.type === "income");
  const isOpenMoneyView =
    (dueFilter !== "all" && dueFilter !== "settled") ||
    statusFilter === "pending" ||
    statusFilter === "partial";
  const getListDisplayAmount = (item: FinanceItem) => {
    const hasMovedRemainder =
      item.status === "partial" &&
      getOpenAmount(item) <= 0 &&
      Number(item.carriedRemainderAmount || 0) > 0;
    if (hasMovedRemainder) return getPaidAmount(item);
    return isOpenMoneyView ? getOpenAmount(item) : item.amount;
  };
  const visibleExpensesTotal = visibleExpenses.reduce(
    (sum, item) => sum + getListDisplayAmount(item),
    0,
  );
  const visibleIncomesTotal = visibleIncomes.reduce(
    (sum, item) => sum + getListDisplayAmount(item),
    0,
  );
  const expenseSectionTitle = isOpenMoneyView ? t("listPayableTitle") : t("listExpensesTitle");
  const incomeSectionTitle = isOpenMoneyView ? t("listReceivableTitle") : t("listIncomesTitle");

  const renderListSection = (
    sectionItems: FinanceItem[],
    title: string,
    emptyLabel: string,
    total: number,
    tone: "income" | "expense",
  ) => (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
            {title}
          </h2>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {t("listSectionCount", { count: sectionItems.length })}
          </p>
        </div>
        <span
          className={`text-sm font-bold ${
            tone === "income" ? "finance-success-text" : "finance-danger-text"
          }`}
        >
          {tone === "income" ? "+ " : "- "}
          <PrivacyValue>{currency(total)}</PrivacyValue>
        </span>
      </div>

      {sectionItems.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
          {emptyLabel}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {sectionItems.map((item) => (
            <FinanceItemCard
              key={item.id}
              item={item}
              locale={locale}
              onEdit={handleEditItem}
              onDuplicate={handleDuplicateItem}
              selectionMode={selectionMode}
              selected={selectedItems.has(item.id)}
              onToggleSelection={handleToggleItemSelection}
              compact
              amountMode={isOpenMoneyView ? "open" : "original"}
            />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="relative pb-24" aria-busy={isRoutePending}>
      {isRoutePending && (
        <div className="absolute inset-0 z-40 bg-[var(--color-surface-raised)]/60 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">
            <Spinner size="md" color="blue" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {t("loading")}
            </span>
          </div>
        </div>
      )}
      {/* SELECT DE QUADRO */}
      {boards.length > 0 && (
        <div className="pt-3 pb-1">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowBoardPicker((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-semibold border border-[var(--color-border)] transition"
              aria-expanded={showBoardPicker}
            >
              <FiList size={16} />
              <span className="truncate max-w-[160px]">
                {boardName}
              </span>
            </button>

            {/* Desktop: ações secundárias visíveis */}
            <div className="hidden md:flex items-center gap-2">
              <PrivacyToggleButton />
              <Link
                href={
                  currentBoardId
                    ? `/${locale}/tools/finance/categories?boardId=${currentBoardId}`
                    : `/${locale}/tools/finance/categories`
                }
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] border border-[var(--color-border)] transition flex items-center justify-center"
                title={t("manageCategoriesLabel")}
              >
                <FiSettings size={16} />
              </Link>
            </div>

            {/* Mobile: menu overflow */}
            <div className="relative flex md:hidden">
              <button
                type="button"
                onClick={() => setShowSettingsMenu((prev) => !prev)}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] border border-[var(--color-border)] transition flex items-center justify-center"
                aria-label={t("manageCategoriesLabel")}
              >
                <FiSettings size={18} />
              </button>

              {showSettingsMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-lg p-2 z-50">
                  <button
                    type="button"
                    onClick={() => { togglePrivacy(); setShowSettingsMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)] transition text-left"
                  >
                    {privacyEnabled ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    {privacyEnabled ? t("privacyModeDisable") : t("privacyModeEnable")}
                  </button>
                  <Link
                    href={
                      currentBoardId
                        ? `/${locale}/tools/finance/categories?boardId=${currentBoardId}`
                        : `/${locale}/tools/finance/categories`
                    }
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)] transition"
                    onClick={() => setShowSettingsMenu(false)}
                  >
                    <FiSettings size={16} />
                    {t("manageCategoriesLabel")}
                  </Link>
                  {activeView === "list" && (
                    <button
                      type="button"
                      onClick={() => { exportFinanceItemsCsv(items, `financeiro-${currentMonth}`); setShowSettingsMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)] transition text-left"
                    >
                      <FiDownload size={16} />
                      {t("exportCsvLabel")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {showBoardPicker && (
            <div className="mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-3 py-3 shadow-sm">
              <label className="block text-[11px] font-semibold text-[var(--color-text-muted)] mb-2">
                {t("boardLabel")}
              </label>
              <select
                value={currentBoardId ?? ""}
                onChange={(e) => handleBoardChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:ring-2 focus:ring-blue-500 outline-none"
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
        </div>
      )}

      {/* HEADER */}
      <div className="finance-hero pt-6 pb-12 px-6 rounded-3xl relative overflow-hidden">
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

        <div className="mb-4 flex flex-col items-center text-center">
          <p className="text-blue-100 text-sm mb-1">{t("balanceTitle")}</p>
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-4xl font-extrabold"><PrivacyValue>{currency(balance)}</PrivacyValue></h2>
            <button
              type="button"
              onClick={togglePrivacy}
              className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition ${
                privacyEnabled
                  ? "bg-white/25 text-white"
                  : "bg-white/10 hover:bg-white/15 text-blue-100"
              }`}
              aria-pressed={privacyEnabled}
              aria-label={privacyEnabled ? t("privacyModeActiveAria") : t("privacyModeInactiveAria")}
            >
              {privacyEnabled ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowAccumulatedBalance((prev) => !prev)}
            className="mt-2 inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-blue-50 transition"
            aria-expanded={showAccumulatedBalance}
          >
            <FiEye size={13} />
            {t("accumulatedBalanceToggle")}
          </button>
          {showAccumulatedBalance && (
            <div className="mt-2 flex w-full max-w-sm flex-col items-stretch rounded-xl bg-white/10 px-3 py-2 text-xs text-blue-50">
              <div className="flex items-center justify-between gap-3">
                <span className="text-blue-100">{t("previousMonthBalanceLabel")}</span>
                <PrivacyValue><span className="font-semibold">{currency(previousMonthCashBalance)}</span></PrivacyValue>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 border-t border-white/10 pt-1">
                <span className="text-blue-100">{t("previousBalanceLabel")}</span>
                <PrivacyValue><span className="font-semibold">{currency(previousCashBalance)}</span></PrivacyValue>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 border-t border-white/10 pt-1">
                <span className="text-blue-100">{t("accumulatedBalanceLabel")}</span>
                <PrivacyValue><span className="font-bold">{currency(accumulatedBalance)}</span></PrivacyValue>
              </div>
              <span className="mt-1 text-left text-[10px] text-blue-100">
                {t("accumulatedBalanceHint")}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
            <p className="text-xs text-blue-100 mb-1">{t("entriesLabel")}</p>
            <p className="text-lg font-bold text-green-300">
              + <PrivacyValue>{currency(totals.incomes)}</PrivacyValue>
            </p>

            <p className="text-xs text-blue-100 mb-1">
              {t("entriesForecastLabel")}
            </p>
            <p className="text-lg font-bold text-green-300">
              + <PrivacyValue>{currency(totals.incomesForecast)}</PrivacyValue>
            </p>
          </div>

          <div className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
            <p className="text-xs text-blue-100 mb-1">{t("exitsLabel")}</p>
            <p className="text-lg font-bold text-red-300">
              - <PrivacyValue>{currency(totals.expenses)}</PrivacyValue>
            </p>

            <p className="text-xs text-blue-100 mb-1">
              {t("exitsForecastLabel")}
            </p>
            <p className="text-lg font-bold text-red-300">
              - <PrivacyValue>{currency(totals.expensesForecast)}</PrivacyValue>
            </p>
          </div>
        </div>
      </div>

      {/* LISTA / MÉTRICAS */}
      <div className="mt-3 mb-3 space-y-2">
        {/* Tabs — scrollable on mobile */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 flex overflow-x-auto scroll-smooth scrollbar-hide bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-1 text-xs font-semibold"
            role="tablist"
          >
            {[
              ["list", t("tabListLabel")],
              ["planning", t("tabPlanningLabel")],
              ["debts", t("tabDebtsLabel")],
              ["metrics", t("tabMetricsLabel")],
              ["cards", t("tabCardsLabel")],
              ["goals", t("tabGoalsLabel")],
            ].map(([view, label]) => (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={activeView === view}
                onClick={() => handleViewChange(view as FinanceView)}
                className={`whitespace-nowrap min-h-[40px] px-4 py-2 rounded-lg transition-all flex-shrink-0 ${
                  activeView === view
                    ? "bg-[var(--color-surface)] text-[var(--color-accent-primary)] shadow-sm font-bold"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Export — desktop only (mobile: inside settings menu) */}
          {activeView === "list" && (
            <button
              type="button"
              onClick={() => exportFinanceItemsCsv(items, `financeiro-${currentMonth}`)}
              className="hidden md:flex min-w-[44px] min-h-[44px] rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] border border-[var(--color-border)] transition items-center justify-center"
              title={t("exportCsvLabel")}
              aria-label={t("exportCsvLabel")}
            >
              <FiDownload size={16} />
            </button>
          )}
        </div>

        {/* Selection controls */}
        {activeView === "list" && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleSelectionMode}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectionMode
                ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border-[var(--color-accent-primary)]"
                : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                }`}
            >
              {selectionMode ? t("cancelSelection") : t("selectButton")}
            </button>
            {selectionMode && selectableVisibleItems.length > 0 && (
              <button
                type="button"
                onClick={allVisibleSelected ? handleClearSelectedItems : handleSelectVisibleItems}
                className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold border bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]"
              >
                {allVisibleSelected ? t("clearSelectionButton") : t("selectVisibleButton")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* TEMPLATES RÁPIDOS */}
      {activeView === "list" && initialTemplates.length > 0 && !selectionMode && (
        <div className="mb-3 flex flex-wrap gap-2">
          {initialTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                const duplicated: FinanceItem = {
                  id: "",
                  userId: sessionUserId,
                  boardId: currentBoardId ?? undefined,
                  title: tpl.title,
                  amount: tpl.amount,
                  date: today,
                  type: tpl.type,
                  status: "pending",
                  category: tpl.category,
                  createdAt: new Date().toISOString(),
                  paidAmount: 0,
                  ...(tpl.cardId ? { cardId: tpl.cardId } : {}),
                  ...(tpl.cardName ? { cardName: tpl.cardName } : {}),
                  ...(tpl.tags && tpl.tags.length > 0 ? { tags: tpl.tags } : {}),
                };
                setEditingItem(duplicated);
                setIsModalOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition hover:shadow-sm ${
                tpl.type === "income"
                  ? "finance-success-soft hover:brightness-95"
                  : "finance-danger-soft hover:brightness-95"
              }`}
            >
              <span>{tpl.type === "income" ? "+" : "-"}</span>
              <span className="truncate max-w-[120px]">{tpl.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* ALERTA DE ATRASO – só na aba Lista, em colapse */}
      {activeView === "list" && (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder={t("searchByNamePlaceholder")}
              className="flex-1 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <input
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder={t("filterByTagPlaceholder")}
              className="w-28 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            {overdueItems.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOverdueInfoOpen((prev) => !prev)}
                  className="relative p-2 rounded-xl finance-warning-soft border transition"
                  aria-label={t("overdueTitle")}
                  title={t("overdueTitle")}
                >
                  <FiAlertCircle size={18} />
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {overdueItems.length}
                  </span>
                </button>

                {overdueInfoOpen && (
                  <div className="absolute right-0 mt-2 w-72 finance-surface border shadow-lg rounded-xl p-3 z-50">
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {t("overdueSubtitle", { count: overdueItems.length })}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                      {t("overdueSummaryLabel")}:{" "}
                      <span className="font-semibold text-amber-600">
                        <PrivacyValue>{currency(overdueTotal)}</PrivacyValue>
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
                className="p-2 rounded-xl finance-surface border shadow-sm transition hover:border-[var(--color-accent-primary)]"
                aria-label={t("shareTitle")}
                title={t("shareTitle")}
              >
                <FiShare2 size={18} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">{t("filterTypeAll")}</option>
              <option value="income">{t("filterTypeIncome")}</option>
              <option value="expense">{t("filterTypeExpense")}</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">{t("filterStatusAll")}</option>
              <option value="paid">{t("filterStatusPaid")}</option>
              <option value="partial">{t("filterStatusPartial")}</option>
              <option value="pending">{t("filterStatusPending")}</option>
              <option value="moved">{t("filterStatusMoved")}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2 mt-2 md:grid-cols-2">
            <select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value as typeof dueFilter)}
              className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">{t("filterDueAll")}</option>
              <option value="overdue">{t("filterDueOverdue")}</option>
              <option value="today">{t("filterDueToday")}</option>
              <option value="tomorrow">{t("filterDueTomorrow")}</option>
              <option value="next7">{t("filterDueNext7")}</option>
              <option value="next30">{t("filterDueNext30")}</option>
              <option value="open">{t("filterDueOpen")}</option>
              <option value="settled">{t("filterDueSettled")}</option>
            </select>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as FinanceListSort)}
              className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="dateAsc">{t("sortDateAsc")}</option>
              <option value="dateDesc">{t("sortDateDesc")}</option>
              <option value="amountDesc">{t("sortAmountDesc")}</option>
              <option value="amountAsc">{t("sortAmountAsc")}</option>
              <option value="status">{t("sortStatus")}</option>
            </select>
          </div>

          <div className="flex justify-end mt-1">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)]"
                >
                  {t("clearFiltersButton", { count: activeFilterCount })}
                </button>
              )}
              <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                {t("transactionsCount", { count: visibleItems.length })}
              </span>
            </div>
          </div>

          {shareOpen && currentBoard && isOwner && (
            <div className="mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm px-4 pb-4 pt-3">
              <div className="mb-3">
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  {t("shareCodeLabel")}
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentBoard.inviteCode || currentBoard.id}
                  className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-xs text-[var(--color-text-secondary)]"
                />
                <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                  {t("shareCodeHint")}
                </p>
              </div>

              <form
                onSubmit={handleInviteByEmail}
                className="mt-3 flex flex-col gap-3 md:flex-row"
              >
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    {t("shareEmailLabel")}
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t("shareEmailPlaceholder")}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="w-full md:w-auto px-5 py-2.5 bg-[var(--color-accent-primary)] text-white text-sm font-bold rounded-xl hover:bg-[var(--color-accent-hover)] active:scale-95 transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-1 md:mt-0 flex items-center justify-center gap-2"
                  >
                    {inviteLoading && <Spinner size="sm" color="white" />}
                    {inviteLoading ? t("sending") : t("shareEmailButton")}
                  </button>
                </div>
              </form>

              {inviteMessage && (
                <p className="mt-2 text-xs finance-success-text">{inviteMessage}</p>
              )}
              {inviteError && (
                <p className="mt-2 text-xs finance-danger-text">{inviteError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {showPlanning ? (
        <FinancePlanningPanel
          items={items}
          projectionItems={initialProjectionItems}
          debts={initialDebts}
          cards={cards}
          currentMonth={currentMonth}
          previousCashBalance={previousCashBalance}
          previousMonthItems={previousMonthItems}
          budgets={initialBudgets}
        />
      ) : showDebts ? (
        <FinanceDebtsPanel
          debts={initialDebts}
          payments={initialDebtPayments}
          boardId={currentBoardId ?? ""}
          locale={locale}
        />
      ) : showMetrics ? (
        <FinanceMetricsPanel
          items={items}
          currentMonth={currentMonth}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          budgets={initialBudgets}
          locale={locale}
          boardId={currentBoardId ?? ""}
          previousMonthItems={previousMonthItems}
        />
      ) : showCards ? (
        <FinanceCardsPanel
          cards={cards}
          items={items}
          boardId={currentBoardId ?? null}
          locale={locale}
          currentMonth={currentMonth}
          sessionUserId={sessionUserId}
        />
      ) : showGoals ? (
        <FinanceGoalsPanel
          goals={initialGoals}
          boardId={currentBoardId ?? ""}
          locale={locale}
        />
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-10 bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)]">
          <p className="text-[var(--color-text-muted)] mb-2">
            {items.length === 0 ? t("noTransactions") : t("noResults")}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="text-[var(--color-accent-primary)] font-bold text-sm"
          >
            {t("addNow")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {renderListSection(
            visibleExpenses,
            expenseSectionTitle,
            t("listExpensesEmpty"),
            visibleExpensesTotal,
            "expense",
          )}
          {renderListSection(
            visibleIncomes,
            incomeSectionTitle,
            t("listIncomesEmpty"),
            visibleIncomesTotal,
            "income",
          )}
        </div>
      )}

      {
        activeView === "list" && selectionMode && selectedItems.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 finance-surface border shadow-xl rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 max-w-[calc(100vw-2rem)]">
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">{t("selectedTotalLabel")}</span>
              <span className={`text-lg font-bold ${selectedTotal >= 0 ? "finance-success-text" : "finance-danger-text"}`}>
                <PrivacyValue>{currency(selectedTotal)}</PrivacyValue>
              </span>
            </div>
            <div className="h-8 w-px bg-[var(--color-border)] mx-1" />
            <span className="text-xs text-[var(--color-text-muted)] font-medium">
              {selectedActionableItems.length} {selectedActionableItems.length === 1 ? t("itemSingular") : t("itemPlural")}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkAction("pay")}
                disabled={!!bulkLoading || selectedPayableItems.length === 0}
                className="px-3 py-2 rounded-xl bg-[var(--color-success-strong)] text-white text-xs font-bold disabled:opacity-60"
              >
                {bulkLoading === "pay" ? t("bulkLoading") : t("bulkPay")}
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction("move")}
                disabled={!!bulkLoading || selectedMovableItems.length === 0}
                className="px-3 py-2 rounded-xl bg-[var(--color-accent-primary)] text-white text-xs font-bold disabled:opacity-60"
              >
                {bulkLoading === "move" ? t("bulkLoading") : t("bulkMove")}
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction("delete")}
                disabled={!!bulkLoading || selectedDeletableItems.length === 0}
                className="px-3 py-2 rounded-xl bg-[var(--color-danger-strong)] text-white text-xs font-bold disabled:opacity-60"
              >
                {bulkLoading === "delete" ? t("bulkLoading") : t("bulkDelete")}
              </button>
            </div>
            {bulkError && (
              <p className="basis-full text-xs finance-danger-text">{bulkError}</p>
            )}
          </div>
        )
      }

      {activeView === "list" && bulkMessage && !selectionMode && (
        <div className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border finance-success-soft px-4 py-3 text-xs font-semibold shadow-lg">
          <span>{bulkMessage}</span>
          <button
            type="button"
            onClick={() => setBulkMessage(null)}
            className="rounded-lg px-1.5 py-0.5 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label={t("closeBulkMessage")}
          >
            x
          </button>
        </div>
      )}

      {/* Botão flutuante - só na lista e se não estiver em seleção */}
      {/* FAB — Quick-add (visível em todas as abas, exceto modo seleção) */}
      {!selectionMode && (
          <button
            onClick={handleOpenCreateModal}
            className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--color-accent-primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition z-40"
            aria-label={t("addNow")}
          >
            <FiPlus size={28} />
          </button>
      )}

      {/* MODAL */}
      <FinanceFormModal
        key={editingItem?.id || editingItem?.title || (isModalOpen ? "new" : "closed")}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        locale={locale}
        initialCategories={initialCategories}
        initialCards={cards}
        initialItem={editingItem}
        boardId={currentBoardId ?? null}
        currentMonth={currentMonth}
        titleSuggestions={titleSuggestions}
      />
    </div >
  );
}
