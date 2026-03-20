"use client";

import { useState, useTransition, useRef } from "react";
import { FiPlus, FiCheck, FiX } from "react-icons/fi";
import { createCategory } from "../actions";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function AddCategoryForm({ locale, boardId }: { locale: string; boardId?: string }) {
    const [isPending, startTransition] = useTransition();
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const t = useTranslations("FinanceForm");

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        startTransition(async () => {
            const res = await createCategory(trimmed, locale, boardId);
            if (res?.error) {
                setError(res.error);
            } else {
                setName("");
                setError(null);
                setIsAdding(false);
                router.refresh();
            }
        });
    };

    const handleCancel = () => {
        setIsAdding(false);
        setName("");
        setError(null);
    };

    if (!isAdding) {
        return (
            <button
                onClick={() => {
                    setIsAdding(true);
                    setError(null);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="w-full py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-accent-text)] hover:opacity-80 rounded-xl border border-dashed border-[var(--color-accent-primary)] bg-[var(--color-accent-subtle)] transition-all"
            >
                <FiPlus size={16} />
                {t("addCategory")}
            </button>
        );
    }

    return (
        <div className="space-y-2">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
                    placeholder={t("customCategoryPlaceholder")}
                    className="flex-1 px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    disabled={isPending}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") handleCancel();
                    }}
                />
                <button
                    type="submit"
                    disabled={isPending || !name.trim()}
                    className="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                    {isPending
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><FiCheck size={15} /> {t("addCategory")}</>}
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="h-10 w-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
                >
                    <FiX size={16} />
                </button>
            </form>

            {error && (
                <p className="text-xs text-red-500 px-1" role="status" aria-live="polite">{error}</p>
            )}
        </div>
    );
}
