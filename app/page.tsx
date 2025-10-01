"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

export default function HomePage() {
  const router = useRouter();
  const [requireName, setRequireName] = useState(false);
  const [duration, setDuration] = useState(720);
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
      await new Promise((resolve) => setTimeout(resolve, 500));
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-100 text-gray-900 p-6 relative">
      {/* Slogan */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">
          <span className="bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">RetroBoard</span>
        </h1>
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
            {/* Seção: Nome das Salas */}
            <div className="w-full mb-4">
              <label className="block mb-2 font-semibold text-gray-700">
                Como deseja o <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">nome da sala</span>?
              </label>
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => setCustomNameEnabled(false)}
                  className={`px-4 py-2 rounded-lg font-semibold flex-1 ${
                    !customNameEnabled ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Padrão
                </button>
                <button
                  onClick={() => setCustomNameEnabled(true)}
                  className={`px-4 py-2 rounded-lg font-semibold flex-1 ${
                    customNameEnabled ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Personalizado
                </button>
              </div>

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

            {/* Seção: Nome dos Usuários */}
            <div className="w-full mb-4">
              <label className="block mb-2 font-semibold text-gray-700">
                Como deseja o <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">nome dos usuários</span>?
              </label>
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
                  className="mt-2 w-full p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              )}
            </div>

            <button
              onClick={handleCreateRoom}
              className="mt-4 w-full px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition disabled:opacity-70"
              disabled={isLoading}
            >
              Criar Sala
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

      {/* Overlay de carregamento */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-blue-600 font-bold text-xl animate-pulse">Criando sala...</div>
        </div>
      )}
    </div>
  );
}