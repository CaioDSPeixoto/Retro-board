"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useModalA11y } from "@/hooks/useModalA11y";

type Props = {
    isOpen: boolean;
    onSave: (name: string) => void;
};

export default function NameModal({ isOpen, onSave }: Props) {
    const t = useTranslations("Retroboard");
    const [name, setName] = useState("");
    const modalRef = useModalA11y(isOpen, () => {});

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div
                ref={modalRef}
                className="rounded-xl shadow-xl p-6 w-full max-w-md border"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
                <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
                    {t("userName.label") || "Como você quer ser chamado?"}
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder={t("userName.placeholder") || "Digite seu nome..."}
                        className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                            background: "var(--color-surface-raised)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-primary)",
                        }}
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
