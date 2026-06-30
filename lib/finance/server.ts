import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import type { FinanceBoard, FinanceItem } from "@/types/finance";
import { mapFinanceBoard, mapFinanceItem } from "@/lib/finance/schema";

export { mapFinanceItem };

export async function getFinanceBoard(boardId: string): Promise<FinanceBoard | null> {
  const snap = await adminDb.collection("finance_boards").doc(boardId).get();
  if (!snap.exists) return null;
  return mapFinanceBoard(snap);
}

export function isFinanceBoardMember(board: FinanceBoard, userId: string): boolean {
  const members = Array.isArray(board.memberIds) ? board.memberIds : [];
  return board.ownerId === userId || members.includes(userId);
}

export async function canAccessFinanceBoard(
  boardId: string,
  userId: string,
): Promise<boolean> {
  const board = await getFinanceBoard(boardId);
  return !!board && isFinanceBoardMember(board, userId);
}

export async function canEditFinanceItem(
  item: FinanceItem,
  userId: string,
): Promise<boolean> {
  if (item.boardId) return canAccessFinanceBoard(item.boardId, userId);
  return item.userId === userId;
}
