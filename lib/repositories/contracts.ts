import type { FinanceBoard, FinanceCard, FinanceItem } from "@/types/finance";
import type { Card } from "@/types/card";
import type { RoomData } from "@/lib/retroboard/schema";

export type FinanceScope = {
  userId: string;
  boardId?: string | null;
};

export type FinanceMonthQuery = FinanceScope & {
  month: string;
};

export type FinanceRepository = {
  listBoards(userId: string): Promise<FinanceBoard[]>;
  listItems(query: FinanceMonthQuery): Promise<FinanceItem[]>;
  listCards(scope: FinanceScope): Promise<FinanceCard[]>;
  saveItem(item: Omit<FinanceItem, "id"> & { id?: string }): Promise<FinanceItem>;
  deleteItem(id: string, scope: FinanceScope): Promise<void>;
};

export type RetroboardRepository = {
  getRoom(roomId: string): Promise<RoomData | null>;
  listCards(roomId: string): Promise<Card[]>;
  createRoom(room: RoomData & { expiresAt: Date }): Promise<string>;
  addCard(roomId: string, card: Omit<Card, "id" | "likes" | "dislikes">): Promise<Card>;
};
