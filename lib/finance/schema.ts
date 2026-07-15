import {
  getDocumentData,
  readBoolean,
  readDateString,
  readEnum,
  readNumber,
  readOptionalEnum,
  readOptionalNumber,
  readOptionalString,
  readString,
  readStringArray,
  removeUndefinedValues,
  type FirestoreDocumentLike,
} from "@/lib/firestore/schema";
import type {
  FinanceBoard,
  FinanceBoardInvite,
  FinanceBoardInviteStatus,
  FinanceBoardInviteType,
  FinanceCard,
  FinanceDebt,
  FinanceDebtPayment,
  FinanceDebtStatus,
  FinanceDebtType,
  FinanceItem,
  FinanceStatus,
  FinanceBudget,
  FinanceSavingsGoal,
  FinanceTemplate,
} from "@/types/finance";

const FINANCE_ITEM_TYPES = ["income", "expense"] as const;
const FINANCE_STATUSES: readonly FinanceStatus[] = [
  "paid",
  "pending",
  "partial",
  "moved",
];
const FINANCE_CARD_MODES = ["credit", "debit"] as const;
const FINANCE_DEBT_TYPES: readonly FinanceDebtType[] = [
  "card",
  "invoice",
  "house_bill",
  "loan",
  "person",
  "financing",
  "other",
];
const FINANCE_DEBT_STATUSES: readonly FinanceDebtStatus[] = [
  "active",
  "overdue",
  "paid",
  "renegotiated",
];
const FINANCE_INVITE_STATUSES: readonly FinanceBoardInviteStatus[] = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
];
const FINANCE_INVITE_TYPES: readonly FinanceBoardInviteType[] = ["email", "code"];

export function mapFinanceBoard(doc: FirestoreDocumentLike): FinanceBoard {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    name: readString(data, "name", "Sem nome"),
    ownerId: readString(data, "ownerId"),
    memberIds: readStringArray(data, "memberIds"),
    createdAt: readDateString(data, "createdAt"),
    isPersonal: readBoolean(data, "isPersonal", false),
    code: readOptionalString(data, "code"),
    inviteCode: readOptionalString(data, "inviteCode"),
  });
}

export function mapFinanceItem(doc: FirestoreDocumentLike): FinanceItem {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    userId: readString(data, "userId"),
    boardId: readOptionalString(data, "boardId"),
    title: readString(data, "title", "Sem titulo"),
    amount: readNumber(data, "amount"),
    date: readString(data, "date"),
    type: readEnum(data, "type", FINANCE_ITEM_TYPES, "expense"),
    status: readEnum(data, "status", FINANCE_STATUSES, "pending"),
    category: readString(data, "category", "Outros"),
    createdAt: readDateString(data, "createdAt"),
    isFixed: readBoolean(data, "isFixed", false),
    isSynthetic: readBoolean(data, "isSynthetic", false),
    createdBy: readOptionalString(data, "createdBy"),
    createdByName: readOptionalString(data, "createdByName"),
    paidAmount: readOptionalNumber(data, "paidAmount"),
    openAmount: readOptionalNumber(data, "openAmount"),
    carriedFromMonth: readOptionalString(data, "carriedFromMonth"),
    carriedFromItemId: readOptionalString(data, "carriedFromItemId"),
    carriedToMonth: readOptionalString(data, "carriedToMonth"),
    carriedRemainderAmount: readOptionalNumber(data, "carriedRemainderAmount"),
    fixedTemplateId: readOptionalString(data, "fixedTemplateId"),
    installmentGroupId: readOptionalString(data, "installmentGroupId"),
    installmentIndex: readOptionalNumber(data, "installmentIndex"),
    installmentTotal: readOptionalNumber(data, "installmentTotal"),
    originalAmount: readOptionalNumber(data, "originalAmount"),
    cardId: readOptionalString(data, "cardId"),
    cardName: readOptionalString(data, "cardName"),
    cardMode: readOptionalEnum(data, "cardMode", FINANCE_CARD_MODES),
    cardLastDigits: readOptionalString(data, "cardLastDigits"),
    notes: readOptionalString(data, "notes"),
    tags: readStringArray(data, "tags"),
  });
}

export function mapFinanceCard(doc: FirestoreDocumentLike): FinanceCard {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    userId: readString(data, "userId"),
    boardId: readOptionalString(data, "boardId"),
    name: readString(data, "name", "Cartao"),
    mode: readEnum(data, "mode", FINANCE_CARD_MODES, "credit"),
    lastDigits: readOptionalString(data, "lastDigits"),
    limit: readOptionalNumber(data, "limit"),
    closingDay: readOptionalNumber(data, "closingDay"),
    dueDay: readOptionalNumber(data, "dueDay"),
    createdAt: readDateString(data, "createdAt"),
    createdBy: readOptionalString(data, "createdBy"),
  });
}

export function mapFinanceDebt(doc: FirestoreDocumentLike): FinanceDebt {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    userId: readString(data, "userId"),
    boardId: readString(data, "boardId"),
    name: readString(data, "name", "Divida"),
    type: readEnum(data, "type", FINANCE_DEBT_TYPES, "other"),
    originalAmount: readNumber(data, "originalAmount"),
    currentBalance: readNumber(data, "currentBalance"),
    startDate: readString(data, "startDate"),
    dueDate: readString(data, "dueDate"),
    status: readEnum(data, "status", FINANCE_DEBT_STATUSES, "active"),
    category: readOptionalString(data, "category"),
    cardId: readOptionalString(data, "cardId"),
    interestRate: readOptionalNumber(data, "interestRate"),
    penaltyAmount: readOptionalNumber(data, "penaltyAmount"),
    installments: readOptionalNumber(data, "installments"),
    linkedInstallmentGroupId: readOptionalString(data, "linkedInstallmentGroupId"),
    notes: readOptionalString(data, "notes"),
    createdAt: readDateString(data, "createdAt"),
    updatedAt: readDateString(data, "updatedAt") || undefined,
    createdBy: readOptionalString(data, "createdBy"),
  });
}

