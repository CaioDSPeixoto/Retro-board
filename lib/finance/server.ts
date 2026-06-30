import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import type { FinanceBoard, FinanceItem } from "@/types/finance";

export async function getFinanceBoard(boardId: string): Promise<FinanceBoard | null> {
  const snap = await adminDb.collection("finance_boards").doc(boardId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as any) } as FinanceBoard;
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

export function mapFinanceItem(doc: { id: string; data: () => any }): FinanceItem {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    boardId: data.boardId,
    title: data.title,
    amount: data.amount,
    date: data.date,
    type: data.type,
    status: data.status,
    category: data.category,
    createdAt: data.createdAt,
    isFixed: data.isFixed,
    isSynthetic: data.isSynthetic,
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    paidAmount: data.paidAmount,
    openAmount: data.openAmount,
    carriedFromMonth: data.carriedFromMonth,
    carriedFromItemId: data.carriedFromItemId,
    fixedTemplateId: data.fixedTemplateId,
    installmentGroupId: data.installmentGroupId,
    installmentIndex: data.installmentIndex,
    installmentTotal: data.installmentTotal,
    originalAmount: data.originalAmount,
    cardId: data.cardId,
    cardName: data.cardName,
    cardMode: data.cardMode,
    cardLastDigits: data.cardLastDigits,
  };
}
