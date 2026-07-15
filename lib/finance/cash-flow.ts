import type { FinanceItem } from "@/types/finance";
import { getPaidAmount, getOpenAmount } from "@/lib/finance/calculations";

export type DailyCashFlowEntry = {
  date: string;
  balance: number;
  income: number;
  expense: number;
};

/**
 * Calcula o fluxo de caixa diário para um mês,
 * partindo de um saldo inicial (balance antes do mês).
 */
export function calculateDailyCashFlow(
  items: FinanceItem[],
  monthKey: string,
  startBalance: number,
): DailyCashFlowEntry[] {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Agrupa items por dia
  const dailyMap = new Map<string, { income: number; expense: number }>();

  for (const item of items) {
    if (item.isSynthetic || item.status === "moved") continue;
    if (!item.date.startsWith(monthKey)) continue;

    const day = item.date;
    const entry = dailyMap.get(day) ?? { income: 0, expense: 0 };

    // Usa valor pago (realizado) + valor aberto (previsto)
    const realized = getPaidAmount(item);
    const pending = getOpenAmount(item);
    const total = realized + pending;

    if (item.type === "income") {
      entry.income += total;
    } else {
      entry.expense += total;
    }

    dailyMap.set(day, entry);
  }

  // Gera array dia a dia com saldo acumulado
  const result: DailyCashFlowEntry[] = [];
  let runningBalance = startBalance;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${yearStr}-${monthStr}-${String(d).padStart(2, "0")}`;
    const dayData = dailyMap.get(dateKey) ?? { income: 0, expense: 0 };

    runningBalance += dayData.income - dayData.expense;

    result.push({
      date: dateKey,
      balance: Number(runningBalance.toFixed(2)),
      income: Number(dayData.income.toFixed(2)),
      expense: Number(dayData.expense.toFixed(2)),
    });
  }

  return result;
}
