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
