"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { FiX, FiPlus, FiCheck, FiChevronDown } from "react-icons/fi";
import Spinner from "@/components/ui/Spinner";
import {
  addFinanceItem,
  createCategory,
  updateFinanceItem,
} from "@/app/[locale]/tools/finance/(protected)/actions";
import { useRouter } from "next/navigation";
import type { FinanceItem } from "@/types/finance";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useTranslations } from "next-intl";
import { CARD_FIXED_CATEGORY } from "@/lib/finance/constants";

const DEFAULT_CARD_OPTIONS = ["Nubank", "Santander", "Inter", "C6", "Mercado Pago", "XP", "Will Bank", "Havan"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  initialCategories: string[];
  initialItem?: FinanceItem | null;
  boardId?: string | null;
  currentMonth?: string;
};

function getDefaultDateForMonth(currentMonth?: string): string {
  const today = new Date();

  if (!currentMonth || !currentMonth.includes("-")) {
    return today.toISOString().split("T")[0];
  }

  const [yStr, mStr] = currentMonth.split("-");
  const year = Number(yStr);
  const month = Number(mStr);

  if (!year || !month) {
    return today.toISOString().split("T")[0];
  }

  const todayDay = today.getDate();

  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(todayDay, lastDay);

  return `${yStr}-${mStr}-${String(day).padStart(2, "0")}`;
}

