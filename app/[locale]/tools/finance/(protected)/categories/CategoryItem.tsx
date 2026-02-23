"use client";

import { useState, useTransition } from "react";
import { FiTrash2, FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { deleteCategory, updateCategory } from "./actions";
import { useRouter } from "next/navigation";

export function CategoryItem({ category, locale, boardId }: { category: string, locale: string, boardId?: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(category);

    const handleDelete = () => {
        if (!confirm(`Tem certeza que deseja excluir a categoria "${category}"?`)) return;

        startTransition(async () => {
            const res = await deleteCategory(category, locale, boardId);
            if (res?.error) {
                alert(res.error);
            } else {
                router.refresh();
            }
        });
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
                alert(res.error);
            } else {
                setIsEditing(false);
                router.refresh();
            }
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditName(category);
    };

    if (isEditing) {
        return (
            <li className="px-4 py-3 flex items-center justify-between bg-blue-50/50">
                <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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
                        title="Salvar"
                    >
                        {isPending ? <div className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" /> : <FiCheck size={16} />}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isPending}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Cancelar"
                    >
                        <FiX size={16} />
                    </button>
                </div>
            </li>
        );
    }

    return (
        <li className="px-4 py-3 flex items-center justify-between group hover:bg-gray-50 transition-colors">
            <span className="text-gray-700 font-medium text-sm">{category}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setIsEditing(true)}
                    disabled={isPending}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Editar"
                >
                    <FiEdit2 size={16} />
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Excluir"
                >
                    <FiTrash2 size={16} />
                </button>
            </div>
        </li>
    );
}
