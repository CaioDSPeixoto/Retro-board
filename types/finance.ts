export type FinanceStatus = "paid" | "pending" | "partial" | "moved";
export type FinanceDebtType =
  | "card"
  | "invoice"
  | "house_bill"
  | "loan"
  | "person"
  | "financing"
  | "other";
export type FinanceDebtStatus = "active" | "overdue" | "paid" | "renegotiated";

export type FinanceItem = {
  id: string;
  userId: string;

  // board
  boardId?: string;

  // dados principais
  title: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  type: "income" | "expense";
  status: FinanceStatus;
  category: string;
  createdAt: string;

  // fixas / sintéticas
  isFixed?: boolean;
  isSynthetic?: boolean;

  // quem lançou
  createdBy?: string; // userId de quem lançou
  createdByName?: string; // nome pra exibir

  // pagamentos parciais / saldo em aberto
  paidAmount?: number; // quanto já foi pago
  openAmount?: number; // quanto falta (pode ser calculado ou salvo)

  // contas carregadas de outro mês
  carriedFromMonth?: string; // ex: "2025-12"
  carriedFromItemId?: string; // id do item de origem

  fixedTemplateId?: string;
  installmentGroupId?: string;
  installmentIndex?: number;
  installmentTotal?: number;
  originalAmount?: number;

  // cartão (opcional)
  cardId?: string;
  cardName?: string; // "Nubank", "Santander", etc.
  cardMode?: "credit" | "debit"; // crédito / débito
  cardLastDigits?: string;
};

export type FinanceCard = {
  id: string;
  userId: string;
  boardId?: string;
  name: string;
  mode: "credit" | "debit";
  lastDigits?: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
  createdAt: string;
  createdBy?: string;
};

export type FinanceDebt = {
  id: string;
  userId: string;
  boardId: string;
  name: string;
  type: FinanceDebtType;
  originalAmount: number;
  currentBalance: number;
  startDate: string;
  dueDate: string;
  status: FinanceDebtStatus;
  category?: string;
  cardId?: string;
  interestRate?: number;
  penaltyAmount?: number;
  installments?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
};

export type FinanceDebtPayment = {
  id: string;
  debtId: string;
  boardId: string;
  userId: string;
  amount: number;
  paidAt: string;
  note?: string;
  financeItemId?: string;
  createdAt: string;
};

// ====== BOARDS ======

export type FinanceBoard = {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  isPersonal?: boolean;

  // opcionais (se você usar depois)
  code?: string;
  inviteCode?: string;
};

// ====== INVITES (modelo atual do seu app) ======

export type FinanceBoardInviteStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export type FinanceBoardInviteType = "email" | "code";

export type FinanceBoardInvite = {
  id: string;

  boardId: string;
  boardName: string;

  ownerId: string; // dono do board (pra aprovar)
  type: FinanceBoardInviteType;

  // alvo do convite/pedido
  email?: string; // quando type="email"
  userId?: string; // quando type="code"

  status: FinanceBoardInviteStatus;

  createdBy: string; // quem criou (owner no email invite, user no code request)
  createdAt: string;
  respondedAt?: string;
};
