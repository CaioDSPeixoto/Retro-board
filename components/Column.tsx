import { useState } from "react";
import CardItem from "./CardItem";
import { Card } from "@/types/card";
import { FiSend } from "react-icons/fi";
import { useTranslations } from "next-intl";

type ColumnProps = {
  category: Card["category"];
  categoryLabel: string;
  categoryColor: string;
  cards: Card[];
  addCard: (category: Card["category"], text: string) => void;
  vote: (cardId: string, type: "likes" | "dislikes") => void;
  onMoveCard?: (cardId: string, toCategory: Card["category"]) => void;
  onDeleteCard?: (cardId: string) => void;
  currentUserId?: string;
  maxCardsPerUser?: number;
};

const MAX_LENGTH = 200;

export default function Column({
  category,
  categoryLabel,
  categoryColor,
  cards,
  addCard,
  vote,
  onMoveCard,
  onDeleteCard,
  currentUserId,
  maxCardsPerUser = -1,
}: ColumnProps) {
  const t = useTranslations("Column");
  const [newText, setNewText] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Check if current user hit card limit in this column
  const userCardsInColumn = currentUserId
    ? cards.filter((c) => c.authorId === currentUserId).length
    : 0;
  const limitReached = maxCardsPerUser !== -1 && userCardsInColumn >= maxCardsPerUser;

  const handleAdd = () => {
    if (!newText.trim() || limitReached) return;
    addCard(category, newText);
    setNewText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const cardId = e.dataTransfer.getData("text/plain");
    if (cardId && onMoveCard) {
      onMoveCard(cardId, category);
    }
  };

  return (
    <div
      className={`flex-1 p-4 rounded-xl ${categoryColor} flex flex-col shadow-md transition-all ${dragOver ? "ring-2 ring-blue-400 scale-[1.02]" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <h2 className="font-extrabold text-2xl mb-4 capitalize" style={{ color: "var(--color-accent-primary)" }}>
        {categoryLabel}
      </h2>

      {!limitReached ? (
        <div className="mb-4 flex items-start gap-2">
          <textarea
            placeholder={t("new")}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={2}
            onKeyPress={handleKeyPress}
            maxLength={MAX_LENGTH}
          />
          <button
            onClick={handleAdd}
            className="p-2 mt-1 rounded-lg transition-colors flex items-center justify-center border hover:opacity-80"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            <FiSend size={20} />
          </button>
        </div>
      ) : (
        <div className="mb-4 p-2 rounded-lg text-xs font-semibold text-center" style={{ background: "var(--color-surface)", color: "var(--color-text-muted)" }}>
          {t("cardLimitReached")}
        </div>
      )}

      {!limitReached && (
        <div className="text-right text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
          {newText.length}/{MAX_LENGTH}
        </div>
      )}

      <div className="flex flex-col gap-4 overflow-y-auto">
        {cards.map((c) => (
          <CardItem
            key={c.id}
            card={c}
            vote={vote}
            currentUserId={currentUserId}
            onDelete={onDeleteCard}
          />
        ))}
      </div>

      {dragOver && (
        <div className="mt-2 p-2 rounded-lg border-2 border-dashed border-blue-400 text-center text-xs font-semibold text-blue-500">
          {t("dropHere")}
        </div>
      )}
    </div>
  );
}
