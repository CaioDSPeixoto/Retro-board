"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import { addFinanceItem } from "@/app/[locale]/tools/finance/(protected)/actions";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    locale: string;
};

export default function FinanceFormModal({ isOpen, onClose, locale }: Props) {
    const [type, setType] = useState<"income" | "expense">("expense");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        await addFinanceItem(formData);
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up sm:animate-fade-in">

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Novo Lançamento</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FiX size={24} />
                    </button>
                </div>

                <form action={handleSubmit} className="flex flex-col gap-4">
                    <input type="hidden" name="locale" value={locale} />

                    {/* Seletor de Tipo */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setType("income")}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            Receita
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("expense")}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            Despesa
                        </button>
                    </div>
                    <input type="hidden" name="type" value={type} />

                    {/* Inputs */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descrição</label>
                        <input name="title" required placeholder="Ex: Aluguel, Salário..." className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition text-gray-900" />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Valor (R$)</label>
                            <input name="amount" type="number" step="0.01" required placeholder="0,00" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition text-gray-900" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data</label>
                            <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition text-gray-900" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" name="status" value="paid" id="paid" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="paid" className="text-gray-700 select-none">Já foi pago/recebido?</label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-4 w-full py-4 text-white font-bold rounded-xl transition shadow-lg ${type === 'income' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                    >
                        {loading ? "Salvando..." : "Salvar Lançamento"}
                    </button>
                </form>
            </div>
        </div>
    );
}
