"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
    isOpen: boolean;
    onSave: (name: string) => void;
};

export default function NameModal({ isOpen, onSave }: Props) {
    const t = useTranslations("Home"); // Reusing Home translations for common terms like "userName"
    const [name, setName] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                    {t("userName.label") || "Como você quer ser chamado?"}
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder={t("userName.placeholder") || "Digite seu nome..."}
                        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t("enterRoom.button") || "Entrar"}
                    </button>
                </form>
            </div>
        </div>
    );
}
