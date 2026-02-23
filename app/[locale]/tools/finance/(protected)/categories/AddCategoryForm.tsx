"use client";

import { useState, useTransition, useRef } from "react";
import { FiPlus, FiCheck } from "react-icons/fi";
import { createCategory } from "../actions";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function AddCategoryForm({ locale, boardId }: { locale: string; boardId?: string }) {
    const [isPending, startTransition] = useTransition();
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const t = useTranslations("FinanceForm"); // Reusing FinanceForm translations

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        startTransition(async () => {
            const res = await createCategory(trimmed, locale, boardId);
            if (res?.error) {
                alert(res.error);
            } else {
                setName("");
                setIsAdding(false);
                router.refresh();
            }
        });
    };

    if (!isAdding) {
        return (
            <button
                onClick={() => {
                    setIsAdding(true);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="w-full py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-dashed border-blue-200 transition-all"
            >
                <FiPlus size={18} />
                {t("addCategory")}
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1">
            <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("customCategoryPlaceholder")}
                className="flex-1 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                disabled={isPending}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        setIsAdding(false);
                        setName("");
                    }
                }}
            />
            <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheck size={16} />}
            </button>
        </form>
    );
}
