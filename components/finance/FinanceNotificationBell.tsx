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
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from "firebase/firestore";
import { useTranslations } from "next-intl";
import { auth, db } from "@/lib/firebase";
import type { FinanceItem } from "@/types/finance";
import { mapFinanceItem } from "@/lib/finance/schema";

function isOpenItem(item: FinanceItem) {
  return !item.isSynthetic && item.status !== "paid" && item.status !== "moved";
}

type Props = {
  locale: string;
};

function getFinanceNotificationHref(
  item: FinanceItem,
  locale: string,
  filter: { accountsDue?: string; accountsStatus?: string },
) {
  const params = new URLSearchParams({
    month: item.date.slice(0, 7),
    view: "accounts",
  });
  if (item.boardId) params.set("boardId", item.boardId);
  if (filter.accountsDue) params.set("accountsDue", filter.accountsDue);
  if (filter.accountsStatus) params.set("accountsStatus", filter.accountsStatus);
  return `/${locale}/tools/finance?${params.toString()}`;
}

export default function FinanceNotificationBell({ locale }: Props) {
  const t = useTranslations("FinancePage");
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(false);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const dueSoonLimit = useMemo(() => format(addDays(new Date(), 3), "yyyy-MM-dd"), []);

  useEffect(() => {
    let unsubscribePersonalItems: (() => void) | null = null;
    let unsubscribeBoards: (() => void) | null = null;
    let unsubscribeBoardItems: Array<() => void> = [];

    const itemMap = new Map<string, FinanceItem>();
    const publishItems = () => setItems(Array.from(itemMap.values()));

    const clearBoardItemListeners = () => {
      unsubscribeBoardItems.forEach((unsubscribe) => unsubscribe());
      unsubscribeBoardItems = [];
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

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribePersonalItems?.();
      unsubscribePersonalItems = null;
      unsubscribeBoards?.();
      unsubscribeBoards = null;
      clearBoardItemListeners();
      itemMap.clear();

      if (!user) {
        setAvailable(false);
        setItems([]);
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

      unsubscribeBoards = onSnapshot(
        query(
          collection(db, "finance_boards"),
          where("memberIds", "array-contains", user.uid),
        ),
        (snapshot) => {
          clearBoardItemListeners();
          Array.from(itemMap.entries()).forEach(([id, item]) => {
            if (item.boardId) itemMap.delete(id);
          });
          publishItems();

          snapshot.forEach((boardDoc: QueryDocumentSnapshot<DocumentData, DocumentData>) => {
            const unsubscribeBoardListener = onSnapshot(
              query(
                collection(db, "finance_items"),
                where("boardId", "==", boardDoc.id),
                where("date", "<=", dueSoonLimit),
              ),
              applySnapshot,
              () => undefined,
            );
            unsubscribeBoardItems.push(unsubscribeBoardListener);
          });
        },
      );
    });

    return () => {
      unsubscribePersonalItems?.();
      unsubscribeBoards?.();
      clearBoardItemListeners();
      unsubscribeAuth();
    };
  }, [dueSoonLimit]);

  const overdueItems = items.filter(
    (item) => isOpenItem(item) && item.date < today,
  );
  const dueSoonItems = items.filter(
    (item) => isOpenItem(item) && item.date >= today && item.date <= dueSoonLimit,
  );
  const partialItems = items.filter(
    (item) => !item.isSynthetic && item.status === "partial",
  );
  const notificationCount = new Set(
    [...overdueItems, ...dueSoonItems, ...partialItems].map((item) => item.id),
  ).size;

  if (!available) return null;

  const firstOverdueItem = overdueItems.toSorted((a, b) => a.date.localeCompare(b.date))[0];
  const firstDueSoonItem = dueSoonItems.toSorted((a, b) => a.date.localeCompare(b.date))[0];
  const firstPartialItem = partialItems.toSorted((a, b) => a.date.localeCompare(b.date))[0];

  const renderNotificationLink = (
    item: FinanceItem | undefined,
    label: string,
    className: string,
    filter: { accountsDue?: string; accountsStatus?: string },
  ) => {
    if (!item) return null;

    return (
      <Link
        href={getFinanceNotificationHref(item, locale, filter)}
        onClick={() => setOpen(false)}
        className={`block rounded-lg px-2 py-1.5 font-semibold transition hover:bg-[var(--color-surface-raised)] ${className}`}
      >
        {label}
      </Link>
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
                renderNotificationLink(
                  firstOverdueItem,
                  t("notificationOverdue", { count: overdueItems.length }),
                  "finance-warning-text",
                  { accountsDue: "overdue" },
                )
              )}
              {dueSoonItems.length > 0 && (
                renderNotificationLink(
                  firstDueSoonItem,
                  t("notificationDueSoon", { count: dueSoonItems.length }),
                  "text-[var(--color-accent-text)]",
                  { accountsDue: "next7" },
                )
              )}
              {partialItems.length > 0 && (
                renderNotificationLink(
                  firstPartialItem,
                  t("notificationPartial", { count: partialItems.length }),
                  "text-[var(--color-text-secondary)]",
                  { accountsStatus: "partial" },
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
