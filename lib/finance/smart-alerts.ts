import type { FinanceBudget, FinanceItem } from "@/types/finance";

export type SmartAlert = {
  type: "unusual_spending" | "budget_warning";
  category: string;
  value: number;
  average?: number;
  budgetLimit?: number;
  percent?: number;
};

/**
 * Detecta gastos incomuns comparando com o mês anterior
 * e alerta quando uma categoria ultrapassa 80% do orçamento.
 */
export function calculateSmartAlerts(
  currentItems: FinanceItem[],
  previousItems: FinanceItem[],
  budgets: FinanceBudget[],
): SmartAlert[] {
  const alerts: SmartAlert[] = [];

  // Gastos atuais por categoria
  const currentByCategory = new Map<string, number>();
  for (const item of currentItems) {
    if (item.type !== "expense" || item.status === "moved" || item.isSynthetic) continue;
    currentByCategory.set(item.category, (currentByCategory.get(item.category) ?? 0) + item.amount);
  }

  // Gastos do mês anterior por categoria (usados como "média")
  const prevByCategory = new Map<string, number>();
  for (const item of previousItems) {
    if (item.type !== "expense" || item.status === "moved" || item.isSynthetic) continue;
    prevByCategory.set(item.category, (prevByCategory.get(item.category) ?? 0) + item.amount);
  }

  // Detecta gasto incomum (>50% acima do mês anterior, mínimo R$100 de diferença)
  for (const [category, current] of currentByCategory) {
    const prev = prevByCategory.get(category) ?? 0;
    if (prev <= 0) continue;
    const diff = current - prev;
    if (diff > 100 && current > prev * 1.5) {
      alerts.push({
        type: "unusual_spending",
        category,
        value: current,
        average: prev,
      });
    }
  }

  // Budget warnings (>80% do limite)
  const budgetMap = new Map(budgets.map((b) => [b.category, b.limit]));
  for (const [category, current] of currentByCategory) {
    const limit = budgetMap.get(category);
    if (!limit || limit <= 0) continue;
    const percent = (current / limit) * 100;
    if (percent >= 80 && percent < 100) {
      alerts.push({
        type: "budget_warning",
        category,
        value: current,
        budgetLimit: limit,
        percent: Math.round(percent),
      });
    }
  }

  return alerts.sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).slice(0, 5);
}
