import { useState } from "react";
import CardItem from "./CardItem";
import { Card, CATEGORY_INFO } from "@/types/card";
import { FiSend } from "react-icons/fi";

type ColumnProps = {
  category: Card["category"];
  cards: Card[];
  addCard: (category: Card["category"], text: string) => void;
  vote: (cardId: string, type: "likes" | "dislikes") => void;
};

const MAX_LENGTH = 200;

export default function Column({ category, cards, addCard, vote }: ColumnProps) {
  const [newText, setNewText] = useState("");
  const info = CATEGORY_INFO[category]; // nome e cor da categoria

  const handleAdd = () => {
    if (!newText.trim()) return;
    addCard(category, newText);
    setNewText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={`flex-1 p-4 rounded-xl ${info.color} flex flex-col shadow-md`}>
      <h2 className="font-extrabold text-2xl mb-4 capitalize text-gray-800">{info.name}</h2>

      {/* Textarea com ícone de envio */}
      <div className="mb-4 flex items-start gap-2">
        <textarea
          placeholder="Adicionar um novo card..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          rows={2}
          onKeyPress={handleKeyPress}
          maxLength={MAX_LENGTH}
        />
        <button
          onClick={handleAdd}
          className="p-2 mt-1 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors flex items-center justify-center border border-gray-300"
        >
          <FiSend size={20} />
        </button>
      </div>

      {/* Mostrador de caracteres */}
      <div className="text-right text-xs text-gray-500 mb-2">
        {newText.length}/{MAX_LENGTH}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4 overflow-y-auto">
        {cards.map((c) => (
          <CardItem key={c.id} card={c} vote={vote} />
        ))}
      </div>
    </div>
  );
}