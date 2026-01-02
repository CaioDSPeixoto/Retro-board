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
import { Card } from "@/types/card";
import { FaWhatsapp, FaCopy } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ExportButtons from "@/components/ExportButtons";
import NameModal from "@/components/NameModal";

type RoomData = {
  requireName: boolean;
  roomName: string;
};

type Props = {
  roomId: string;
  locale: string;
};

export default function RoomClient({ roomId, locale }: Props) {
  const t = useTranslations("Room");
  const router = useRouter();

  const [cards, setCards] = useState<Card[]>([]);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [userName, setUserName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const fetchRoom = async () => {
      const snap = await getDoc(doc(db, "rooms", roomId));

      if (!snap.exists()) {
        router.push(`/${locale}`);
        return;
      }

      const data = snap.data();

      setRoomData({
        requireName: data.requireName ?? true,
        roomName: data.roomName || t("defaults.roomName"),
      });

      const storedName = localStorage.getItem("userName");

      // Se a sala exige nome e não temos um salvo, abre modal.
      // E NÃO seta o userName ainda, para evitar escrita "anônima" prematura.
      if (data.requireName && !storedName) {
        setShowNameModal(true);
      } else if (storedName) {
        setUserName(storedName);
      }
    };

    fetchRoom();
  }, [roomId, locale, router, t]);

  const handleSaveName = (name: string) => {
    localStorage.setItem("userName", name);
    setUserName(name);
    setShowNameModal(false);
  };

  useEffect(() => {
    const cached = localStorage.getItem(`room:${roomId}:cards`);
    if (cached) {
      setCards(JSON.parse(cached));
    }
  }, [roomId]);

  useEffect(() => {
    const q = query(collection(db, "rooms", roomId, "cards"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Card)
      );

      setCards(data);
      localStorage.setItem(`room:${roomId}:cards`, JSON.stringify(data));
    });

    return () => unsubscribe();
  }, [roomId]);

  const addCard = async (category: Card["category"], text: string) => {
    if (!text.trim()) return;

    await addDoc(collection(db, "rooms", roomId, "cards"), {
      category,
      text,
      likes: 0,
      dislikes: 0,
      author: userName || t("defaults.anonymous"),
      createdAt: new Date(),
    });
  };

  const vote = async (id: string, type: "likes" | "dislikes") => {
    await updateDoc(doc(db, "rooms", roomId, "cards", id), {
      [type]: increment(1),
    });
  };

  const shareRoom = () => {
    const roomUrl = `${origin}/${locale}/room/${roomId}`;
    if (isMobile) {
      window.open(t("share.whatsappUrl", { url: roomUrl }));
    } else {
      navigator.clipboard.writeText(roomUrl);
      alert(t("share.copied"));
    }
  };

  if (!roomData) return null;

  return (
    <div className="min-h-screen p-6 text-gray-900 relative">
      <NameModal
        isOpen={showNameModal}
        onSave={handleSaveName}
      />

      <button
        onClick={shareRoom}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg text-white bg-green-500 hover:bg-green-600 transition z-40"
      >
        {isMobile ? (
          <FaWhatsapp className="text-2xl" />
        ) : (
          <FaCopy className="text-2xl" />
        )}
      </button>

      <div className={`max-w-7xl mx-auto ${showNameModal ? 'blur-sm pointer-events-none' : ''}`}>
        <header className="mb-6 text-center">
          <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
            {roomData.roomName}
          </span>
        </header>

        <Board cards={cards} addCard={addCard} vote={vote} />
        <ExportButtons cards={cards} title={roomData.roomName} />
      </div>
    </div>
  );
}