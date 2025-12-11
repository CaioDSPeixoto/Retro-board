"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("Home");
  const router = useRouter();
  const params = useParams(); 
  const locale = params?.locale || "pt";
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
      alert(t("alerts.requireName"));
      return;
    }

    const roomId = uuidv4();
    const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    const roomName =
      customNameEnabled && customRoomName
        ? customRoomName
        : t("roomName.defaultName");

    try {
      setIsLoading(true);

      await setDoc(doc(db, "rooms", roomId), {
        roomName,
        requireName,
        createdAt: serverTimestamp(),
        expiresAt,
      });

      if (userName.trim()) localStorage.setItem("userName", userName.trim());

      router.push(`/${locale}/room/${roomId}`);
    } catch (error) {
      console.error(t("logs.createError"), error);
      alert(t("alerts.createError"));
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
      console.error(t("logs.checkRoomError"), error);
      return false;
    }
  };

  const handleEnterRoom = async () => {
    const exists = await checkRoomExists(existingRoomId);
    if (exists) {
      router.push(`/${locale}/room/${existingRoomId}`);
    } else {
      alert(t("alerts.roomNotFound"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-900 p-6 relative">
      {/* Slogan */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">
          <span className="bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
            RetroBoard
          </span>
        </h1>
        <p className="text-lg text-gray-700 mt-2">{t("slogan")}</p>
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
              {t("tabs.create")}
            </button>
            <button
              onClick={() => setActiveTab("enter")}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${
                activeTab === "enter"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {t("tabs.enter")}
            </button>
          </div>
        </div>

        {activeTab === "create" && (
          <>
            {/* Seção: Nome das Salas */}
            <div className="w-full mb-4">
              <label className="block mb-2 font-semibold text-gray-700">
                {t("roomName.label")}
              </label>
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => setCustomNameEnabled(false)}
                  className={`px-4 py-2 rounded-lg font-semibold flex-1 ${
                    !customNameEnabled
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {t("roomName.default")}
                </button>
                <button
                  onClick={() => setCustomNameEnabled(true)}
                  className={`px-4 py-2 rounded-lg font-semibold flex-1 ${
                    customNameEnabled
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {t("roomName.custom")}
                </button>
              </div>

              {customNameEnabled && (
                <input
                  type="text"
                  placeholder={t("roomName.placeholder")}
                  className="mt-2 w-full p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                />
              )}
            </div>

            {/* Seção: Nome dos Usuários */}
            <div className="w-full mb-4">
              <label className="block mb-2 font-semibold text-gray-700">
                {t("userName.label")}
              </label>
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => setRequireName(false)}
                  className={`px-4 py-2 rounded-lg font-semibold flex-1 ${
                    !requireName
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {t("userName.allowAnonymous")}
                </button>
                <button
                  onClick={() => setRequireName(true)}
                  className={`px-4 py-2 rounded-lg font-semibold flex-1 ${
                    requireName
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {t("userName.requireName")}
                </button>
              </div>

              {requireName && (
                <input
                  type="text"
                  placeholder={t("userName.placeholder")}
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
              {t("createButton")}
            </button>
          </>
        )}

        {activeTab === "enter" && (
          <div className="flex flex-col gap-2 w-full">
            <input
              type="text"
              placeholder={t("enterRoom.placeholder")}
              className="w-full p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={existingRoomId}
              onChange={(e) => setExistingRoomId(e.target.value)}
            />
            <button
              onClick={handleEnterRoom}
              className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition"
            >
              {t("enterRoom.button")}
            </button>
          </div>
        )}
      </div>

      {/* Overlay de carregamento */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-blue-600 font-bold text-xl animate-pulse">
            {t("loading")}
          </div>
        </div>
      )}
    </div>
  );
}
