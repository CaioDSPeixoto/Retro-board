import { Card } from "@/types/card";

type Props = {
  card: Card;
  vote: (cardId: string, type: "likes" | "dislikes") => void;
};

export default function CardItem({ card, vote }: Props) {
  return (
    <div className="p-2 bg-white rounded-xl shadow-md flex flex-col gap-2 transition-shadow hover:shadow-lg w-full min-w-0">
      {/* Texto do card */}
      <p className="text-gray-800 break-words whitespace-pre-wrap word-break break-all">
        {card.text}
      </p>

      {/* Autor */}
      {card.author && (
        <span className="text-xs text-gray-500">
          Autor: {card.author}
        </span>
      )}

      {/* Votos */}
      <div className="flex gap-2 text-sm mt-auto">
        <button
          onClick={() => vote(card.id, "likes")}
          className="flex items-center gap-1 text-green-600 font-bold hover:text-green-700 transition-colors"
        >
          <span role="img" aria-label="likes">👍</span>
          {card.likes}
        </button>
        <button
          onClick={() => vote(card.id, "dislikes")}
          className="flex items-center gap-1 text-red-600 font-bold hover:text-red-700 transition-colors"
        >
          <span role="img" aria-label="dislikes">👎</span>
          {card.dislikes}
        </button>
      </div>
    </div>
  );
}