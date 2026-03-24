import type { InvestmentCategory } from "@/types/finance";

export const CARD_FIXED_CATEGORY = "Cartão Fixo";
export const ACCOUNT_FIXED_CATEGORY = "Contas Fixas";

export const BUILTIN_CATEGORIES = [
  "Alimentação",
  "Transporte",
  CARD_FIXED_CATEGORY,
  ACCOUNT_FIXED_CATEGORY,
];

export const INVESTMENT_CATEGORIES: InvestmentCategory[] = [
  "emergency",
  "fixed-income",
  "variable-income",
];

export const INVESTMENT_CATEGORY_KEYS: Record<InvestmentCategory, string> = {
  "emergency": "investmentEmergency",
  "fixed-income": "investmentFixedIncome",
  "variable-income": "investmentVariableIncome",
};
