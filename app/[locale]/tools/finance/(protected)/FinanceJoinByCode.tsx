// app/[locale]/tools/finance/FinanceJoinByCode.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useTranslations } from "next-intl";

type Props = {
  locale: string;
};

export default function FinanceJoinByCode({ locale }: Props) {
  const t = useTranslations("FinancePage");
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsub();
  }, []);

  if (!userId) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const boardRef = doc(db, "finance_boards", trimmed);
      const boardSnap = await getDoc(boardRef);

      if (!boardSnap.exists()) {
        setError("Quadro não encontrado. Verifique o código.");
        setLoading(false);
        return;
      }

      const boardData = boardSnap.data() as any;
      const memberIds: string[] = Array.isArray(boardData.memberIds)
        ? boardData.memberIds
        : [];

      if (boardData.ownerId === userId || memberIds.includes(userId)) {
        setError("Você já participa deste quadro.");
        setLoading(false);
        return;
      }

      // Evitar pedidos duplicados
      const qExisting = query(
        collection(db, "finance_board_invites"),
        where("boardId", "==", trimmed),
        where("userId", "==", userId),
        where("type", "==", "code"),
        where("status", "==", "pending"),
      );
      const existingSnap = await getDocs(qExisting);
      if (!existingSnap.empty) {
        setError("Você já solicitou acesso a este quadro.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "finance_board_invites"), {
        boardId: trimmed,
        boardName: boardData.name || "",
        ownerId: boardData.ownerId,
        type: "code",
        userId,
        status: "pending",
        createdBy: userId,
        createdAt: new Date().toISOString(),
      });

      setFeedback(t("joinRequestSent"));
      setCode("");
    } catch (err) {
      console.error("Erro ao enviar pedido de acesso:", err);
      setError("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
      <h2 className="text-base font-semibold text-gray-800 mb-2">
        {t("joinByCodeTitle")}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("joinByCodeLabel")}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("joinByCodePlaceholder")}
            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2 md:mt-0"
          >
            {loading ? "Enviando..." : t("joinByCodeButton")}
          </button>
        </div>
      </form>

      {feedback && (
        <p className="mt-2 text-xs text-green-600">{feedback}</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
