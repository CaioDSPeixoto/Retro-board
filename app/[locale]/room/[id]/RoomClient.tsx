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
import { FaWhatsapp } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ExportButtons from "@/components/ExportButtons";

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

  /* ----------------------------------
   * ROOM DATA (1 read)
   ---------------------------------- */
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
        roomName: data.roomName,
      });

      const storedName = localStorage.getItem("userName");
      if (data.requireName && !storedName) setShowNameModal(true);
      if (storedName) setUserName(storedName);
    };

    fetchRoom();
  }, [roomId, locale, router]);

  /* ----------------------------------
   * CACHE LOCAL (instantâneo)
   ---------------------------------- */
  useEffect(() => {
    const cached = localStorage.getItem(`room:${roomId}:cards`);
    if (cached) {
      setCards(JSON.parse(cached));
    }
  }, [roomId]);

  /* ----------------------------------
   * REALTIME (1 listener apenas)
   ---------------------------------- */
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

  /* ----------------------------------
   * ACTIONS
   ---------------------------------- */
  const addCard = async (category: Card["category"], text: string) => {
    if (!text.trim()) return;

    await addDoc(collection(db, "rooms", roomId, "cards"), {
      category,
      text,
      likes: 0,
      dislikes: 0,
      author: userName || "anonymous",
      createdAt: new Date(),
    });
  };

  const vote = async (id: string, type: "likes" | "dislikes") => {
    await updateDoc(doc(db, "rooms", roomId, "cards", id), {
      [type]: increment(1),
    });
  };

  const shareRoom = () => {
    const url = `${window.location.origin}/${locale}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    alert(t("share.copied"));
  };

  if (!roomData) return null;

  return (
    <div className="min-h-screen p-6 relative">
      <button
        onClick={shareRoom}
        className="fixed bottom-6 right-6 p-4 bg-green-500 text-white rounded-full shadow-lg"
      >
        <FaWhatsapp />
      </button>

      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-4xl font-bold">{roomData.roomName}</h1>
        </header>

        <Board cards={cards} addCard={addCard} vote={vote} />
        <ExportButtons cards={cards} title={roomData.roomName} />
      </div>
    </div>
  );
}