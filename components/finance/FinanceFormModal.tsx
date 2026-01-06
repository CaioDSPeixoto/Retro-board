"use client";

import { useEffect, useState, useTransition } from "react";
import { FiX } from "react-icons/fi";
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

type Props = {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  initialCategories: string[];
  initialItem?: FinanceItem | null;
  boardId?: string | null;
};

export default function FinanceFormModal({
  isOpen,
  onClose,
  locale,
  initialCategories,
  initialItem,
  boardId,
}: Props) {
  const t = useTranslations("FinanceForm");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditMode = !!initialItem;

  const [type, setType] = useState<"income" | "expense">(initialItem?.type ?? "expense");
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [category, setCategory] = useState<string>(
    initialItem?.category || initialCategories[0] || "Contas Fixas",
  );

  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const [currentUserName, setCurrentUserName] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.displayName) setCurrentUserName(user.displayName.split(" ")[0]);
      else if (user?.email) setCurrentUserName(user.email.split("@")[0]);
      else setCurrentUserName("");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!initialCategories?.length) return;

    setCategories(initialCategories);

    if (initialItem?.category) {
      setCategory(initialItem.category);
      setType(initialItem.type);
    } else if (!initialCategories.includes(category)) {
      setCategory(initialCategories[0]);
    }
  }, [initialCategories, initialItem, isOpen]);

  if (!isOpen) return null;

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;

    setAddingCategory(true);
    setError(null);

    const res = await createCategory(name, locale);

    setAddingCategory(false);

    if (res && "error" in res && res.error) {
      setError(res.error as string);
      return;
    }

    setCategories((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setCategory(name);
    setNewCategory("");

    startTransition(() => router.refresh());
  };

  const showFixedOption = category === "Contas Fixas";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up sm:animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? t("editTransactionTitle") : t("newTransactionTitle")}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
            {error}
          </div>
        )}

        {/* ✅ usa Server Action diretamente */}
        <form
          action={async (fd) => {
            setError(null);

            // injeta campos que a action espera
            fd.set("locale", locale);
            fd.set("type", type);
            fd.set("category", category);
            if (boardId) fd.set("boardId", boardId);
            if (currentUserName) fd.set("createdByName", currentUserName);

            const res = isEditMode ? await updateFinanceItem(fd) : await addFinanceItem(fd);

            if (res && "error" in res && res.error) {
              setError(res.error as string);
              return;
            }

            startTransition(() => router.refresh());
            onClose();
          }}
          className="flex flex-col gap-4"
        >
          {/* Se for edição, manda o ID */}
          {isEditMode && initialItem && <input type="hidden" name="id" value={initialItem.id} />}

          {/* Tipo */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                type === "income" ? "bg-white text-green-600 shadow-sm" : "text-gray-500"
              }`}
            >
              {t("typeIncome")}
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                type === "expense" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"
              }`}
            >
              {t("typeExpense")}
            </button>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase">
              {t("categoryLabel")}
            </label>

            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition text-gray-900"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="mt-1 p-2 rounded-xl bg-gray-50 border border-dashed border-gray-200">
              <p className="text-[11px] text-gray-500 mb-2">{t("customCategoryHint")}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={t("customCategoryPlaceholder")}
                  className="flex-1 p-2 bg-white rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 disabled:opacity-50 whitespace-nowrap"
                  disabled={!newCategory.trim() || addingCategory}
                >
                  {addingCategory ? t("savingCategory") : t("addCategory")}
                </button>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              {t("descriptionLabel")}
            </label>
            <input
              name="title"
              required
              placeholder={t("descriptionPlaceholder")}
              defaultValue={initialItem?.title ?? ""}
              className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition text-gray-900"
            />
          </div>

          {/* Valor + Data */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                {t("amountLabel")}
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                defaultValue={initialItem ? String(initialItem.amount) : ""}
                className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition text-gray-900"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                {t("dateLabel")}
              </label>
              <input
                name="date"
                type="date"
                required
                defaultValue={
                  initialItem ? initialItem.date : new Date().toISOString().split("T")[0]
                }
                className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition text-gray-900"
              />
            </div>
          </div>

          {/* Pago/Recebido */}
          {!isEditMode && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                name="status"
                value="paid"
                id="paid"
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="paid" className="text-gray-700 select-none">
                {t("alreadyPaidLabel")}
              </label>
            </div>
          )}

          {/* Valor pago (edição) */}
          {isEditMode && (
            <div className="mt-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                {t("paidAmountLabel")}
              </label>
              <input
                name="paidAmount"
                type="number"
                step="0.01"
                defaultValue={initialItem?.paidAmount ?? 0}
                className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition text-gray-900"
              />
              <p className="text-[11px] text-gray-400 mt-1">{t("paidAmountHint")}</p>
            </div>
          )}

          {/* Fixa */}
          {showFixedOption && (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                name="isFixed"
                value="true"
                id="isFixed"
                defaultChecked={initialItem?.isFixed ?? false}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isFixed" className="text-gray-700 select-none">
                {t("fixedCheckboxLabel")}
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={`mt-4 w-full py-4 text-white font-bold rounded-xl transition shadow-lg ${
              type === "income"
                ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                : "bg-red-600 hover:bg-red-700 shadow-red-200"
            } disabled:opacity-70`}
          >
            {isPending ? t("savingButton") : isEditMode ? t("saveEditButton") : t("saveButton")}
          </button>
        </form>
      </div>
    </div>
  );
}