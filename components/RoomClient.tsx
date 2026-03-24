"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
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
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { PLAN_LIMITS } from "@/types/user";
import type { SubscriptionPlan } from "@/types/user";

type RoomData = {
  requireName: boolean;
  roomName: string;
};

type Props = {
  roomId: string;
  locale: string;
  exportEnabled?: boolean;
  userPlan?: SubscriptionPlan;
};

export default function RoomClient({ roomId, locale, exportEnabled = true, userPlan = "free" }: Props) {
  const t = useTranslations("Room");
  const router = useRouter();

  const [cards, setCards] = useState<Card[]>([]);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [userName, setUserName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [userId, setUserId] = useState("");

  const [isMobile, setIsMobile] = useState(false);
  const [origin, setOrigin] = useState("");

  const maxCardsPerUser = PLAN_LIMITS[userPlan]?.maxRetroCardsPerColumn ?? 5;

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    setOrigin(window.location.origin);

    // Generate or retrieve a persistent anonymous user ID
    let storedId = localStorage.getItem("retroboard:userId");
    if (!storedId) {
      storedId = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem("retroboard:userId", storedId);
    }
    setUserId(storedId);
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

      if (data.requireName && !storedName) {
        setShowNameModal(true);
      } else if (storedName) {
        setUserName(storedName);
      }
    };

    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, locale]);

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
      authorId: userId,
      createdAt: new Date(),
    });
  };

  const vote = async (id: string, type: "likes" | "dislikes") => {
    await updateDoc(doc(db, "rooms", roomId, "cards", id), {
      [type]: increment(1),
    });
  };

  const deleteCard = async (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.authorId !== userId) return;
    await deleteDoc(doc(db, "rooms", roomId, "cards", cardId));
  };

  const moveCard = async (cardId: string, toCategory: Card["category"]) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.category === toCategory) return;
    await updateDoc(doc(db, "rooms", roomId, "cards", cardId), {
      category: toCategory,
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

  if (!roomData) return <LoadingOverlay fullScreen />;

  return (
    <div className="min-h-screen p-6 relative">
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
          <span className="text-4xl font-extrabold heading-gradient">
            {roomData.roomName}
          </span>
        </header>

        <Board
          cards={cards}
          addCard={addCard}
          vote={vote}
          onMoveCard={moveCard}
          onDeleteCard={deleteCard}
          currentUserId={userId}
          maxCardsPerUser={maxCardsPerUser}
        />
        {exportEnabled && <ExportButtons cards={cards} title={roomData.roomName} />}
      </div>
    </div>
  );
}
