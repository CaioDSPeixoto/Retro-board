export type Card = {
  id: string;
  text: string;
  category: "bom" | "ruim" | "melhorar";
  likes: number;
  dislikes: number;
  author?: string;
};

// Informações fixas (cores)
export const CATEGORY_COLORS: Record<Card["category"], string> = {
  bom: "bg-green-200",
  ruim: "bg-red-200",
  melhorar: "bg-yellow-200",
};

// Lista de categorias
export const CATEGORIES = Object.keys(CATEGORY_COLORS) as Card["category"][];
