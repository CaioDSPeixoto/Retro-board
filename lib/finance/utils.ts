import type { InterestConfig } from "@/types/finance";

/**
 * Retorna o primeiro e último dia de um mês no formato "YYYY-MM-DD".
 */
export function getMonthRange(month: string): { start: string; end: string } {
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);

  const start = `${yearStr}-${monthStr}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const end = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

  return { start, end };
}

/**
 * Normaliza uma string para busca (remove acentos, lowercase, trim).
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Distribui um total em centavos (inteiro) entre `count` partes.
 * As primeiras parcelas recebem +1 centavo até esgotar o resto.
 * A soma do array retornado é sempre exatamente `totalCents`.
 */
export function distributeAmountInCents(totalCents: number, count: number): number[] {
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

type InstallmentBreakdown = {
  base: number;
  interest: number;
  total: number;
};

/**
 * Calcula o valor de cada parcela com juros aplicados.
 *
 * - Percentual: juros = saldoDevedor × (rate / 100) por parcela
 * - Fixo: juros = fixedAmount por parcela
 * - Ambos: percentual primeiro, depois soma fixo
 *
 * Valores retornados em reais. Cálculos internos em centavos para precisão.
 */
export function calculateInterestInstallments(
  total: number,
  installments: number,
  interestConfig: InterestConfig,
): InstallmentBreakdown[] {
  const totalCents = Math.round(total * 100);
  const baseCentsArr = distributeAmountInCents(totalCents, installments);

  const result: InstallmentBreakdown[] = [];
  let paidBaseCents = 0;

  for (let i = 0; i < installments; i++) {
    const baseCents = baseCentsArr[i];
    let interestCents = 0;

    const rate = interestConfig.rate ?? 0;
    const fixedAmount = interestConfig.fixedAmount ?? 0;

    if (interestConfig.type === "percentage" || interestConfig.type === "both") {
      const outstandingCents = totalCents - paidBaseCents;
      interestCents += Math.round(outstandingCents * (rate / 100));
    }

    if (interestConfig.type === "fixed" || interestConfig.type === "both") {
      interestCents += Math.round(fixedAmount * 100);
    }

    paidBaseCents += baseCents;

    result.push({
      base: baseCents / 100,
      interest: interestCents / 100,
      total: (baseCents + interestCents) / 100,
    });
  }

  return result;
}
