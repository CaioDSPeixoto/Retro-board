import type { FinanceDebt } from "@/types/finance";

export type DebtStrategyType = "snowball" | "avalanche";

export type DebtPayoffEntry = {
  month: number;
  debtId: string;
  debtName: string;
  payment: number;
  remainingBalance: number;
};

export type DebtStrategyResult = {
  type: DebtStrategyType;
  months: number;
  totalPaid: number;
  totalInterest: number;
  timeline: DebtPayoffEntry[];
};

/**
 * Calcula o plano de quitação de dívidas usando método snowball ou avalanche.
 * - Snowball: menor saldo primeiro
 * - Avalanche: maior juros primeiro
 */
export function calculateDebtPayoff(
  debts: FinanceDebt[],
  monthlyExtra: number,
  strategy: DebtStrategyType,
): DebtStrategyResult {
  const openDebts = debts.filter((d) => d.status !== "paid" && d.currentBalance > 0);
  if (openDebts.length === 0) {
    return { type: strategy, months: 0, totalPaid: 0, totalInterest: 0, timeline: [] };
  }

  // Clone para simulação
  const simDebts = openDebts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.currentBalance,
    interestRate: d.interestRate ?? 0, // % mensal
    minimumPayment: d.installments && d.installments > 0
      ? Math.ceil((d.currentBalance / d.installments) * 100) / 100
      : Math.max(d.currentBalance * 0.05, 50), // 5% ou mínimo R$50
  }));

  // Ordena conforme estratégia
  const sortDebts = () => {
    if (strategy === "snowball") {
      simDebts.sort((a, b) => a.balance - b.balance);
    } else {
      simDebts.sort((a, b) => b.interestRate - a.interestRate);
    }
  };

  const timeline: DebtPayoffEntry[] = [];
  let month = 0;
  let totalPaid = 0;
  let totalInterest = 0;
  const maxMonths = 360; // 30 anos de segurança

  while (simDebts.some((d) => d.balance > 0) && month < maxMonths) {
    month++;
    sortDebts();

    // Aplica juros
    for (const debt of simDebts) {
      if (debt.balance <= 0) continue;
      const interest = debt.balance * (debt.interestRate / 100);
      debt.balance += interest;
      totalInterest += interest;
    }

    // Paga mínimo de cada dívida
    let remainingBudget = monthlyExtra;
    for (const debt of simDebts) {
      if (debt.balance <= 0) continue;
      const minPayment = Math.min(debt.minimumPayment, debt.balance);
      debt.balance -= minPayment;
      totalPaid += minPayment;
      remainingBudget -= minPayment;

      if (debt.balance <= 0.01) debt.balance = 0;
    }

    // Aloca extra na dívida prioritária (primeira da lista ordenada com saldo)
    for (const debt of simDebts) {
      if (debt.balance <= 0 || remainingBudget <= 0) continue;
      const extraPayment = Math.min(remainingBudget, debt.balance);
      debt.balance -= extraPayment;
      totalPaid += extraPayment;
      remainingBudget -= extraPayment;

      if (debt.balance <= 0.01) debt.balance = 0;
      break; // todo extra vai pra primeira dívida prioritária
    }

    // Registra timeline
    for (const debt of simDebts) {
      timeline.push({
        month,
        debtId: debt.id,
        debtName: debt.name,
        payment: 0, // simplificado
        remainingBalance: Math.max(debt.balance, 0),
      });
    }
  }

  return {
    type: strategy,
    months: month,
    totalPaid: Number(totalPaid.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    timeline,
  };
}
