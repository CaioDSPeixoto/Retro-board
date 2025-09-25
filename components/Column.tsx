import { useState } from "react";
import CardItem from "./CardItem";
import { Card } from "@/types";

type ColumnProps = {
  category: Card["category"];
  cards: Card[];
  addCard: (category: Card["category"], text: string) => void;
  vote: (cardId: string, type: "likes" | "dislikes") => void;
};

const colors: Record<Card["category"], string> = {
  bom: "bg-green-200",
  ruim: "bg-red-200",
  melhorar: "bg-yellow-200",
};

export default function Column({ category, cards, addCard, vote }: ColumnProps) {
  const [newText, setNewText] = useState("");

  const handleAdd = () => {
    if (!newText.trim()) return;
    addCard(category, newText);
    setNewText("");
  };

  return (
    <div className={`flex-1 p-4 rounded-xl ${colors[category]} flex flex-col shadow-md`}>
      <h2 className="font-extrabold text-2xl mb-4 capitalize text-gray-800">
        {category}
      </h2>

      <div className="mb-4">
        <textarea
          placeholder="Adicionar um novo card..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          rows={2}
        />
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-bold transition-colors shadow-sm hover:shadow-md"
          onClick={handleAdd}
        >
          Adicionar Card
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto">
        {cards.map((c) => (
          <CardItem
            key={c.id}
            card={c}
            vote={vote}
          />
        ))}
      </div>
    </div>
  );
}
