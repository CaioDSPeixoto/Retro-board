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

const NOTIFICATION_PREVIEW_LIMIT = 3;

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
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(false);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrow = useMemo(() => format(addDays(new Date(), 1), "yyyy-MM-dd"), []);
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
    (item) => !item.isSynthetic && item.status === "partial",
  );
  const notificationCount = new Set(
    [...overdueItems, ...dueTomorrowItems, ...dueSoonItems, ...partialItems].map((item) => item.id),
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