export default function FinanceFormModal({
  isOpen,
  onClose,
  locale,
  initialCategories,
  initialItem,
  boardId,
  currentMonth,
}: Props) {
  const t = useTranslations("FinanceForm");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const newCatInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!initialItem;

  const fixedCategoryName = t("fixedCategoryName");

  const [type, setType] = useState<"income" | "expense">(
    initialItem?.type ?? "expense",
  );
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [category, setCategory] = useState<string>(
    initialItem?.category || initialCategories[0] || fixedCategoryName,
  );

  const [newCategory, setNewCategory] = useState("");
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const [useInstallments, setUseInstallments] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [currentUserName, setCurrentUserName] = useState<string>("");

  // cartão
  const [cardName, setCardName] = useState<string>(initialItem?.cardName || "");
  const [cardMode, setCardMode] = useState<"" | "credit" | "debit">(
    initialItem?.cardMode || "",
  );
  const [enableCustomDescription, setEnableCustomDescription] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.displayName) setCurrentUserName(user.displayName.split(" ")[0]);
      else if (user?.email) setCurrentUserName(user.email.split("@")[0]);
      else setCurrentUserName("");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialCategories?.length) return;

    const nextCategories = Array.from(new Set([
      ...initialCategories,
      ...(initialItem?.category ? [initialItem.category] : []),
    ]));

    setCategories(nextCategories);

    if (initialItem) {
      setType(initialItem.type);
      setCategory(initialItem.category || nextCategories[0] || fixedCategoryName);
      setCardName(initialItem.cardName || "");
      setCardMode(initialItem.cardMode || "");
      setEnableCustomDescription(false);
      return;
    }

    setType("expense");
    setCategory(nextCategories[0] || fixedCategoryName);
    setCardName("");
    setCardMode("");
    setEnableCustomDescription(false);
  }, [initialCategories, initialItem?.id, isOpen, fixedCategoryName]);

  // Foca no input quando o formulário de nova categoria abre
  useEffect(() => {
    if (showNewCategoryForm) {
      newCatInputRef.current?.focus();
    }
  }, [showNewCategoryForm]);

  const isCardFixedCategory = category === CARD_FIXED_CATEGORY;

  // default pra cartão fixo
  useEffect(() => {
    if (!isCardFixedCategory || isEditMode) return;

    if (!cardName) {
      setCardName(DEFAULT_CARD_OPTIONS[0] || "");
    }
    if (!cardMode) {
      setCardMode("credit");
    }
  }, [isCardFixedCategory, cardName, cardMode, isEditMode]);

  if (!isOpen) return null;

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;

    setAddingCategory(true);
    setError(null);

    const res = await createCategory(name, locale, boardId || undefined);

    setAddingCategory(false);

    if (res && "error" in res && res.error) {
      setError(res.error as string);
      return;
    }

    setCategories((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setCategory(name);
    setNewCategory("");
    setShowNewCategoryForm(false);

    startTransition(() => router.refresh());
  };

  const showFixedBase = category === fixedCategoryName || initialItem?.isFixed;
  const disableFixedForInstallments = !isEditMode && useInstallments;
  const canUseFixed = showFixedBase && !disableFixedForInstallments;

  const generatedCardDescription =
    isCardFixedCategory && cardName && cardMode
      ? `Cartão ${cardName} - ${cardMode === "credit"
        ? t("cardModeCreditLabel")
        : t("cardModeDebitLabel")
      }`
      : "";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div
        className="relative w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up sm:animate-fade-in shadow-2xl max-h-[90vh] overflow-y-auto border"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {isPending && (
          <div
            className="absolute inset-0 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-t-2xl sm:rounded-2xl"
            style={{ background: "rgba(0,0,0,0.2)" }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-sm border"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <Spinner size="md" color="blue" />
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {t("savingButton")}
              </span>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {isEditMode ? t("editTransactionTitle") : t("newTransactionTitle")}
          </h2>
          <button
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-text-muted)" }}
          >
            <FiX size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {error}
          </div>
        )}

        <form
          action={async (fd) => {
            setError(null);
            fd.set("locale", locale);
            fd.set("type", type);
            fd.set("category", category);
            if (boardId) fd.set("boardId", boardId);
            if (currentUserName) fd.set("createdByName", currentUserName);

            if (isCardFixedCategory && !enableCustomDescription) {
              if (generatedCardDescription) {
                fd.set("title", generatedCardDescription);
              }
              if (cardName) fd.set("cardName", cardName);
              if (cardMode) fd.set("cardMode", cardMode);
            }

            const res = isEditMode
              ? await updateFinanceItem(fd)
              : await addFinanceItem(fd);

            if (res && "error" in res && res.error) {
              setError(res.error as string);
              return;
            }

            startTransition(() => router.refresh());
            onClose();
          }}
          className="flex flex-col gap-4"
        >
          {isEditMode && initialItem && (
            <>
              <input type="hidden" name="id" value={initialItem.id} />
              {initialItem.cardName && (
                <input type="hidden" name="cardName" value={initialItem.cardName} />
              )}
              {initialItem.cardMode && (
                <input type="hidden" name="cardMode" value={initialItem.cardMode} />
              )}
            </>
          )}

          {/* Seletor de Tipo (Receita/Despesa) */}
          <div
            className={`flex p-1 rounded-xl ${showNewCategoryForm ? "opacity-50 pointer-events-none" : ""}`}
            style={{ background: "var(--color-surface-raised)" }}
          >
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === "income" ? "shadow-sm text-green-600" : ""
              }`}
              style={
                type === "income"
                  ? { background: "var(--color-surface)" }
                  : { color: "var(--color-text-muted)" }
              }
            >
              {t("typeIncome")}
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === "expense" ? "shadow-sm text-red-600" : ""
              }`}
              style={
                type === "expense"
                  ? { background: "var(--color-surface)" }
                  : { color: "var(--color-text-muted)" }
              }
            >
              {t("typeExpense")}
            </button>
          </div>

          {/* Seção de Categoria */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 px-1" style={{ color: "var(--color-text-muted)" }}>
                {t("categoryLabel")}
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowNewCategoryForm((prev) => !prev);
                  if (!showNewCategoryForm) setNewCategory("");
                }}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                  showNewCategoryForm ? "text-red-500" : "text-blue-500 hover:text-blue-600"
                }`}
              >
                {showNewCategoryForm ? (
                  <>
                    <FiX size={14} /> {t("cancel")}
                  </>
                ) : (
                  <>
                    <FiPlus size={14} /> {t("addCategory")}
                  </>
                )}
              </button>
            </div>

            {!showNewCategoryForm ? (
              <select
                required
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value !== CARD_FIXED_CATEGORY) {
                    setCardName("");
                    setCardMode("");
                    setEnableCustomDescription(false);
                  }
                }}
                className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all appearance-none"
                style={{
                  background: "var(--color-surface-raised)",
                  color: "var(--color-text-primary)",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1.5em",
                }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                {!categories.includes(CARD_FIXED_CATEGORY) && (
                  <option value={CARD_FIXED_CATEGORY}>
                    {CARD_FIXED_CATEGORY}
                  </option>
                )}
              </select>
            ) : (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <input
                  ref={newCatInputRef}
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={t("customCategoryPlaceholder")}
                  className="flex-1 p-3 rounded-xl border-2 border-blue-400 focus:border-blue-500 outline-none text-sm transition-all"
                  style={{ background: "var(--color-accent-subtle)", color: "var(--color-text-primary)" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim() || addingCategory}
                  className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {addingCategory ? (
                    <Spinner size="md" color="white" />
                  ) : (
                    <FiCheck size={20} />
                  )}
                </button>
              </div>
            )}

            {/* Bloco de cartão fixo */}
            {isCardFixedCategory && (
              <div
                className="mt-2 rounded-xl border p-3 space-y-2"
                style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}
              >
                <p className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                  {t("cardSectionTitle")}
                </p>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
                      {t("cardNameLabel")}
                    </label>
                    <select
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border focus:border-blue-500 focus:outline-none text-sm"
                      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                    >
                      {DEFAULT_CARD_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
                      {t("cardModeLabel")}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCardMode("credit")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                          cardMode === "credit" ? "border-blue-500 text-blue-500" : ""
                        }`}
                        style={cardMode !== "credit" ? { background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" } : { background: "var(--color-accent-subtle)" }}
                      >
                        {t("cardModeCreditLabel")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardMode("debit")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                          cardMode === "debit" ? "border-blue-500 text-blue-500" : ""
                        }`}
                        style={cardMode !== "debit" ? { background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" } : { background: "var(--color-accent-subtle)" }}
                      >
                        {t("cardModeDebitLabel")}
                      </button>
                    </div>
                  </div>
                </div>

                {generatedCardDescription && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div
                      className="flex-1 text-[11px] rounded-lg px-2 py-1.5 border border-dashed"
                      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                    >
                      {generatedCardDescription}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableCustomDescription((prev) => !prev)}
                      className="text-[11px] font-semibold text-blue-500"
                    >
                      {enableCustomDescription ? t("useAutoDescription") : t("editDescriptionButton")}
                    </button>
                  </div>
                )}

                <input type="hidden" name="cardName" value={cardName} />
                <input type="hidden" name="cardMode" value={cardMode} />
              </div>
            )}
          </div>

          {/* Restante do formulário fica "travado" enquanto cria nova categoria */}
          <fieldset
            disabled={showNewCategoryForm || isPending}
            className={
              showNewCategoryForm || isPending
                ? "opacity-50 pointer-events-none"
                : ""
            }
          >
            {/* Descrição */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 px-1" style={{ color: "var(--color-text-muted)" }}>
                {t("descriptionLabel")}
              </label>

              {isCardFixedCategory && !enableCustomDescription ? (
                <>
                  <div
                    className="w-full p-2.5 rounded-xl border border-dashed text-sm"
                    style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                  >
                    {generatedCardDescription || t("descriptionPlaceholder")}
                  </div>
                </>
              ) : (
                <input
                  name="title"
                  required
                  placeholder={t("descriptionPlaceholder")}
                  defaultValue={initialItem?.title ?? ""}
                  className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                  style={{ background: "var(--color-surface-raised)", color: "var(--color-text-primary)" }}
                />
              )}
            </div>

            {/* Valor + Data */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 px-1" style={{ color: "var(--color-text-muted)" }}>
                  {t("amountLabel")}
                </label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  defaultValue={initialItem ? String(initialItem.amount) : ""}
                  className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                  style={{ background: "var(--color-surface-raised)", color: "var(--color-text-primary)" }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 px-1" style={{ color: "var(--color-text-muted)" }}>
                  {t("dateLabel")}
                </label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={initialItem ? initialItem.date : getDefaultDateForMonth(currentMonth)}
                  className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                  style={{ background: "var(--color-surface-raised)", color: "var(--color-text-primary)" }}
                />
              </div>
            </div>

            {/* Toggle Opções Avançadas */}
            {!isEditMode && (
              <>
                <div className="mt-1 px-1">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-500"
              >
                <FiChevronDown
                  className={`transition-transform ${showAdvanced ? "rotate-180" : ""
                    }`}
                  size={14}
                />
                {t("advancedOptionsToggle")}
              </button>
            </div>

            {showAdvanced && (
              <>
                {/* Parcelamento (somente na criação, discreto) */}
                {!isEditMode && (
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center gap-3 p-1">
                      <input
                        type="checkbox"
                        id="useInstallments"
                        checked={useInstallments}
                        onChange={(e) => setUseInstallments(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor="useInstallments"
                        className="text-sm font-medium cursor-pointer select-none"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {t("useInstallmentsLabel")}
                      </label>
                    </div>

                    {useInstallments && (
                      <div className="pl-1">
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 px-1" style={{ color: "var(--color-text-muted)" }}>
                          {t("installmentsLabel")}
                        </label>
                        <input
                          name="installments"
                          type="number"
                          min={1}
                          max={60}
                          defaultValue={1}
                          className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                          style={{ background: "var(--color-surface-raised)", color: "var(--color-text-primary)" }}
                        />
                        <p className="text-[11px] mt-1 px-1" style={{ color: "var(--color-text-muted)" }}>
                          {t("installmentsHint")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pago/Recebido */}
                {!isEditMode && (
                  <div className="flex flex-col gap-1 p-1 mt-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="status"
                        value="paid"
                        id="paid"
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor="paid"
                        className="text-sm font-medium cursor-pointer select-none"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {t("alreadyPaidLabel")}
                      </label>
                    </div>
                    <p className="text-[11px] px-1" style={{ color: "var(--color-text-secondary)" }}>
                      {t("partialPaymentHint")}
                    </p>
                  </div>
                )}

                {/* Fixa */}
                {showFixedBase && (
                  <div className="flex flex-col gap-1 p-1 mt-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="isFixed"
                        value="true"
                        id="isFixed"
                        defaultChecked={false}
                        disabled={!canUseFixed}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <label
                        htmlFor="isFixed"
                        className="text-sm font-medium cursor-pointer select-none"
                        style={{ color: canUseFixed ? "var(--color-text-secondary)" : "var(--color-text-muted)" }}
                      >
                        {t("fixedCheckboxLabel")}
                      </label>
                    </div>
                    {disableFixedForInstallments && (
                      <p className="text-[11px] pl-1" style={{ color: "var(--color-text-muted)" }}>
                        {t("fixedNotAllowedWithInstallments")}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
              </>
            )}

            <button
              type="submit"
              disabled={isPending}
              className={`mt-4 w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] ${type === "income"
                  ? "bg-green-600 hover:bg-green-700 shadow-green-100"
                  : "bg-red-600 hover:bg-red-700 shadow-red-100"
                } disabled:opacity-70`}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="md" color="white" />
                  {t("savingButton")}
                </span>
              ) : isEditMode ? (
                t("saveEditButton")
              ) : (
                t("saveButton")
              )}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
