import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  addCard: (text: string) => void;
};

export default function CreateCard({ addCard }: Props) {
    const t = useTranslations("CreateCard");
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (!text.trim()) return;
    addCard(text.trim());
    setText("");
  };

  return (
    <div className="flex gap-2 mb-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("author")}
        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        style={{
          background: "var(--color-surface-raised)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-primary)",
        }}
      />
      <button
        onClick={handleAdd}
        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
      >
        +
      </button>
    </div>
  );
}
