export type FinanceType = "income" | "expense";
export type FinanceStatus = "paid" | "pending";

export type FinanceItem = {
    id: string;
    userId: string;
    type: FinanceType;
    title: string;
    amount: number;
    date: string; // YYYY-MM-DD
    category: string;
    status: FinanceStatus;
    createdAt: string; // ISO String
    isFixed?: boolean;
};
