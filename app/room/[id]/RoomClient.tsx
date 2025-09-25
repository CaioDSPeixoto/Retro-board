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

type RoomData = {
  requireName: boolean;
  roomName: string;
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
        console.error("Erro ao carregar dados da sala:", error);
        setAlertMessage("Ocorreu um erro ao carregar a sala. Tente novamente.");
      }
    };

    fetchRoom();
  }, [roomId]);

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
    try {
      const cardDoc = doc(db, "rooms", roomId, "cards", cardId);
      await updateDoc(cardDoc, { [type]: increment(1) });
    } catch (error) {
      console.error("Erro ao votar:", error);
      setAlertMessage("Não foi possível registrar o voto. Tente novamente.");
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
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300 font-semibold">
        Carregando sala...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-blue-100 font-sans text-gray-900 relative">
      
      {/* Botão flutuante WhatsApp ou Copiar */}
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

        {alertMessage && (
          <MessageModal
            message={alertMessage}
            onClose={() => setAlertMessage("")}
          />
        )}

        <Board cards={cards} addCard={addCard} vote={vote} />
      </div>
    </div>
  );
}
