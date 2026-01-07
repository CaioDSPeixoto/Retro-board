"use client";

import { FinanceItem, FinanceStatus } from "@/types/finance";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FiArrowDown,
  FiArrowUp,
  FiCheckCircle,
  FiCircle,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { deleteFinanceItem } from "@/app/[locale]/tools/finance/(protected)/actions";

type Props = {
  item: FinanceItem;
  locale: string;
  onEdit?: (item: FinanceItem) => void;
};

export default function FinanceItemCard({ item, locale, onEdit }: Props) {
  const router = useRouter();
  const t = useTranslations("Finance");

  const isIncome = item.type === "income";
  const isPaid = item.status === "paid";
  const isPartial = item.status === "partial";
  const isSynthetic = item.isSynthetic === true;

  const paidAmount = item.paidAmount || 0;
  const openAmount = Math.max(item.amount - paidAmount, 0);

  const isRolled = !!item.carriedFromMonth;

  const monthParam = item.date.slice(0, 7);
  const boardParam = item.boardId ? `&boardId=${encodeURIComponent(item.boardId)}` : "";

  const handleDelete = async () => {
    if (isSynthetic) return;

    if (!confirm(t("confirmDelete"))) return;

    try {
      const res = await deleteFinanceItem(item.id, locale);
      if (res && "error" in res && res.error) {
        alert(res.error as string);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("Erro ao deletar item:", err);
      alert(t("errors.deleteFailed"));
    }
  };

  const handleToggle = async () => {
    if (isSynthetic) return;

    const user = auth.currentUser;
    if (!user) {
      alert(t("errors.mustBeLoggedIn"));
      return;
    }

    try {
      const itemRef = doc(db, "finance_items", item.id);
      const snap = await getDoc(itemRef);
      if (!snap.exists()) {
        alert(t("errors.itemNotFound"));
        return;
      }

      const data = snap.data() as FinanceItem;

      const amount = data.amount;
      const currentStatus = data.status as FinanceStatus;

      let newStatus: FinanceStatus;
      let newPaidAmount = data.paidAmount || 0;

      if (currentStatus === "paid") {
        newStatus = "pending";
        newPaidAmount = 0;
      } else {
        // pending ou partial -> marcar como totalmente pago
        newStatus = "paid";
        newPaidAmount = amount;
      }

      await updateDoc(itemRef, {
        status: newStatus,
        paidAmount: newPaidAmount,
      });

      router.refresh();
    } catch (err) {
      console.error("Erro ao alternar status:", err);
      alert(t("errors.toggleFailed"));
    }
  };

  const handleEditClick = () => {
    if (!onEdit || isSynthetic) return;
    onEdit(item);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-3 mb-3">
      <div
        className={`p-3 rounded-full ${
          isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
        }`}
      >
        {isIncome ? <FiArrowUp size={20} /> : <FiArrowDown size={20} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-800 truncate">{item.title}</h3>

          {item.isFixed && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              {t("fixedLabel")}
            </span>
          )}

          {isRolled && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
              {t("rolledFromMonth", { month: item.carriedFromMonth || "" })}
            </span>
          )}

          {isSynthetic && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
              {t("syntheticLabel")}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-400 capitalize">
          {format(parseISO(item.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
        </p>

        <Link
          href={`/${locale}/tools/finance/categories/${encodeURIComponent(
            item.category,
          )}?month=${monthParam}${boardParam}`}
          className="text-[11px] text-blue-600 mt-1 hover:underline inline-block"
        >
          {item.category}
        </Link>

        {item.createdByName && (
          <p className="text-[11px] text-gray-400 mt-0.5">
            {t("launchedBy", { name: item.createdByName })}
          </p>
        )}

        {isPartial && (
          <p className="text-[11px] text-blue-600 mt-1">
            {t("partialPaid", {
              paid: new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(paidAmount),
              total: new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(item.amount),
            })}
          </p>
        )}

        {openAmount > 0 && item.status !== "paid" && (
          <p className="text-[11px] text-amber-700">
            {t("openAmount", {
              value: new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(openAmount),
            })}
          </p>
        )}
      </div>

      <div className="text-right flex flex-col items-end gap-1">
        <span className={`font-bold ${isIncome ? "text-green-600" : "text-red-600"}`}>
          {isIncome ? "+ " : "- "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(item.amount)}
        </span>

        <div className="text-[11px] text-gray-500">
          {item.status === "paid" && (
            <span className="text-green-600 font-semibold">
              {isIncome ? t("statusReceived") : t("statusPaid")}
            </span>
          )}
          {item.status === "pending" && (
            <span className="text-amber-600 font-semibold">
              {t("statusPending")}
            </span>
          )}
          {item.status === "partial" && (
            <span className="text-blue-600 font-semibold">
              {t("statusPartial")}
            </span>
          )}
        </div>

        {!isSynthetic && (
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={handleToggle}
              className={`${
                isPaid ? "text-green-500" : "text-gray-300"
              } hover:text-green-600 transition`}
              aria-label={t("togglePaidAria")}
            >
              {isPaid ? <FiCheckCircle size={18} /> : <FiCircle size={18} />}
            </button>

            {onEdit && (
              <button
                onClick={handleEditClick}
                className="text-gray-300 hover:text-blue-500 transition"
                aria-label={t("editAria")}
              >
                <FiEdit2 size={16} />
              </button>
            )}

            <button
              onClick={handleDelete}
              className="text-gray-300 hover:text-red-500 transition"
              aria-label={t("deleteAria")}
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
