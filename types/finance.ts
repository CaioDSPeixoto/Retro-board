export type FinanceStatus = "paid" | "pending" | "partial" | "moved";

// ====== INTEREST ======

export type InterestType = "percentage" | "fixed" | "both";

export type InterestConfig = {
  type: InterestType;
  rate?: number; // 0-100, percentual
  fixedAmount?: number; // valor fixo por parcela
};

// ====== SUB-ITEMS ======

export type SubItem = {
  id: string;
  title: string;
  amount: number;
  createdAt: string;
};

// ====== INVESTMENTS ======

export type InvestmentCategory = "emergency" | "fixed-income" | "variable-income";

export type InvestmentAllocation = {
  category: InvestmentCategory;
  percentage: number; // 0-100
};

export type InvestmentConfig = {
  id: string;
  userId: string;
  boardId?: string;
  allocations: InvestmentAllocation[];
  updatedAt: string;
};

// ====== CHARTS ======

export type ChartGroupBy = "week" | "month" | "year";

export type ChartDataPoint = {
  label: string;
  income: number;
  expense: number;
  balance: number;
};

export type CategoryChartDataPoint = {
  label: string;
  [category: string]: number | string;
};

// ====== FINANCE ITEM ======

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
  cardName?: string; // "Nubank", "Santander", etc.
  cardMode?: "credit" | "debit"; // crédito / débito

  // juros (opcional)
  interestConfig?: InterestConfig;
  interestAmount?: number; // valor de juros calculado para esta parcela

  // investimento (opcional)
  investmentCategory?: InvestmentCategory;
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
