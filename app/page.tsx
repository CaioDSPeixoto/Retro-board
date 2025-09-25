"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

export default function HomePage() {
  const router = useRouter();
  const [requireName, setRequireName] = useState(false);
  const [duration, setDuration] = useState(24);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName);
  }, []);

  const handleCreateRoom = async () => {
    if (requireName && !userName.trim()) {
      alert("Por favor, digite seu nome antes de criar a sala!");
      return;
    }

    const roomId = uuidv4();
    const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);

    try {
      await setDoc(doc(db, "rooms", roomId), {
        requireName,
        createdAt: serverTimestamp(),
        expiresAt,
      });

      if (userName.trim()) localStorage.setItem("userName", userName.trim());

      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error("Erro ao criar sala:", error);
      alert("Erro ao criar a sala. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-100 text-gray-900 p-6">
      <div className="p-8 rounded-xl shadow-lg bg-white border border-blue-300 flex flex-col items-center gap-4 w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-blue-600 text-center">
          RetroBoard
        </h1>
        <p className="text-gray-800 text-center">
          Revise o que foi bom, ruim e a melhorar!
        </p>

        {/* Botão de obrigatoriedade do nome */}
        <div className="flex gap-4">
          <button
            onClick={() => setRequireName(false)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              !requireName ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Sim (Anônimo permitido)
          </button>
          <button
            onClick={() => setRequireName(true)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              requireName ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Não (Nome obrigatório)
          </button>
        </div>

        {/* Input do nome apenas se obrigatório */}
        {requireName && (
          <input
            type="text"
            placeholder="Digite seu nome..."
            className="w-full p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        )}

        {/* Duração da sala */}
        <div className="flex flex-col items-center mt-4 w-full">
          <label className="mb-1 font-semibold text-gray-700">
            Duração da sala (horas):
          </label>
          <select
            className="w-full p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value={1}>1 hora</option>
            <option value={24}>24 horas</option>
            <option value={720}>30 dias</option>
          </select>
          <p className="text-sm text-gray-600 mt-1 text-center">
            Após o tempo definido, a sala será removida automaticamente.
          </p>
        </div>

        <button
          onClick={handleCreateRoom}
          className="mt-4 px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition"
        >
          Criar Sala
        </button>
      </div>
    </div>
  );
}
