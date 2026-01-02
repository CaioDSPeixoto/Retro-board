"use client";

import { FinanceItem } from "@/types/finance";
import { useState, useMemo, useEffect } from "react";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import { useRouter } from "next/navigation";
import FinanceItemCard from "@/components/finance/FinanceItemCard";
import FinanceFormModal from "@/components/finance/FinanceFormModal";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useTranslations } from "next-intl";

type Props = {
  initialItems: FinanceItem[];
  initialCategories: string[];
  currentMonth: string;
  locale: string;
};

export default function FinanceClientPage({
  initialItems,
  initialCategories,
  currentMonth,
  locale,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState("Gestor");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.displayName) {
        setUserName(user.displayName.split(" ")[0]);
      } else if (user?.email) {
        setUserName(user.email.split("@")[0]);
      }
    });
    return () => unsubscribe();
  }, []);

  const currentDate = parseISO(currentMonth + "-01");

  const handlePrevMonth = () => {
    const newMonth = format(subMonths(currentDate, 1), "yyyy-MM");
    router.push(`/${locale}/tools/finance?month=${newMonth}`);
  };

  const handleNextMonth = () => {
    const newMonth = format(addMonths(currentDate, 1), "yyyy-MM");
    router.push(`/${locale}/tools/finance?month=${newMonth}`);
  };

  const totals = useMemo(() => {
    return initialItems.reduce(
      (acc, item) => {
        if (item.type === "income") acc.incomes += item.amount;
        else acc.expenses += item.amount;
        return acc;
      },
      { incomes: 0, expenses: 0 },
    );
  }, [initialItems]);

  const balance = totals.incomes - totals.expenses;

  return (
    <div className="pb-24">
      {/* HEADER */}
      <div className="bg-blue-600 pt-8 pb-12 px-6 rounded-b-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-lg font-medium opacity-90">
            {t("Finance.hello")}, {userName}!
          </h1>
          <div className="flex gap-4 items-center bg-blue-700/50 p-1 rounded-full px-4">
            <button onClick={handlePrevMonth}>
              <FiChevronLeft />
            </button>
            <span className="text-sm font-semibold capitalize min-w-[100px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <button onClick={handleNextMonth}>
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-blue-100 text-sm mb-1">Saldo em Caixa</p>
          <h2 className="text-4xl font-extrabold">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(balance)}
          </h2>
        </div>

        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
            <p className="text-xs text-blue-100 mb-1">Entradas</p>
            <p className="text-lg font-bold text-green-300">
              +
              {" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.incomes)}
            </p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
            <p className="text-xs text-blue-100 mb-1">Saídas</p>
            <p className="text-lg font-bold text-red-300">
              -
              {" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.expenses)}
            </p>
          </div>
        </div>
      </div>

      {/* LISTA */}
      <div className="px-6 -mt-6">
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="font-bold text-gray-700">Transações</h3>
          <span className="text-xs text-gray-400">
            {initialItems.length} lançamentos
          </span>
        </div>

        {initialItems.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 mb-2">Nenhum lançamento este mês</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 font-bold text-sm"
            >
              Adicionar Agora
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {initialItems.map((item) => (
              <FinanceItemCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}
      </div>

      {/* BOTÃO FLOAT */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-400 flex items-center justify-center hover:scale-110 active:scale-95 transition z-40"
      >
        <FiPlus size={28} />
      </button>

      {/* MODAL */}
      <FinanceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        locale={locale}
        initialCategories={initialCategories}
      />
    </div>
  );
}
