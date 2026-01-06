"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { FiX, FiPlus, FiCheck } from "react-icons/fi"; // Importando ícones novos
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
  const newCatInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!initialItem;

  const [type, setType] = useState<"income" | "expense">(initialItem?.type ?? "expense");
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [category, setCategory] = useState<string>(
    initialItem?.category || initialCategories[0] || "Contas Fixas",
  );

  const [newCategory, setNewCategory] = useState("");
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false); // Controle do Collapse
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

  // Foca no input quando o formulário de nova categoria abre
  useEffect(() => {
    if (showNewCategoryForm) {
      newCatInputRef.current?.focus();
    }
  }, [showNewCategoryForm]);

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
    setShowNewCategoryForm(false); // Fecha o form após criar

    startTransition(() => router.refresh());
  };

  const showFixedOption = category === "Contas Fixas";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up sm:animate-fade-in shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? t("editTransactionTitle") : t("newTransactionTitle")}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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
          {isEditMode && initialItem && <input type="hidden" name="id" value={initialItem.id} />}

          {/* Seletor de Tipo (Receita/Despesa) */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === "income" ? "bg-white text-green-600 shadow-sm" : "text-gray-500"
              }`}
            >
              {t("typeIncome")}
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === "expense" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"
              }`}
            >
              {t("typeExpense")}
            </button>
          </div>

          {/* Seção de Categoria Reformulada */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t("categoryLabel")}
              </label>
              
              {/* Botão de Gatilho para Nova Categoria */}
              <button
                type="button"
                onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                  showNewCategoryForm ? "text-red-500" : "text-blue-600 hover:text-blue-700"
                }`}
              >
                {showNewCategoryForm ? (
                  <><FiX size={14} /> {t("cancel") || "Cancelar"}</>
                ) : (
                  <><FiPlus size={14} /> {t("addCategory") || "Nova"}</>
                )}
              </button>
            </div>

            {!showNewCategoryForm ? (
              // Select normal
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all text-gray-900 appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              // Input de Nova Categoria (Collapse)
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <input
                  ref={newCatInputRef}
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={t("customCategoryPlaceholder")}
                  className="flex-1 p-3 bg-blue-50/50 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none text-gray-900 text-sm transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim() || addingCategory}
                  className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {addingCategory ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiCheck size={20} />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">
              {t("descriptionLabel")}
            </label>
            <input
              name="title"
              required
              placeholder={t("descriptionPlaceholder")}
              defaultValue={initialItem?.title ?? ""}
              className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all text-gray-900"
            />
          </div>

          {/* Valor + Data */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">
                {t("amountLabel")}
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                defaultValue={initialItem ? String(initialItem.amount) : ""}
                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all text-gray-900"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">
                {t("dateLabel")}
              </label>
              <input
                name="date"
                type="date"
                required
                defaultValue={
                  initialItem ? initialItem.date : new Date().toISOString().split("T")[0]
                }
                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all text-gray-900"
              />
            </div>
          </div>

          {/* Pago/Recebido */}
          {!isEditMode && (
            <div className="flex items-center gap-3 p-1">
              <input
                type="checkbox"
                name="status"
                value="paid"
                id="paid"
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="paid" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                {t("alreadyPaidLabel")}
              </label>
            </div>
          )}

          {/* Fixa */}
          {showFixedOption && (
            <div className="flex items-center gap-3 p-1">
              <input
                type="checkbox"
                name="isFixed"
                value="true"
                id="isFixed"
                defaultChecked={initialItem?.isFixed ?? false}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="isFixed" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                {t("fixedCheckboxLabel")}
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={`mt-4 w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] ${
              type === "income"
                ? "bg-green-600 hover:bg-green-700 shadow-green-100"
                : "bg-red-600 hover:bg-red-700 shadow-red-100"
            } disabled:opacity-70`}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t("savingButton")}
              </span>
            ) : isEditMode ? t("saveEditButton") : t("saveButton")}
          </button>
        </form>
      </div>
    </div>
  );
}