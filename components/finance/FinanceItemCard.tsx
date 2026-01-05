// components/finance/FinanceItemCard.tsx
"use client";

import { FinanceItem } from "@/types/finance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FiArrowDown,
  FiArrowUp,
  FiCheckCircle,
  FiCircle,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import {
  deleteFinanceItem,
  toggleStatus,
} from "@/app/[locale]/tools/finance/(protected)/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

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
  const openAmount = item.amount - (item.paidAmount || 0);

  const handleDelete = async () => {
    if (isSynthetic) return;
    if (confirm(t("confirmDelete"))) {
      const res = await deleteFinanceItem(item.id, locale);
      if (!("error" in res) || !res.error) {
        router.refresh();
      }
    }
  };

  const handleToggle = async () => {
    if (isSynthetic) return;
    const res = await toggleStatus(item.id, item.status, locale);
    if (!("error" in res) || !res.error) {
      router.refresh();
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
          {item.isRolled && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
              {t("rolledFromMonth", {
                month: item.rolledFromMonth || "",
              })}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-400 capitalize">
          {format(new Date(item.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
        </p>

        <Link
          href={`/${locale}/tools/finance/categories/${encodeURIComponent(item.category)}?month=${item.date.slice(0, 7)}`}
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
              }).format(item.paidAmount || 0),
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
        <span
          className={`font-bold ${
            isIncome ? "text-green-600" : "text-red-600"
          }`}
        >
          {isIncome ? "+ " : "- "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(item.amount)}
        </span>

        <div className="text-[11px] text-gray-500">
          {item.status === "paid" && (
            <span className="text-green-600 font-semibold">
              {t("statusPaid")}
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
            >
              {isPaid ? <FiCheckCircle size={18} /> : <FiCircle size={18} />}
            </button>
            {onEdit && (
              <button
                onClick={handleEditClick}
                className="text-gray-300 hover:text-blue-500 transition"
              >
                <FiEdit2 size={16} />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="text-gray-300 hover:text-red-500 transition"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
