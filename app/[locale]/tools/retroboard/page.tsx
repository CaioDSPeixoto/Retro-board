"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { useTranslations } from "next-intl";
import Spinner from "@/components/ui/Spinner";
import { FiTrash2, FiExternalLink, FiClock } from "react-icons/fi";

type RoomHistoryEntry = {
  id: string;
  name: string;
  visitedAt: string;
  expiresAt?: string;
};

const ROOM_HISTORY_KEY = "retroboard:roomHistory";
const MAX_HISTORY = 20;

export default function RetroboardPage() {
  const t = useTranslations("Retroboard");
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "pt";
  const [requireName, setRequireName] = useState(false);
  const [duration, setDuration] = useState(720);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [customNameEnabled, setCustomNameEnabled] = useState(false);
  const [customRoomName, setCustomRoomName] = useState("");
  const [existingRoomId, setExistingRoomId] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "enter">("create");
  const [roomHistory, setRoomHistory] = useState<RoomHistoryEntry[]>([]);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [confirmDeleteRoomId, setConfirmDeleteRoomId] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName);

    const stored = localStorage.getItem(ROOM_HISTORY_KEY);
    if (stored) {
      try { setRoomHistory(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const saveToHistory = useCallback((roomId: string, roomName: string, expiresAt?: string) => {
    setRoomHistory((prev) => {
      const filtered = prev.filter((r) => r.id !== roomId);
      const next = [{ id: roomId, name: roomName, visitedAt: new Date().toISOString(), expiresAt }, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(ROOM_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((roomId: string) => {
    setRoomHistory((prev) => {
      const next = prev.filter((r) => r.id !== roomId);
      localStorage.setItem(ROOM_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRoomHistory([]);
    localStorage.removeItem(ROOM_HISTORY_KEY);
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

      saveToHistory(roomId, roomName, expiresAt.toISOString());
      router.push(`/${locale}/room/${roomId}`);
    } catch (error) {
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
      return false;
    }
  };

  const handleEnterRoom = async () => {
    setIsEntering(true);
    const exists = await checkRoomExists(existingRoomId);
    if (exists) {
      const snap = await getDoc(doc(db, "rooms", existingRoomId));
      const roomName = snap.data()?.roomName || t("roomName.defaultName");
      const expiresAtRaw = snap.data()?.expiresAt;
      const expiresAtStr = expiresAtRaw?.toDate ? expiresAtRaw.toDate().toISOString() : expiresAtRaw instanceof Date ? expiresAtRaw.toISOString() : typeof expiresAtRaw === "string" ? expiresAtRaw : undefined;
      saveToHistory(existingRoomId, roomName, expiresAtStr);
      router.push(`/${locale}/room/${existingRoomId}`);
    } else {
      alert(t("alerts.roomNotFound"));
      setIsEntering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-10 p-6 relative">
      {/* Slogan */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold">
          <span className="heading-gradient">
            RetroBoard
          </span>
        </h1>
        <p className="text-lg mt-2" style={{ color: "var(--color-text-secondary)" }}>{t("slogan")}</p>
      </div>

      <div
        className="p-8 rounded-xl shadow-lg border flex flex-col items-center gap-4 w-full max-w-md"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Tabs Criar / Entrar */}
        <div className="w-full mb-6">
          <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${
                activeTab === "create"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : ""
              }`}
              style={activeTab !== "create" ? { color: "var(--color-text-secondary)" } : {}}
            >
              {t("tabs.create")}
            </button>
            <button
              onClick={() => setActiveTab("enter")}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${
                activeTab === "enter"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : ""
              }`}
              style={activeTab !== "enter" ? { color: "var(--color-text-secondary)" } : {}}
            >
              {t("tabs.enter")}
            </button>
          </div>
        </div>

        {activeTab === "create" && (
          <>
            {/* Seção: Nome das Salas */}
            <div className="w-full mb-4">
              <label className="block mb-2 font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                {t("roomName.label")}
              </label>
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => setCustomNameEnabled(false)}
                  className={`px-4 py-2 rounded-lg font-semibold flex-1 transition-colors ${
                    !customNameEnabled
                      ? "bg-blue-600 text-white"
                      : ""
                  }`}
                  style={customNameEnabled ? { background: "var(--color-surface-raised)", color: "var(--color-text-secondary)" } : {}}
                >
                  {t("roomName.default")}
                </button>
                <button
                  onClick={() => setCustomNameEnabled(true)}
                  className={`px-4 py-2 rounded-lg font-semibold flex-1 transition-colors ${
                    customNameEnabled
                      ? "bg-blue-600 text-white"
                      : ""
                  }`}
                  style={!customNameEnabled ? { background: "var(--color-surface-raised)", color: "var(--color-text-secondary)" } : {}}
                >
                  {t("roomName.custom")}
                </button>
              </div>

              {customNameEnabled && (
                <input
                  type="text"
                  placeholder={t("roomName.placeholder")}
                  className="mt-2 w-full p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{
                    background: "var(--color-surface-raised)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                />
              )}
            </div>

            {/* Seção: Nome dos Usuários */}
            <div className="w-full mb-4">
              <label className="block mb-2 font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                {t("userName.label")}
              </label>
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => setRequireName(false)}
                  className={`px-4 py-2 rounded-lg font-semibold flex-1 transition-colors ${
                    !requireName ? "bg-blue-600 text-white" : ""
                  }`}
                  style={requireName ? { background: "var(--color-surface-raised)", color: "var(--color-text-secondary)" } : {}}
                >
                  {t("userName.allowAnonymous")}
                </button>
                <button
                  onClick={() => setRequireName(true)}
                  className={`px-4 py-2 rounded-lg font-semibold flex-1 transition-colors ${
                    requireName ? "bg-blue-600 text-white" : ""
                  }`}
                  style={!requireName ? { background: "var(--color-surface-raised)", color: "var(--color-text-secondary)" } : {}}
                >
                  {t("userName.requireName")}
                </button>
              </div>

              {requireName && (
                <input
                  type="text"
                  placeholder={t("userName.placeholder")}
                  className="mt-2 w-full p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{
                    background: "var(--color-surface-raised)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              )}
            </div>

            <button
              onClick={handleCreateRoom}
              className="mt-4 w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Spinner size="md" color="white" />}
              {t("createButton")}
            </button>
          </>
        )}

        {activeTab === "enter" && (
          <div className="flex flex-col gap-2 w-full">
            <input
              type="text"
              placeholder={t("enterRoom.placeholder")}
              className="w-full p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                background: "var(--color-surface-raised)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
              value={existingRoomId}
              onChange={(e) => setExistingRoomId(e.target.value)}
            />
            <button
              onClick={handleEnterRoom}
              disabled={isEntering || !existingRoomId.trim()}
              className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isEntering && <Spinner size="md" color="white" />}
              {t("enterRoom.button")}
            </button>
          </div>
        )}
      </div>

      {/* Histórico de salas */}
      {roomHistory.length > 0 && (
        <div
          className="mt-6 w-full max-w-md rounded-xl border p-4"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
              <FiClock size={14} />
              {t("history.title")}
            </h2>
            <button
              onClick={() => setConfirmClearHistory(true)}
              className="text-[11px] font-semibold transition hover:opacity-80"
              style={{ color: "var(--color-text-muted)" }}
            >
              {t("history.clearAll")}
            </button>
          </div>
          <div className="space-y-2">
            {roomHistory.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-all hover:shadow-sm"
                style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border-subtle)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                    {room.name}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(room.visitedAt).toLocaleDateString(locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {room.expiresAt && (
                    <p className={`text-[10px] font-semibold ${new Date(room.expiresAt) < new Date() ? "text-red-500" : "text-amber-500"}`}>
                      {new Date(room.expiresAt) < new Date()
                        ? t("history.expired")
                        : t("history.expiresAt", { date: new Date(room.expiresAt).toLocaleDateString(locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push(`/${locale}/room/${room.id}`)}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 transition"
                    aria-label={t("history.open")}
                  >
                    <FiExternalLink size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteRoomId(room.id)}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:text-red-500 transition"
                    style={{ color: "var(--color-text-muted)" }}
                    aria-label={t("history.remove")}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmação: limpar todo o histórico */}
      {confirmClearHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setConfirmClearHistory(false)}
        >
          <div
            className="rounded-2xl border shadow-2xl p-6 w-full max-w-sm animate-scaleIn"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base text-center font-semibold mb-5" style={{ color: "var(--color-text-primary)" }}>
              {t("history.confirmClearAll")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClearHistory(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition hover:opacity-80"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface-raised)" }}
              >
                {t("history.cancel")}
              </button>
              <button
                onClick={() => { clearHistory(); setConfirmClearHistory(false); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition"
              >
                {t("history.confirmClear")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação: remover sala individual */}
      {confirmDeleteRoomId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setConfirmDeleteRoomId(null)}
        >
          <div
            className="rounded-2xl border shadow-2xl p-6 w-full max-w-sm animate-scaleIn"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base text-center font-semibold mb-5" style={{ color: "var(--color-text-primary)" }}>
              {t("history.confirmRemove")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteRoomId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition hover:opacity-80"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface-raised)" }}
              >
                {t("history.cancel")}
              </button>
              <button
                onClick={() => { removeFromHistory(confirmDeleteRoomId); setConfirmDeleteRoomId(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition"
              >
                {t("history.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de carregamento */}
      {isLoading && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-sm border"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <Spinner size="lg" color="blue" />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{t("loading")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
