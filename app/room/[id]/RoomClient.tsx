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
import { useRouter } from "next/navigation";

type RoomData = {
  requireName: boolean;
  roomName: string;
  expiresAt?: Date;
};

type Props = {
  roomId: string;
};

export default function RoomClient({ roomId }: Props) {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [userName, setUserName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameError, setNameError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const roomCardsRef = collection(db, "rooms", roomId, "cards");

  useEffect(() => {
    const fetchRoom = async () => {
      const roomDoc = doc(db, "rooms", roomId);
      try {
        const docSnap = await getDoc(roomDoc);

        if (!docSnap.exists()) {
          router.push("/"); // redireciona imediatamente se a sala não existir
          return;
        }

        const data = docSnap.data() as any;
        setRoomData({
          requireName: data.requireName ?? true,
          roomName: data.roomName || "Retrospectiva",
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
        router.push("/"); // redireciona em caso de erro
      }
    };

    fetchRoom();
  }, [roomId, router]);

  useEffect(() => {
    const q = query(roomCardsRef);
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Card)
      );
      setCards(data);
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setToastMessage(`ID da sala: ${roomId}.\n Você pode encontrá-lo no botão ao final da página para copiá-lo.`);
      setShowToast(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [roomId]);

  const addCard = async (category: Card["category"], text: string) => {
    if (!text.trim()) return;
    if (roomData?.requireName && !userName.trim()) return;

    const author = roomData?.requireName ? userName.trim() || "Anônimo" : "Anônimo";

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
      console.error("Erro ao adicionar card:", error);
    }
  };

  const vote = async (cardId: string, type: "likes" | "dislikes") => {
    try {
      const cardDoc = doc(db, "rooms", roomId, "cards", cardId);
      await updateDoc(cardDoc, { [type]: increment(1) });
    } catch (error) {
      console.error("Erro ao votar:", error);
    }
  };

  const handleSaveName = () => {
    if (!userName.trim()) {
      setNameError("Por favor, digite seu nome.");
      return;
    }
    localStorage.setItem("userName", userName.trim());
    setShowNameModal(false);
    setNameError("");
  };

  const shareRoom = () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.open(`https://api.whatsapp.com/send?text=Entre na sala: ${roomUrl}`);
    } else {
      navigator.clipboard.writeText(roomUrl);
      alert("Link copiado para a área de transferência!");
    }
  };

  if (!roomData) {
    return null; // não travar no "Carregando"
  }

  return (
    <div className="min-h-screen p-6 bg-blue-100 font-sans text-gray-900 relative">
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
          <h1 className="text-4xl font-extrabold text-blue-600">
            {roomData.roomName}
          </h1>
        </header>

        {showNameModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm text-center shadow-lg">
              <h2 className="text-xl font-bold mb-4">Digite seu nome</h2>
              <input
                type="text"
                placeholder="Seu nome..."
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
                Salvar
              </button>
            </div>
          </div>
        )}

        <Board cards={cards} addCard={addCard} vote={vote} />
      </div>
    </div>
  );
}
