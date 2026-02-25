"use client";

import { useState, useTransition } from "react";
import { FiTrash2, FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { deleteCategory, updateCategory } from "./actions";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function CategoryItem({ category, locale, boardId }: { category: string, locale: string, boardId?: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const t = useTranslations("Finance");

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(category);
    const [error, setError] = useState<string | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const handleDelete = () => {
        setConfirmDeleteOpen(true);
    };

    const handleSave = () => {
        const trimmed = editName.trim();
        if (!trimmed || trimmed === category) {
            setIsEditing(false);
            setEditName(category);
            return;
        }

        startTransition(async () => {
            const res = await updateCategory(category, trimmed, locale, boardId);
            if (res?.error) {
                setError(res.error);
            } else {
                setIsEditing(false);
                setError(null);
                router.refresh();
            }
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditName(category);
    };

    const handleConfirmDelete = () => {
        startTransition(async () => {
            setError(null);
            const res = await deleteCategory(category, locale, boardId);
            if (res?.error) {
                setError(res.error);
            } else {
                setConfirmDeleteOpen(false);
                router.refresh();
            }
        });
    };

    if (isEditing) {
        return (
            <li className="px-4 py-3 bg-blue-50/50">
                <div className="flex items-center justify-between">
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => {
                            setEditName(e.target.value);
                            if (error) setError(null);
                        }}
                        className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all mr-3"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") handleCancel();
                        }}
                    />
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
                            title={t("save")}
                        >
                            {isPending ? <div className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" /> : <FiCheck size={16} />}
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={isPending}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title={t("cancel")}
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="mt-2 text-xs text-red-600" role="status" aria-live="polite">
                        {error}
                    </p>
                )}
            </li>
        );
    }

    return (
        <li className="px-4 py-3 group hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium text-sm">{category}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => {
                            setIsEditing(true);
                            setError(null);
                        }}
                        disabled={isPending}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title={t("edit")}
                    >
                        <FiEdit2 size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title={t("delete")}
                    >
                        <FiTrash2 size={16} />
                    </button>
                </div>
            </div>

            {error && (
                <p className="mt-2 text-xs text-red-600" role="status" aria-live="polite">
                    {error}
                </p>
            )}

            {confirmDeleteOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-900">
                            {t("deleteCategoryTitle")}
                        </h3>
                        <p className="mt-1 text-xs text-gray-600">
                            {t("deleteCategoryMessage", { category })}
                        </p>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setConfirmDeleteOpen(false)}
                                className="px-3 py-2 text-xs rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                                {t("cancel")}
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleConfirmDelete}
                                className="px-3 py-2 text-xs rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-2"
                            >
                                {isPending && (
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                {t("delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </li>
    );
}
