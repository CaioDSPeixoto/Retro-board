"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import Link from "next/link";
import { FiBell } from "react-icons/fi";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { useTranslations } from "next-intl";
import { auth, db } from "@/lib/firebase";
import type { FinanceBoard, FinanceBoardInvite, FinanceCard, FinanceItem, FinanceSavingsGoal } from "@/types/finance";
import { getOpenAmount } from "@/lib/finance/calculations";
import {
  mapFinanceBoard,
  mapFinanceBoardInvite,
  mapFinanceCard,
  mapFinanceItem,
  mapFinanceSavingsGoal,
} from "@/lib/finance/schema";

function isOpenItem(item: FinanceItem) {
  return !item.isSynthetic && item.status !== "paid" && item.status !== "moved" && getOpenAmount(item) > 0;
}

type Props = {
  locale: string;
};

const NOTIFICATION_PREVIEW_LIMIT = 3;

type NotificationRow = {
  id: string;
  title: string;
  date: string;
  href: string;
};

function getFinanceNotificationHref(
  item: FinanceItem,
  locale: string,
  filter: { due?: string; status?: string },
) {
  const params = new URLSearchParams({
    month: item.date.slice(0, 7),
    view: "list",
  });
  if (item.boardId) params.set("boardId", item.boardId);
  if (filter.due) params.set("due", filter.due);
  if (filter.status) params.set("status", filter.status);
  return `/${locale}/tools/finance?${params.toString()}`;
}

