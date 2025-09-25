import Column from "./Column";
import { Card } from "@/types/card";

type BoardProps = {
  cards: Card[];
  addCard: (category: Card["category"], text: string) => void;
  vote: (cardId: string, type: "likes" | "dislikes") => void;
};

export default function Board({ cards, addCard, vote }: BoardProps) {
  const categories: Card["category"][] = ["bom", "ruim", "melhorar"];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {categories.map((cat) => (
        <Column
          key={cat}
          category={cat}
          cards={cards.filter((c) => c.category === cat)}
          addCard={addCard}
          vote={vote}
        />
      ))}
    </div>
  );
}
