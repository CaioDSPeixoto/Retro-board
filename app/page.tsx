"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

export default function HomePage() {
  const router = useRouter();
  const [requireName, setRequireName] = useState(false);
  const [duration, setDuration] = useState(24);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customNameEnabled, setCustomNameEnabled] = useState(false);
  const [customRoomName, setCustomRoomName] = useState("");
  const [existingRoomId, setExistingRoomId] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "enter">("create");

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
    const roomName = customNameEnabled && customRoomName ? customRoomName : "Retrospectiva";

    try {
      setIsLoading(true);

      await setDoc(doc(db, "rooms", roomId), {
        roomName,
        requireName,
        createdAt: serverTimestamp(),
        expiresAt,
      });

      if (userName.trim()) localStorage.setItem("userName", userName.trim());

      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error("Erro ao criar sala:", error);
      alert("Erro ao criar a sala. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkRoomExists = async (roomId: string) => {
    if (!roomId.trim()) return false;
    try {
      const roomDoc = await getDoc(doc(db, "rooms", roomId));
      return roomDoc.exists();
    } catch (error) {
      console.error("Erro ao verificar sala:", error);
      return false;
    }
  };

  const handleEnterRoom = async () => {
    const exists = await checkRoomExists(existingRoomId);
    if (exists) {
      router.push(`/room/${existingRoomId}`);
    } else {
      alert("Sala não encontrada!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-100 text-gray-900 p-6">
      {/* Slogan */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">RetroBoard</h1>
        <p className="text-lg text-gray-700 mt-2">Feedbacks que impulsionam o futuro!</p>
      </div>

      <div className="p-8 rounded-xl shadow-lg bg-white border border-blue-300 flex flex-col items-center gap-4 w-full max-w-md">

        {/* Tabs Criar / Entrar */}
        <div className="w-full mb-6">
          <div className="flex border-b border-gray-300">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${
                activeTab === "create"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Criar Sala
            </button>
            <button
              onClick={() => setActiveTab("enter")}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${
                activeTab === "enter"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Entrar em Sala
            </button>
          </div>
        </div>

        {activeTab === "create" && (
          <>
            {/* Toggle nome personalizado */}
            <div className="flex flex-col items-start w-full mb-4">
              <label className="flex items-center cursor-pointer select-none">
                <span className="mr-3 text-gray-700 font-medium">Criar nome personalizado para a sala?</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={customNameEnabled}
                    onChange={(e) => setCustomNameEnabled(e.target.checked)}
                  />
                  <div className="w-12 h-6 bg-gray-300 rounded-full shadow-inner transition-colors duration-300"></div>
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transform transition-transform duration-300 ${
                      customNameEnabled ? "translate-x-6 bg-green-500" : "bg-white"
                    }`}
                  ></div>
                </div>
              </label>

              {customNameEnabled && (
                <input
                  type="text"
                  placeholder="Digite o nome da sala"
                  className="mt-2 w-full p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                />
              )}
            </div>

            {/* Botões Nome Obrigatório / Anônimo */}
            <div className="flex gap-4 w-full justify-center">
              <button
                onClick={() => setRequireName(false)}
                className={`px-4 py-2 rounded-lg font-semibold flex-1 ${
                  !requireName ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                Permitido Anônimo
              </button>
              <button
                onClick={() => setRequireName(true)}
                className={`px-4 py-2 rounded-lg font-semibold flex-1 ${
                  requireName ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                Nome Obrigatório
              </button>
            </div>

            {requireName && (
              <input
                type="text"
                placeholder="Digite seu nome..."
                className="w-full p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 mt-2"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            )}

            {/* Duração da sala */}
            <div className="flex flex-col items-center mt-4 w-full">
              <label className="mb-1 font-semibold text-gray-700">Duração da sala (horas):</label>
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
              className="mt-4 w-full px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition"
              disabled={isLoading}
            >
              {isLoading ? "Criando..." : "Criar Sala"}
            </button>
          </>
        )}

        {activeTab === "enter" && (
          <div className="flex flex-col gap-2 w-full">
            <input
              type="text"
              placeholder="Digite o ID da sala"
              className="w-full p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={existingRoomId}
              onChange={(e) => setExistingRoomId(e.target.value)}
            />
            <button
              onClick={handleEnterRoom}
              className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition"
            >
              Entrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
