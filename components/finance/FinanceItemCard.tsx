"use client";

import { useState } from "react";
import type { FinanceItem } from "@/types/finance";
import { format, parseISO } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
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
import {
  deleteFinanceItem,
  applyPaymentToFinanceItem,
} from "@/app/[locale]/tools/finance/(protected)/actions";

type Props = {
  item: FinanceItem;
  locale: string;
  onEdit?: (item: FinanceItem) => void;
};

export default function FinanceItemCard({ item, locale, onEdit }: Props) {
  const router = useRouter();
  const t = useTranslations("Finance");

  const [toggling, setToggling] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"full" | "partial">("full");
  const [partialValue, setPartialValue] = useState("");

  const isIncome = item.type === "income";
  const isPaid = item.status === "paid";
  const isPartial = item.status === "partial";
  const isSynthetic = item.isSynthetic === true;

  const paidAmount = item.paidAmount || 0;
  const openAmount = Math.max(item.amount - paidAmount, 0);

  const isRolled = !!item.carriedFromMonth;

  const monthParam = item.date.slice(0, 7);
  const boardParam = item.boardId
    ? `&boardId=${encodeURIComponent(item.boardId)}`
    : "";

  const dateLocale =
    locale === "pt"
      ? ptBR
      : locale === "es"
      ? es
      : enUS;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

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
    } catch {
      alert(t("errors.deleteFailed"));
    }
  };

  const handleToggle = () => {
    if (isSynthetic || toggling) return;

    setPaymentMode("full");
    setPartialValue("");
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (isSynthetic || toggling) return;

    try {
      setToggling(true);

      const res = await applyPaymentToFinanceItem(
        item.id,
        paymentMode,
        paymentMode === "partial" ? partialValue : null,
        locale,
      );

      if (res && "error" in res && res.error) {
        alert(res.error as string);
        return;
      }

      setPaymentModalOpen(false);
      router.refresh();
    } catch {
      alert(t("errors.toggleFailed"));
    } finally {
      setToggling(false);
    }
  };

  const handleEditClick = () => {
    if (!onEdit || isSynthetic) return;
    onEdit(item);
  };

  return (
    <>
      {/* CARD */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-3 mb-3">
        <div
          className={`p-3 rounded-full ${
            isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          {isIncome ? <FiArrowUp size={20} /> : <FiArrowDown size={20} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>

            {item.isFixed && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                {t("fixedLabel")}
              </span>
            )}

            {isRolled && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
                {t("rolledFromMonth", { month: item.carriedFromMonth || "" })}
              </span>
            )}

            {isSynthetic && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                {t("syntheticLabel")}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 capitalize">
            {format(parseISO(item.date), "P", { locale: dateLocale })}
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
            <p className="text-[11px] text-gray-500 mt-0.5">
              {t("launchedBy", { name: item.createdByName })}
            </p>
          )}

          {isPartial && (
            <p className="text-[11px] text-blue-600 mt-1">
              {t("partialPaid", {
                paid: formatCurrency(paidAmount),
                total: formatCurrency(item.amount),
              })}
            </p>
          )}

          {openAmount > 0 && item.status !== "paid" && (
            <p className="text-[11px] text-amber-700">
              {t("openAmount", {
                value: formatCurrency(openAmount),
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
            {formatCurrency(item.amount)}
          </span>

          <div className="text-[11px] text-gray-600">
            {item.status === "paid" && (
              <span className="text-green-600 font-semibold">
                {item.originalAmount && item.originalAmount > item.amount
                  ? t("statusPartial")
                  : isIncome
                  ? t("statusReceived")
                  : t("statusPaid")}
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
                disabled={toggling}
                className={`${
                  isPaid ? "text-green-500" : "text-gray-400"
                } hover:text-green-600 transition disabled:opacity-60 disabled:cursor-wait`}
                aria-label={t("togglePaidAria")}
              >
                {toggling ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPaid ? (
                  <FiCheckCircle size={18} />
                ) : (
                  <FiCircle size={18} />
                )}
              </button>

              {onEdit && (
                <button
                  onClick={handleEditClick}
                  disabled={toggling}
                  className="text-gray-400 hover:text-blue-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={t("editAria")}
                >
                  <FiEdit2 size={16} />
                </button>
              )}

              <button
                onClick={handleDelete}
                disabled={toggling}
                className="text-gray-400 hover:text-red-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t("deleteAria")}
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE PAGAMENTO / RECEBIMENTO */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {isIncome
                ? t("modalReceiveTitle")
                : t("modalPayTitle")}
            </h3>

            <p className="text-sm text-gray-700 mb-3">
              {item.title} —{" "}
              <span className={isIncome ? "text-green-600" : "text-red-600"}>
                {formatCurrency(item.amount)}
              </span>
            </p>

            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  className="w-4 h-4 text-blue-600"
                  checked={paymentMode === "full"}
                  onChange={() => setPaymentMode("full")}
                />
                <span>
                  Valor total{" "}
                  <span className="font-semibold">
                    ({formatCurrency(item.amount)})
                  </span>
                </span>
              </label>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600"
                    checked={paymentMode === "partial"}
                    onChange={() => setPaymentMode("partial")}
                  />
                  <span>Valor parcial</span>
                </label>

                {paymentMode === "partial" && (
                  <div className="pl-6 space-y-1">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={partialValue}
                      onChange={(e) => setPartialValue(e.target.value)}
                      placeholder="Ex: 500,00"
                      className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-300 focus:bg-white focus:border-blue-500 outline-none text-sm text-gray-900"
                    />
                    <p className="text-[11px] text-gray-600">
                      O valor informado será considerado como pago agora e o
                      restante será lançado automaticamente no mês seguinte.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-100"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={toggling}
                className="px-4 py-2 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {toggling && (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {isIncome
                  ? t("confirmReceive")
                  : t("confirmPay")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
