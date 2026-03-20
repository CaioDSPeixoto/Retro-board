import { Card } from "@/types/card";
import { useTranslations } from "next-intl";

type Props = {
  card: Card;
  vote: (cardId: string, type: "likes" | "dislikes") => void;
};

export default function CardItem({ card, vote }: Props) {
  const t = useTranslations("CardItem");

  return (
    <div
      className="p-2 rounded-xl shadow-md flex flex-col gap-2 transition-shadow hover:shadow-lg w-full min-w-0 border"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <p className="break-words whitespace-pre-wrap word-break break-all" style={{ color: "var(--color-text-primary)" }}>
        {card.text}
      </p>
      {card.author && (
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {t("author")}: {card.author}
        </span>
      )}
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
    </div>
  );
}