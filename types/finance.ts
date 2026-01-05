export type FinanceStatus = "paid" | "pending" | "partial";

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
  createdBy?: string;       // userId de quem lançou
  createdByName?: string;   // nome bonitinho pra exibir

  // pagamentos parciais / saldo em aberto
  paidAmount?: number;      // quanto já foi pago
  openAmount?: number;      // quanto falta (pode ser calculado ou salvo)

  // contas carregadas de outro mês
  carriedFromMonth?: string;   // ex: "2025-12"
  carriedFromItemId?: string;  // id do item de origem
};

/**
 * Quadro de finanças (board)
 * Ex: "Casa", "Viagem amigos", "Investimentos"
 */
export type FinanceBoard = {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  isPersonal?: boolean;

  // caso você tenha código de convite do board
  code?: string;
  inviteCode?: string;

  // campos extras que você vier a usar depois
  // podem ser adicionados aqui como opcionais
};

/**
 * Convite para participar de um board
 * (se você estiver usando coleções de convites)
 */
export type FinanceBoardInviteStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export type FinanceBoardInviteDirection = "toOwner" | "toUser";

export type FinanceBoardInvite = {
  id: string;
  boardId: string;
  boardName: string;

  fromUserId: string;
  fromUserEmail?: string;

  toUserId?: string;
  toEmail: string;

  status: FinanceBoardInviteStatus;
  direction: FinanceBoardInviteDirection;

  createdAt: string;
};