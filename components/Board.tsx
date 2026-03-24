"use client";

import Column from "./Column";
import { Card, CATEGORIES, CATEGORY_COLORS } from "@/types/card";
import { useTranslations } from "next-intl";

type BoardProps = {
  cards: Card[];
  addCard: (category: Card["category"], text: string) => void;
  vote: (cardId: string, type: "likes" | "dislikes") => void;
  onMoveCard?: (cardId: string, toCategory: Card["category"]) => void;
  onDeleteCard?: (cardId: string) => void;
  currentUserId?: string;
  maxCardsPerUser?: number;
};

export default function Board({ cards, addCard, vote, onMoveCard, onDeleteCard, currentUserId, maxCardsPerUser }: BoardProps) {
  const t = useTranslations("Room");

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {CATEGORIES.map((category) => (
        <Column
          key={category}
          category={category}
          categoryLabel={t(`categories.${category}`)}
          categoryColor={CATEGORY_COLORS[category]}
          cards={cards.filter((c) => c.category === category)}
          addCard={addCard}
          vote={vote}
          onMoveCard={onMoveCard}
          onDeleteCard={onDeleteCard}
          currentUserId={currentUserId}
          maxCardsPerUser={maxCardsPerUser}
        />
      ))}
    </div>
  );
}