export default function FinanceNotificationBell({ locale }: Props) {
  const t = useTranslations("FinancePage");
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [cards, setCards] = useState<FinanceCard[]>([]);
  const [invites, setInvites] = useState<FinanceBoardInvite[]>([]);
  const [goals, setGoals] = useState<FinanceSavingsGoal[]>([]);
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(false);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrow = useMemo(() => format(addDays(new Date(), 1), "yyyy-MM-dd"), []);
  const dueSoonLimit = useMemo(() => format(addDays(new Date(), 3), "yyyy-MM-dd"), []);

  useEffect(() => {
    let unsubscribePersonalItems: (() => void) | null = null;
    let unsubscribeMemberBoards: (() => void) | null = null;
    let unsubscribeOwnedBoards: (() => void) | null = null;
    let unsubscribeCards: (() => void) | null = null;
    let unsubscribeEmailInvites: (() => void) | null = null;
    let unsubscribeOwnerInvites: (() => void) | null = null;
    let unsubscribeBoardItems: Array<() => void> = [];
    let unsubscribeBoardGoals: Array<() => void> = [];

    const itemMap = new Map<string, FinanceItem>();
    const boardMap = new Map<string, FinanceBoard>();
    const goalMap = new Map<string, FinanceSavingsGoal>();
    const inviteMap = new Map<string, FinanceBoardInvite>();
    const publishItems = () => setItems(Array.from(itemMap.values()));
    const publishGoals = () => setGoals(Array.from(goalMap.values()));
    const publishInvites = () => setInvites(Array.from(inviteMap.values()));

    const clearBoardItemListeners = () => {
      unsubscribeBoardItems.forEach((unsubscribe) => unsubscribe());
      unsubscribeBoardItems = [];
    };
    const clearBoardGoalListeners = () => {
      unsubscribeBoardGoals.forEach((unsubscribe) => unsubscribe());
      unsubscribeBoardGoals = [];
    };

    const applySnapshot = (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") {
          itemMap.delete(change.doc.id);
          return;
        }

        itemMap.set(change.doc.id, mapFinanceItem(change.doc));
      });
      publishItems();
    };

    const rebuildBoardListeners = () => {
      clearBoardItemListeners();
      clearBoardGoalListeners();
      Array.from(itemMap.entries()).forEach(([id, item]) => {
        if (item.boardId) itemMap.delete(id);
      });
      goalMap.clear();
      publishItems();
      publishGoals();

      boardMap.forEach((board) => {
        const unsubscribeBoardItemsListener = onSnapshot(
          query(
            collection(db, "finance_items"),
            where("boardId", "==", board.id),
            where("date", "<=", dueSoonLimit),
          ),
          applySnapshot,
          () => undefined,
        );
        unsubscribeBoardItems.push(unsubscribeBoardItemsListener);

        const unsubscribeBoardGoalsListener = onSnapshot(
          query(collection(db, "finance_goals"), where("boardId", "==", board.id)),
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "removed") {
                goalMap.delete(change.doc.id);
                return;
              }
              goalMap.set(change.doc.id, mapFinanceSavingsGoal(change.doc));
            });
            publishGoals();
          },
          () => undefined,
        );
        unsubscribeBoardGoals.push(unsubscribeBoardGoalsListener);
      });
    };

    const applyBoardSnapshot = (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") {
          boardMap.delete(change.doc.id);
          return;
        }
        boardMap.set(change.doc.id, mapFinanceBoard(change.doc));
      });
      rebuildBoardListeners();
    };

    const applyInviteSnapshot = (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") {
          inviteMap.delete(change.doc.id);
          return;
        }
        const invite = mapFinanceBoardInvite(change.doc);
        if (invite.status === "pending") {
          inviteMap.set(invite.id, invite);
        } else {
          inviteMap.delete(invite.id);
        }
      });
      publishInvites();
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribePersonalItems?.();
      unsubscribePersonalItems = null;
      unsubscribeMemberBoards?.();
      unsubscribeMemberBoards = null;
      unsubscribeOwnedBoards?.();
      unsubscribeOwnedBoards = null;
      unsubscribeCards?.();
      unsubscribeCards = null;
      unsubscribeEmailInvites?.();
      unsubscribeEmailInvites = null;
      unsubscribeOwnerInvites?.();
      unsubscribeOwnerInvites = null;
      clearBoardItemListeners();
      clearBoardGoalListeners();
      itemMap.clear();
      boardMap.clear();
      goalMap.clear();
      inviteMap.clear();

      if (!user) {
        setAvailable(false);
        setItems([]);
        setCards([]);
        setGoals([]);
        setInvites([]);
        return;
      }

      setAvailable(true);

      unsubscribePersonalItems = onSnapshot(
        query(
          collection(db, "finance_items"),
          where("userId", "==", user.uid),
          where("date", "<=", dueSoonLimit),
        ),
        applySnapshot,
        () => {
          itemMap.clear();
          setItems([]);
        },
      );

      unsubscribeCards = onSnapshot(
        query(collection(db, "finance_cards"), where("userId", "==", user.uid)),
        (snapshot) => {
          const nextCards: FinanceCard[] = [];
          snapshot.forEach((cardDoc) => nextCards.push(mapFinanceCard(cardDoc)));
          setCards(nextCards);
        },
        () => setCards([]),
      );

      if (user.email) {
        unsubscribeEmailInvites = onSnapshot(
          query(
            collection(db, "finance_board_invites"),
            where("status", "==", "pending"),
            where("email", "==", user.email.toLowerCase()),
          ),
          applyInviteSnapshot,
          () => undefined,
        );
      }

      unsubscribeOwnerInvites = onSnapshot(
        query(
          collection(db, "finance_board_invites"),
          where("status", "==", "pending"),
          where("ownerId", "==", user.uid),
        ),
        applyInviteSnapshot,
        () => undefined,
      );

      unsubscribeMemberBoards = onSnapshot(
        query(
          collection(db, "finance_boards"),
          where("memberIds", "array-contains", user.uid),
        ),
        applyBoardSnapshot,
        () => undefined,
      );

      unsubscribeOwnedBoards = onSnapshot(
        query(
          collection(db, "finance_boards"),
          where("ownerId", "==", user.uid),
        ),
        applyBoardSnapshot,
        () => undefined,
      );
    });

    return () => {
      unsubscribePersonalItems?.();
      unsubscribeMemberBoards?.();
      unsubscribeOwnedBoards?.();
      unsubscribeCards?.();
      unsubscribeEmailInvites?.();
      unsubscribeOwnerInvites?.();
      clearBoardItemListeners();
      clearBoardGoalListeners();
      unsubscribeAuth();
    };
  }, [dueSoonLimit]);

  const overdueItems = items.filter(
    (item) => isOpenItem(item) && item.date < today,
  );
  const dueTomorrowItems = items.filter(
    (item) => isOpenItem(item) && item.date === tomorrow,
  );
  const dueSoonItems = items.filter(
    (item) =>
      isOpenItem(item) &&
      item.date >= today &&
      item.date <= dueSoonLimit &&
      item.date !== tomorrow,
  );
  const partialItems = items.filter(
    (item) => !item.isSynthetic && item.status === "partial" && getOpenAmount(item) > 0,
  );

  const pendingInvites = invites.filter((invite) => invite.status === "pending");
  const completedGoals = goals.filter((goal) => goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount);
  const cardDueRows = cards
    .filter((card) => card.mode === "credit" && !!card.dueDay)
    .map((card) => {
      const todayDate = new Date();
      const dueDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), Number(card.dueDay));
      const dateKey = format(dueDate, "yyyy-MM-dd");
      return {
        id: card.id,
        title: card.lastDigits ? `${card.name} final ${card.lastDigits}` : card.name,
        date: dateKey,
        href: `/${locale}/tools/finance?view=cards`,
      };
    })
    .filter((card) => card.date <= dueSoonLimit);

  const overdueCardRows = cardDueRows.filter((card) => card.date < today);
  const dueSoonCardRows = cardDueRows.filter((card) => card.date >= today);

  const inviteRows: NotificationRow[] = pendingInvites.map((invite) => ({
    id: invite.id,
    title: invite.boardName,
    date: invite.createdAt.slice(0, 10),
    href: `/${locale}/tools/finance`,
  }));
  const completedGoalRows: NotificationRow[] = completedGoals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    date: goal.deadline || goal.createdAt.slice(0, 10),
    href: `/${locale}/tools/finance?boardId=${encodeURIComponent(goal.boardId)}&view=goals`,
  }));

  const notificationCount = new Set(
    [
      ...overdueItems.map((item) => `item:${item.id}`),
      ...dueTomorrowItems.map((item) => `item:${item.id}`),
      ...dueSoonItems.map((item) => `item:${item.id}`),
      ...partialItems.map((item) => `item:${item.id}`),
      ...pendingInvites.map((invite) => `invite:${invite.id}`),
      ...overdueCardRows.map((card) => `card:${card.id}:overdue`),
      ...dueSoonCardRows.map((card) => `card:${card.id}:soon`),
      ...completedGoals.map((goal) => `goal:${goal.id}`),
    ],
  ).size;

  if (!available) return null;

  const sortByDueDate = (left: FinanceItem, right: FinanceItem) =>
    left.date.localeCompare(right.date) || left.title.localeCompare(right.title);

  const renderNotificationGroup = (
    rows: FinanceItem[],
    label: string,
    className: string,
    filter: { due?: string; status?: string },
  ) => {
    const previewRows = rows.toSorted(sortByDueDate).slice(0, NOTIFICATION_PREVIEW_LIMIT);
    const hiddenCount = Math.max(rows.length - previewRows.length, 0);

    return (
      <div className="rounded-lg border border-[var(--color-border)] p-2">
        <p className={`font-semibold ${className}`}>{label}</p>
        <div className="mt-1 space-y-1">
          {previewRows.map((item) => (
            <Link
              key={item.id}
              href={getFinanceNotificationHref(item, locale, filter)}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[11px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
            >
              <span className="min-w-0 truncate">{item.title}</span>
              <span className="shrink-0 text-[var(--color-text-muted)]">{item.date}</span>
            </Link>
          ))}
        </div>
        {hiddenCount > 0 && (
          <p className="mt-1 px-2 text-[11px] text-[var(--color-text-muted)]">
            {t("notificationMoreItems", { count: hiddenCount })}
          </p>
        )}
      </div>
    );
  };

  const renderRowNotificationGroup = (
    rows: NotificationRow[],
    label: string,
    className: string,
  ) => {
    const previewRows = rows
      .toSorted((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title))
      .slice(0, NOTIFICATION_PREVIEW_LIMIT);
    const hiddenCount = Math.max(rows.length - previewRows.length, 0);

    return (
      <div className="rounded-lg border border-[var(--color-border)] p-2">
        <p className={`font-semibold ${className}`}>{label}</p>
        <div className="mt-1 space-y-1">
          {previewRows.map((row) => (
            <Link
              key={row.id}
              href={row.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[11px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
            >
              <span className="min-w-0 truncate">{row.title}</span>
              <span className="shrink-0 text-[var(--color-text-muted)]">{row.date}</span>
            </Link>
          ))}
        </div>
        {hiddenCount > 0 && (
          <p className="mt-1 px-2 text-[11px] text-[var(--color-text-muted)]">
            {t("notificationMoreItems", { count: hiddenCount })}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`relative rounded-xl border p-2 transition ${
          notificationCount > 0
            ? "finance-info-soft"
            : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)]"
        }`}
        aria-label={t("notificationsTitle")}
        title={t("notificationsTitle")}
      >
        <FiBell size={18} />
        {notificationCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
            {notificationCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[70] mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border finance-surface p-3 text-xs shadow-lg">
          <p className="font-bold text-[var(--color-text-primary)]">
            {t("notificationsTitle")}
          </p>
          {notificationCount === 0 ? (
            <p className="mt-2 text-[var(--color-text-muted)]">
              {t("notificationsEmpty")}
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {overdueItems.length > 0 && (
                renderNotificationGroup(
                  overdueItems,
                  t("notificationOverdue", { count: overdueItems.length }),
                  "finance-warning-text",
                  { due: "overdue" },
                )
              )}
              {dueTomorrowItems.length > 0 && (
                renderNotificationGroup(
                  dueTomorrowItems,
                  t("notificationDueTomorrow", { count: dueTomorrowItems.length }),
                  "text-[var(--color-accent-text)]",
                  { due: "tomorrow" },
                )
              )}
              {dueSoonItems.length > 0 && (
                renderNotificationGroup(
                  dueSoonItems,
                  t("notificationDueSoon", { count: dueSoonItems.length }),
                  "text-[var(--color-accent-text)]",
                  { due: "next7" },
                )
              )}
              {partialItems.length > 0 && (
                renderNotificationGroup(
                  partialItems,
                  t("notificationPartial", { count: partialItems.length }),
                  "text-[var(--color-text-secondary)]",
                  { status: "partial" },
                )
              )}
              {pendingInvites.length > 0 && (
                renderRowNotificationGroup(
                  inviteRows,
                  t("notificationInvites", { count: pendingInvites.length }),
                  "text-[var(--color-accent-text)]",
                )
              )}
              {overdueCardRows.length > 0 && (
                renderRowNotificationGroup(
                  overdueCardRows,
                  t("notificationCardOverdue", { count: overdueCardRows.length }),
                  "finance-warning-text",
                )
              )}
              {dueSoonCardRows.length > 0 && (
                renderRowNotificationGroup(
                  dueSoonCardRows,
                  t("notificationCardDueSoon", { count: dueSoonCardRows.length }),
                  "text-[var(--color-accent-text)]",
                )
              )}
              {completedGoals.length > 0 && (
                renderRowNotificationGroup(
                  completedGoalRows,
                  t("notificationGoalsReached", { count: completedGoals.length }),
                  "finance-success-text",
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
