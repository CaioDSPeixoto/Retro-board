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
  FiSliders,
  FiEye,
  FiX,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  deleteFinanceItem,
  applyPaymentToFinanceItem,
  revertFinanceItemPayment,
} from "@/app/[locale]/tools/finance/(protected)/actions";
import Spinner from "@/components/ui/Spinner";
import SubItemsList from "@/components/finance/SubItemsList";

type Props = {
  item: FinanceItem;
  locale: string;
  onEdit?: (item: FinanceItem) => void;
  onRedistribute?: (installmentGroupId: string) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelection?: (itemId: string) => void;
};

export default function FinanceItemCard({
  item,
  locale,
  onEdit,
  onRedistribute,
  selectionMode,
  selected,
  onToggleSelection,
}: Props) {
  const router = useRouter();
  const t = useTranslations("Finance");

  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<"delete" | "revert" | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<"full" | "partial" | "move">(
    "full",
  );
  const [partialValue, setPartialValue] = useState("");

  const isIncome = item.type === "income";
  const isPaid = item.status === "paid";
  const isPartial = item.status === "partial";
  const isMoved = item.status === "moved";
  const isSynthetic = item.isSynthetic === true;

  const paidAmount = item.paidAmount || 0;
  const originalAmount = item.originalAmount ?? item.amount;
  const openAmount = isMoved
    ? 0
    : Math.max(item.amount - paidAmount, 0);

  const isRolled = !!item.carriedFromMonth;
  const isInstallment = !!item.installmentGroupId;

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

  const handleDeleteClick = () => {
    if (!canDelete || toggling || deleting) return;
    setActionError(null);
    setConfirmKind("delete");
  };

  const handleToggle = () => {
    if (isSynthetic || isMoved || toggling || deleting) return;

    // Reverter quitaÃ§Ã£o somente quando for pagamento total
    // (lanÃ§amentos "parcialmente pagos" podem estar com status="paid", mas com originalAmount > amount)
    if (isPaid && originalAmount <= item.amount && (item.paidAmount || 0) >= item.amount) {
      setActionError(null);
      setConfirmKind("revert");
      return;
    }

    setActionError(null);
    setPaymentMode("full");
    setPartialValue("");
    setPaymentModalOpen(true);
  };

  const handleConfirmRevert = async () => {
    if (isSynthetic || isMoved || toggling || deleting) return;

    try {
      setToggling(true);
      setActionError(null);

      const res = await revertFinanceItemPayment(item.id, locale);
      if (res && "error" in res && res.error) {
        setActionError(res.error as string);
        return;
      }

      setConfirmKind(null);
      router.refresh();
    } catch {
      setActionError(t("errors.toggleFailed"));
    } finally {
      setToggling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!canDelete || toggling || deleting) return;

    try {
      setDeleting(true);
      setActionError(null);

      const res = await deleteFinanceItem(item.id, locale);
      if (res && "error" in res && res.error) {
        setActionError(res.error as string);
        return;
      }

      setConfirmKind(null);
      router.refresh();
    } catch {
      setActionError(t("errors.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (isSynthetic || toggling) return;

    try {
      setToggling(true);
      setActionError(null);

      const res = await applyPaymentToFinanceItem(
        item.id,
        paymentMode,
        paymentMode === "partial" ? partialValue : null,
        locale,
      );

      if (res && "error" in res && res.error) {
        setActionError(res.error as string);
        return;
      }

      setPaymentModalOpen(false);
      router.refresh();
    } catch {
      setActionError(t("errors.toggleFailed"));
    } finally {
      setToggling(false);
    }
  };

  const handleEditClick = () => {
    if (!onEdit || isSynthetic) return;
    onEdit(item);
  };

  const canToggle = !isSynthetic && !isMoved;
  const canShowToggleButton =
    canToggle &&
    (item.status === "pending" ||
      (item.status === "paid" &&
        paidAmount >= item.amount &&
        originalAmount <= item.amount));
  const canDelete =
    !isSynthetic && !isMoved && !isRolled && !isInstallment && !isPaid && !isPartial;

  return (
    <>
      {/* CARD */}
      <div
        className={`p-4 rounded-xl shadow-sm border flex items-center justify-between gap-3 mb-3 transition-colors ${!isPaid && !isMoved && item.date < new Date().toISOString().split("T")[0]
          ? "bg-amber-50 border-amber-200"
          : "bg-[var(--color-surface)] border-[var(--color-border)]"
          } ${selected ? "ring-2 ring-blue-500 bg-[var(--color-accent-subtle)]" : ""}`}
        onClick={() => selectionMode && onToggleSelection && onToggleSelection(item.id)}
      >
        {selectionMode ? (
          <div className="mr-1">
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selected ? "bg-blue-600 border-blue-600" : "bg-[var(--color-surface)] border-[var(--color-border)]"}`}>
              {selected && <FiCheckCircle className="text-white" size={14} />}
            </div>
          </div>
        ) : (
          <div
            className={`p-3 rounded-full ${isIncome
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
              }`}
          >
            {isIncome ? <FiArrowUp size={20} /> : <FiArrowDown size={20} />}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[var(--color-text-primary)] truncate">{item.title}</h3>

            {item.isFixed && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                {t("fixedLabel")}
              </span>
            )}
            {isRolled && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                {t("rolledFromMonth", { month: item.carriedFromMonth || "" })}
              </span>
            )}
            {isMoved && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-[var(--color-accent-text)] border border-blue-500/20">
                {t("movedBadge")}
              </span>
            )}
            {isSynthetic && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                {t("syntheticLabel")}
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--color-text-muted)] capitalize">
            {format(parseISO(item.date), "P", { locale: dateLocale })}
          </p>

          <Link
            href={`/${locale}/tools/finance/categories/${encodeURIComponent(item.category)}?month=${monthParam}${boardParam}`}
            className="text-[11px] text-[var(--color-accent-text)] mt-1 hover:underline inline-block"
            onClick={(e) => selectionMode && e.preventDefault()}
          >
            {item.category}
          </Link>

          {item.createdByName && (
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
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

          {openAmount > 0 && item.status !== "paid" && !isMoved && (
            <p className="text-[11px] text-amber-700">
              {t("openAmount", {
                value: formatCurrency(openAmount),
              })}
            </p>
          )}
        </div>

        <div className="text-right flex flex-col items-end gap-1">
          <span
            className={`font-bold ${isIncome ? "text-green-600" : "text-red-600"
              }`}
          >
            {isIncome ? "+ " : "- "}
            {formatCurrency(item.amount)}
          </span>

          {!!item.interestAmount && item.interestAmount > 0 && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {formatCurrency(item.amount - item.interestAmount)}
              </span>
              <span className="text-[10px] text-amber-600 font-medium">
                {t("interestAmountDisplay", {
                  value: formatCurrency(item.interestAmount),
                })}
              </span>
            </div>
          )}

          <div className="text-[11px] text-[var(--color-text-muted)]">
            {item.status === "paid" && (
              <span className="text-green-500 font-semibold">
                {item.originalAmount && item.originalAmount > item.amount
                  ? t("statusPartial")
                  : isIncome ? t("statusReceived") : t("statusPaid")}
              </span>
            )}
            {item.status === "pending" && (
              <span className="text-amber-500 font-semibold">{t("statusPending")}</span>
            )}
            {item.status === "partial" && (
              <span className="text-[var(--color-accent-text)] font-semibold">{t("statusPartial")}</span>
            )}
            {item.status === "moved" && (
              <span className="text-[var(--color-accent-text)] font-semibold">{t("statusMoved")}</span>
            )}
          </div>

          {!isSynthetic && !selectionMode && (
            <div className="flex items-center gap-3 mt-1">
              {canShowToggleButton && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                  disabled={toggling || deleting}
                  className={`${isPaid ? "text-green-500" : "text-[var(--color-text-muted)]"} hover:text-green-500 transition disabled:opacity-60 disabled:cursor-wait`}
                  aria-label={t("togglePaidAria")}
                >
                  {toggling ? <Spinner size="sm" color="gray" /> : isPaid ? <FiCheckCircle size={18} /> : <FiCircle size={18} />}
                </button>
              )}
              {isInstallment && onRedistribute && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRedistribute(item.installmentGroupId!); }}
                  disabled={toggling || deleting}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={t("redistributeAria")}
                >
                  <FiSliders size={16} />
                </button>
              )}
              {onEdit && !isPaid && !isPartial && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditClick(); }}
                  disabled={toggling || deleting}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={t("editAria")}
                >
                  <FiEdit2 size={16} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] transition"
                aria-label={t("detailAria")}
              >
                <FiEye size={16} />
              </button>
              {canDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(); }}
                  disabled={toggling || deleting}
                  className="text-[var(--color-text-muted)] hover:text-red-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={t("deleteAria")}
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHES */}
      {detailOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border"
            style={{
              background: "var(--color-surface-overlay)",
              borderColor: "var(--color-border)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                {t("detailTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition"
                aria-label={t("detailClose")}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Info */}
            <div className="px-5 pb-4 space-y-3">
              {/* Título + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`p-2 rounded-full ${isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                  {isIncome ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
                </div>
                <span className="font-bold text-[var(--color-text-primary)]">{item.title}</span>
                {item.isFixed && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    {t("fixedLabel")}
                  </span>
                )}
                {isRolled && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    {t("rolledFromMonth", { month: item.carriedFromMonth || "" })}
                  </span>
                )}
                {isMoved && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-[var(--color-accent-text)] border border-blue-500/20">
                    {t("movedBadge")}
                  </span>
                )}
              </div>

              {/* Campos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("detailAmount")}</p>
                  <p className={`text-sm font-bold ${isIncome ? "text-green-600" : "text-red-600"}`}>
                    {isIncome ? "+ " : "- "}{formatCurrency(item.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("detailDate")}</p>
                  <p className="text-sm text-[var(--color-text-primary)]">
                    {format(parseISO(item.date), "P", { locale: dateLocale })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("detailCategory")}</p>
                  <p className="text-sm text-[var(--color-accent-text)]">{item.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("detailStatus")}</p>
                  <p className="text-sm">
                    {item.status === "paid" && <span className="text-green-500 font-semibold">{isIncome ? t("statusReceived") : t("statusPaid")}</span>}
                    {item.status === "pending" && <span className="text-amber-500 font-semibold">{t("statusPending")}</span>}
                    {item.status === "partial" && <span className="text-[var(--color-accent-text)] font-semibold">{t("statusPartial")}</span>}
                    {item.status === "moved" && <span className="text-[var(--color-accent-text)] font-semibold">{t("statusMoved")}</span>}
                  </p>
                </div>
              </div>

              {/* Juros */}
              {!!item.interestAmount && item.interestAmount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">{t("detailInterest")}</p>
                  <p className="text-sm text-amber-700 font-semibold">
                    {t("interestAmountDisplay", { value: formatCurrency(item.interestAmount) })}
                  </p>
                </div>
              )}

              {/* Parcela */}
              {isInstallment && (
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {t("detailInstallment", { index: item.installmentIndex ?? 1, total: item.installmentTotal ?? 1 })}
                </p>
              )}

              {/* Investimento */}
              {item.investmentCategory && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("detailInvestmentCategory")}</p>
                  <p className="text-sm text-[var(--color-text-primary)]">{item.investmentCategory}</p>
                </div>
              )}

              {/* Lançado por */}
              {item.createdByName && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("detailCreatedBy")}</p>
                  <p className="text-sm text-[var(--color-text-primary)]">{item.createdByName}</p>
                </div>
              )}

              {/* Pagamento parcial */}
              {isPartial && (
                <p className="text-xs text-blue-600">
                  {t("partialPaid", { paid: formatCurrency(paidAmount), total: formatCurrency(item.amount) })}
                </p>
              )}

              {/* Sub-itens */}
              <div className="border-t border-[var(--color-border-subtle)] pt-3">
                <SubItemsList
                  itemId={item.id}
                  parentAmount={item.amount}
                  parentStatus={item.status}
                  locale={locale}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÃ‡ÃƒO (reverter pagamento / excluir) */}
      {confirmKind && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[var(--color-surface-overlay)] w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-[var(--color-border)]">
            <h3
              className={`text-base font-semibold mb-1 ${confirmKind === "delete" ? "text-red-500" : "text-[var(--color-text-primary)]"}`}
            >
              {confirmKind === "delete" ? t("deleteAria") : t("togglePaidAria")}
            </h3>

            <p className="text-sm text-[var(--color-text-secondary)]">
              {confirmKind === "delete"
                ? t("confirmDelete")
                : t("confirmRevertPayment")}
            </p>

            {actionError && (
              <p className="text-xs text-red-500 mt-2">{actionError}</p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  if (toggling || deleting) return;
                  setConfirmKind(null);
                  setActionError(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-surface-raised)]"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={
                  confirmKind === "delete"
                    ? handleConfirmDelete
                    : handleConfirmRevert
                }
                disabled={toggling || deleting}
                className={`px-4 py-2 text-sm font-bold rounded-xl text-white active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ${confirmKind === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {(toggling || deleting) && (
                  <Spinner size="sm" color="white" />
                )}
                {t("confirmAction")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGAMENTO / RECEBIMENTO */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[var(--color-surface-overlay)] w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-[var(--color-border)]">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
              {isIncome ? t("modalReceiveTitle") : t("modalPayTitle")}
            </h3>

            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              {item.title} —{" "}
              <span className={isIncome ? "text-green-500" : "text-red-500"}>
                {formatCurrency(item.amount)}
              </span>
            </p>

            <div className="mt-3 border-t border-[var(--color-border-subtle)] pt-3">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
                <input
                  type="radio"
                  className="w-4 h-4 text-blue-600"
                  checked={paymentMode === "full"}
                  onChange={() => setPaymentMode("full")}
                />
                <span>
                  {t("paymentModalTotal")}{" "}
                  <span className="font-semibold">
                    ({formatCurrency(item.amount)})
                  </span>
                </span>
              </label>

              <div className="mt-3 border-t border-[var(--color-border-subtle)] pt-3">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600"
                    checked={paymentMode === "partial"}
                    onChange={() => setPaymentMode("partial")}
                  />
                  <span>{t("paymentModalPartial")}</span>
                </label>

                {paymentMode === "partial" && (
                  <div className="pl-6 space-y-1">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={partialValue}
                      onChange={(e) => setPartialValue(e.target.value)}
                      placeholder={t("partialPlaceholder")}
                      className="w-full p-2.5 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)] focus:border-blue-500 outline-none text-sm text-[var(--color-text-primary)]"
                    />
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {t("paymentModalPartialHint")}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 border-t border-[var(--color-border-subtle)] pt-3">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600"
                    checked={paymentMode === "move"}
                    onChange={() => setPaymentMode("move")}
                  />
                  <span>{t("paymentModalMoveLabel")}</span>
                </label>
              </div>
            </div>

            {actionError && (
              <p className="text-xs text-red-500 mt-3">{actionError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-surface-raised)]"
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
                  <Spinner size="sm" color="white" />
                )}
                {t("confirmAction")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
