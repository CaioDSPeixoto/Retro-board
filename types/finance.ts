export type FinanceItem = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  type: "income" | "expense";
  status: "paid" | "pending";
  category: string;
  createdAt: string;
  isFixed?: boolean;
};
