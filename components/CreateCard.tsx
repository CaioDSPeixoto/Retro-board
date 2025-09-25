import { useState } from "react";

type Props = {
  addCard: (text: string) => void;
};

export default function CreateCard({ addCard }: Props) {
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
        placeholder="Novo card..."
        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={handleAdd}
        className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
      >
        +
      </button>
    </div>
  );
}
