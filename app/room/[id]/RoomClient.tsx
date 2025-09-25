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
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Board from "@/components/Board";
import { Card } from "@/types";

type RoomData = {
  requireName: boolean;
  expiresAt?: Date;
};

type Props = {
  roomId: string;
};

const MessageModal = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-full max-w-sm text-center shadow-lg">
      <h2 className="text-xl font-bold mb-4">Atenção!</h2>
      <p className="mb-4">{message}</p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition"
        onClick={onClose}
      >
        Fechar
      </button>
    </div>
  </div>
);

export default function RoomClient({ roomId }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [userName, setUserName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [nameError, setNameError] = useState("");

  const roomCardsRef = collection(db, "rooms", roomId, "cards");

  useEffect(() => {
    const fetchRoom = async () => {
      const roomDoc = doc(db, "rooms", roomId);
      try {
        const docSnap = await getDoc(roomDoc);
        if (!docSnap.exists()) {
          setAlertMessage("A sala não existe ou expirou!");
          return;
        }

        const data = docSnap.data() as any;
        setRoomData({
          requireName: data.requireName ?? true,
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
        console.error("Erro ao carregar dados da sala:", error);
        setAlertMessage("Ocorreu um erro ao carregar a sala. Tente novamente.");
      }
    };

    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    const q = query(roomCardsRef);
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Card));
      setCards(data);
    });
    return () => unsub();
  }, [roomId]);

  const addCard = async (category: Card["category"], text: string) => {
    if (!text.trim()) return;
    if (roomData?.requireName && !userName.trim()) {
      setAlertMessage("Por favor, informe seu nome antes de adicionar um card!");
      return;
    }

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
      setAlertMessage("Erro ao adicionar card. Tente novamente.");
    }
  };

  const vote = async (cardId: string, type: "likes" | "dislikes") => {
    const cardDoc = doc(db, "rooms", roomId, "cards", cardId);
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    await updateDoc(cardDoc, { [type]: card[type] + 1 });
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

  if (!roomData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300 font-semibold">
        Carregando sala...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-blue-100 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-blue-600">RetroBoard</h1>
          <p className="text-gray-800 text-lg">
            Revise o que foi bom, ruim e a melhorar!
          </p>
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
            {/* Mensagem de erro do input */}
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

        {alertMessage && <MessageModal message={alertMessage} onClose={() => setAlertMessage("")} />}

        <Board
          cards={cards}
          addCard={addCard}
          vote={vote}
        />
      </div>
    </div>
  );
}