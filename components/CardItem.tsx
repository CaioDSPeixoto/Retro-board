import { useState } from "react";
import { Card } from "@/types/card";
import { useTranslations } from "next-intl";
import { FiTrash2 } from "react-icons/fi";

type Props = {
  card: Card;
  vote: (cardId: string, type: "likes" | "dislikes") => void;
  currentUserId?: string;
  onDelete?: (cardId: string) => void;
};

export default function CardItem({ card, vote, currentUserId, onDelete }: Props) {
  const t = useTranslations("CardItem");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canDelete = currentUserId && card.authorId && card.authorId === currentUserId;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", card.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="p-2 rounded-xl shadow-md flex flex-col gap-2 transition-shadow hover:shadow-lg w-full min-w-0 border cursor-grab active:cursor-grabbing"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {confirmDelete ? (
        <div className="flex flex-col gap-2 py-1">
          <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
            {t("confirmDelete")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 text-xs px-2 py-1 rounded-lg border font-semibold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              ✕
            </button>
            <button
              onClick={() => onDelete?.(card.id)}
              className="flex-1 text-xs px-2 py-1 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
            >
              ✓
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="break-words whitespace-pre-wrap word-break break-all" style={{ color: "var(--color-text-primary)" }}>
            {card.text}
          </p>
          <div className="flex items-center justify-between">
            {card.author && (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {t("author")}: {card.author}
              </span>
            )}
            {canDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1 rounded hover:text-red-500 transition-colors"
                style={{ color: "var(--color-text-muted)" }}
                aria-label={t("deleteCard")}
              >
                <FiTrash2 size={13} />
              </button>
            )}
          </div>
          <div className="flex gap-2 text-sm mt-auto">
            <button
              onClick={() => vote(card.id, "likes")}
              className="flex items-center gap-1 text-green-500 font-bold hover:text-green-600 transition-colors"
            >
              <span role="img" aria-label="likes">👍</span>
              {card.likes}
            </button>
            <button
              onClick={() => vote(card.id, "dislikes")}
              className="flex items-center gap-1 text-red-500 font-bold hover:text-red-600 transition-colors"
            >
              <span role="img" aria-label="dislikes">👎</span>
              {card.dislikes}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
