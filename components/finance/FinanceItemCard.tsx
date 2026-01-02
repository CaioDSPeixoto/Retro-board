"use client";

import { FinanceItem } from "@/types/finance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    FiArrowDown,
    FiArrowUp,
    FiCheckCircle,
    FiCircle,
    FiTrash2,
} from "react-icons/fi";
import {
    deleteFinanceItem,
    toggleStatus,
} from "@/app/[locale]/tools/finance/(protected)/actions";
import { useRouter } from "next/navigation";

type Props = {
    item: FinanceItem;
    locale: string;
};

export default function FinanceItemCard({ item, locale }: Props) {
    const router = useRouter();
    const isIncome = item.type === "income";
    const isPaid = item.status === "paid";

    const handleDelete = async () => {
        if (confirm("Tem certeza que deseja apagar?")) {
            const res = await deleteFinanceItem(item.id, locale);
            if (!("error" in res) || !res.error) {
                router.refresh();
            }
        }
    };

    const handleToggle = async () => {
        const res = await toggleStatus(item.id, item.status, locale);
        if (!("error" in res) || !res.error) {
            router.refresh();
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-3 mb-3">
            {/* Ícone de Tipo */}
            <div
                className={`p-3 rounded-full ${isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}
            >
                {isIncome ? <FiArrowUp size={20} /> : <FiArrowDown size={20} />}
            </div>

            {/* Info Principal */}
            <div className="flex-1">
                <h3 className="font-bold text-gray-800">{item.title}</h3>
                <p className="text-xs text-gray-400 capitalize">
                    {format(new Date(item.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </p>
            </div>

            {/* Valor e Ações */}
            <div className="text-right flex flex-col items-end gap-1">
                <span
                    className={`font-bold ${isIncome ? "text-green-600" : "text-red-600"
                        }`}
                >
                    {isIncome ? "+ " : "- "}
                    {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    }).format(item.amount)}
                </span>

                <div className="flex items-center gap-3 mt-1">
                    <button
                        onClick={handleToggle}
                        className={`${isPaid ? "text-green-500" : "text-gray-300"
                            } hover:text-green-600 transition`}
                    >
                        {isPaid ? <FiCheckCircle size={18} /> : <FiCircle size={18} />}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-gray-300 hover:text-red-500 transition"
                    >
                        <FiTrash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
