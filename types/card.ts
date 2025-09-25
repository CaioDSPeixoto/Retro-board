export type Card = {
  id: string;
  text: string;
  category: "bom" | "ruim" | "melhorar";
  likes: number;
  dislikes: number;
  author?: string;
};

// Informações das categorias
export const CATEGORY_INFO: Record<Card["category"], { name: string; color: string }> = {
  bom: { name: "Bom", color: "bg-green-200" },
  ruim: { name: "Ruim", color: "bg-red-200" },
  melhorar: { name: "Melhorar", color: "bg-yellow-200" },
};

// Lista de categorias
export const CATEGORIES = Object.keys(CATEGORY_INFO) as Card["category"][];
