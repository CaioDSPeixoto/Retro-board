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
 * Retorna o mês anterior no formato "YYYY-MM".
 */
export function getPreviousMonthKey(month: string): string {
  const [yearStr, monthStr] = month.split("-");
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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
