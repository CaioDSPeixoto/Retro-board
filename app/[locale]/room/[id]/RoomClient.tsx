"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Board from "@/components/Board";
import Toast from "@/components/Toast";
import { Card } from "@/types/card";
import { FaWhatsapp, FaCopy } from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import ExportButtons from "@/components/ExportButtons";

type RoomData = {
  requireName: boolean;
  roomName: string;
  expiresAt?: Date;
};

type Props = {
  roomId: string;
};

export default function RoomClient({ roomId }: Props) {
  const t = useTranslations("Room");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1];

  const [cards, setCards] = useState<Card[]>([]);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [userName, setUserName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameError, setNameError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const roomCardsRef = collection(db, "rooms", roomId, "cards");

  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      const roomDoc = doc(db, "rooms", roomId);
      try {
        const docSnap = await getDoc(roomDoc);

        if (!docSnap.exists()) {
          alert(t("alerts.roomNotFound"));
          router.push(`/${locale}/`);
          return;
        }

        const data = docSnap.data() as any;
        setRoomData({
          requireName: data.requireName ?? true,
          roomName: data.roomName || t("defaults.roomName"),
          expiresAt: data.expiresAt?.toDate
            ? data.expiresAt.toDate()
            : data.expiresAt
            ? new Date(data.expiresAt)
            : undefined,
        });

        const storedName = localStorage.getItem("userName");
        if (data.requireName && !storedName) {
          setShowNameModal(true);
        } else if (storedName) {
          setUserName(storedName);
        }
      } catch (error) {
        console.error(t("logs.fetchRoomError"), error);
        alert(t("alerts.fetchRoomError"));
        router.push(`/${locale}/`);
      }
    };

    fetchRoom();
  }, [roomId, router, t, locale]);

  // Listen for cards
  useEffect(() => {
    const q = query(roomCardsRef);
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Card)
      );
      setCards(data);
    });
    return () => unsub();
  }, [roomCardsRef]);

  // // Toast with room ID
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setToastMessage(t("toast.roomId", { roomId }));
  //     setShowToast(true);
  //   }, 2000);

  //   return () => clearTimeout(timer);
  // }, [roomId, t]);

  const addCard = async (category: Card["category"], text: string) => {
    if (!text.trim()) return;
    if (roomData?.requireName && !userName.trim()) {
      alert(t("alerts.requireName"));
      return;
    }

    const author = roomData?.requireName
      ? userName.trim() || t("defaults.anonymous")
      : t("defaults.anonymous");

    try {
      await addDoc(roomCardsRef, {
        category,
        text,
        likes: 0,
        dislikes: 0,
        author,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error(t("logs.addCardError"), error);
      alert(t("alerts.addCardError"));
    }
  };

  const vote = async (cardId: string, type: "likes" | "dislikes") => {
    try {
      const cardDoc = doc(db, "rooms", roomId, "cards", cardId);
      await updateDoc(cardDoc, { [type]: increment(1) });
    } catch (error) {
      console.error(t("logs.voteError"), error);
      alert(t("alerts.voteError"));
    }
  };

  const handleSaveName = () => {
    if (!userName.trim()) {
      setNameError(t("errors.enterName"));
      return;
    }
    localStorage.setItem("userName", userName.trim());
    setShowNameModal(false);
    setNameError("");
  };

  const shareRoom = () => {
    const roomUrl = `${window.location.origin}/${locale}/room/${roomId}`;
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.open(t("share.whatsappUrl", { url: roomUrl }));
    } else {
      navigator.clipboard.writeText(roomUrl);
      alert(t("share.copied"));
    }
  };

  if (!roomData) return null;

  return (
    <div className="min-h-screen p-6 font-sans text-gray-900 relative">
      {showToast && (
        <Toast
          message={toastMessage}
          type="info"
          onClose={() => setShowToast(false)}
        />
      )}

      <button
        onClick={shareRoom}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg text-white bg-green-500 hover:bg-green-600 transition flex items-center justify-center"
      >
        {/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? (
          <FaWhatsapp className="text-2xl" />
        ) : (
          <FaCopy className="text-2xl" />
        )}
      </button>

      <div className="max-w-7xl mx-auto">
        <header className="mb-6 text-center">
          <span className="bg-gradient-to-r text-4xl font-extrabold from-blue-500 to-blue-800 bg-clip-text text-transparent">
            {roomData.roomName}
          </span>
        </header>

        {showNameModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm text-center shadow-lg">
              <h2 className="text-xl font-bold mb-4">{t("modal.enterName")}</h2>
              <input
                type="text"
                placeholder={t("modal.namePlaceholder")}
                className="w-full p-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              {nameError && (
                <p className="text-sm text-red-600 mb-2">{nameError}</p>
              )}
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition"
                onClick={handleSaveName}
              >
                {t("modal.save")}
              </button>
            </div>
          </div>
        )}

        <Board cards={cards} addCard={addCard} vote={vote} />

        <ExportButtons cards={cards} title={roomData.roomName} />
      </div>
    </div>
  );
}