export function mapFinanceDebtPayment(doc: FirestoreDocumentLike): FinanceDebtPayment {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    debtId: readString(data, "debtId"),
    boardId: readString(data, "boardId"),
    userId: readString(data, "userId"),
    amount: readNumber(data, "amount"),
    paidAt: readString(data, "paidAt"),
    note: readOptionalString(data, "note"),
    financeItemId: readOptionalString(data, "financeItemId"),
    createdAt: readDateString(data, "createdAt"),
  });
}

export function mapFinanceBoardInvite(
  doc: FirestoreDocumentLike,
): FinanceBoardInvite {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    boardId: readString(data, "boardId"),
    boardName: readString(data, "boardName", "Board"),
    ownerId: readString(data, "ownerId"),
    type: readEnum(data, "type", FINANCE_INVITE_TYPES, "code"),
    email: readOptionalString(data, "email"),
    userId: readOptionalString(data, "userId"),
    status: readEnum(data, "status", FINANCE_INVITE_STATUSES, "pending"),
    createdBy: readString(data, "createdBy"),
    createdAt: readDateString(data, "createdAt"),
    respondedAt: readDateString(data, "respondedAt") || undefined,
  });
}

export type FinanceCategoryDocument = {
  id: string;
  name: string;
  userId?: string;
  boardId?: string;
};

export type FinanceFixedTemplateDocument = {
  id: string;
  userId?: string;
  boardId?: string;
  title: string;
  amount: number;
  day: number;
  type: "income" | "expense";
  category: string;
  active: boolean;
};

export function mapFinanceCategory(doc: FirestoreDocumentLike): FinanceCategoryDocument {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    name: readString(data, "name").trim(),
    userId: readOptionalString(data, "userId"),
    boardId: readOptionalString(data, "boardId"),
  });
}

export function mapFinanceFixedTemplate(
  doc: FirestoreDocumentLike,
): FinanceFixedTemplateDocument {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    userId: readOptionalString(data, "userId"),
    boardId: readOptionalString(data, "boardId"),
    title: readString(data, "title", "Lancamento fixo"),
    amount: readNumber(data, "amount"),
    day: readNumber(data, "day", 1),
    type: readEnum(data, "type", FINANCE_ITEM_TYPES, "expense"),
    category: readString(data, "category", "Fixos"),
    active: readBoolean(data, "active", false),
  });
}

export function createMovedFinanceItemPayload(
  existing: FinanceItem,
  date: string,
  createdAt: string,
): Omit<FinanceItem, "id"> {
  return removeUndefinedValues({
    userId: existing.userId,
    boardId: existing.boardId,
    title: existing.title,
    amount: existing.amount,
    date,
    type: existing.type,
    status: "pending",
    category: existing.category,
    createdAt,
    isFixed: existing.isFixed ?? false,
    isSynthetic: false,
    createdBy: existing.createdBy,
    createdByName: existing.createdByName,
    paidAmount: 0,
    openAmount: existing.amount,
    carriedFromMonth: (existing.date || "").slice(0, 7),
    carriedFromItemId: existing.id,
    originalAmount: existing.originalAmount ?? existing.amount,
    installmentGroupId: existing.installmentGroupId,
    installmentIndex: existing.installmentIndex,
    installmentTotal: existing.installmentTotal,
    cardId: existing.cardId,
    cardName: existing.cardName,
    cardMode: existing.cardMode,
    cardLastDigits: existing.cardLastDigits,
  });
}

export function mapFinanceBudget(doc: FirestoreDocumentLike): FinanceBudget {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    boardId: readString(data, "boardId"),
    month: readString(data, "month"),
    category: readString(data, "category"),
    limit: readNumber(data, "limit"),
    createdBy: readOptionalString(data, "createdBy"),
    createdAt: readDateString(data, "createdAt"),
  });
}

export function mapFinanceSavingsGoal(doc: FirestoreDocumentLike): FinanceSavingsGoal {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    boardId: readString(data, "boardId"),
    title: readString(data, "title", "Meta"),
    targetAmount: readNumber(data, "targetAmount"),
    currentAmount: readNumber(data, "currentAmount"),
    deadline: readOptionalString(data, "deadline"),
    icon: readOptionalString(data, "icon"),
    createdBy: readOptionalString(data, "createdBy"),
    createdAt: readDateString(data, "createdAt"),
  });
}

export function mapFinanceTemplate(doc: FirestoreDocumentLike): FinanceTemplate {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    boardId: readString(data, "boardId"),
    title: readString(data, "title"),
    amount: readNumber(data, "amount"),
    type: readEnum(data, "type", ["income", "expense"] as const, "expense"),
    category: readString(data, "category", "Outros"),
    cardId: readOptionalString(data, "cardId"),
    cardName: readOptionalString(data, "cardName"),
    tags: readStringArray(data, "tags"),
    createdBy: readOptionalString(data, "createdBy"),
    createdAt: readDateString(data, "createdAt"),
  });
}
