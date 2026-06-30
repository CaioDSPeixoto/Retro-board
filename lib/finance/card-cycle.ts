export type CardStatementCycle = {
  start: string;
  end: string;
};

function clampDay(year: number, monthIndex: number, day: number): number {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(Math.max(day, 1), lastDay);
}

function toDateString(year: number, monthIndex: number, day: number): string {
  const safeDay = clampDay(year, monthIndex, day);
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

export function getCardStatementCycle(
  statementMonth: string,
  closingDay?: number,
  dueDay?: number,
): CardStatementCycle | null {
  if (!closingDay || !dueDay || !/^\d{4}-\d{2}$/.test(statementMonth)) {
    return null;
  }

  const [yearRaw, monthRaw] = statementMonth.split("-");
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  if (!year || monthIndex < 0 || monthIndex > 11) return null;

  const end = toDateString(year, monthIndex, closingDay);
  const startBase = new Date(year, monthIndex - 1, 1);
  const startDay = clampDay(startBase.getFullYear(), startBase.getMonth(), closingDay) + 1;
  const start =
    startDay > new Date(startBase.getFullYear(), startBase.getMonth() + 1, 0).getDate()
      ? toDateString(year, monthIndex, 1)
      : toDateString(startBase.getFullYear(), startBase.getMonth(), startDay);

  return { start, end };
}

export function isDateInCycle(date: string, cycle: CardStatementCycle): boolean {
  return date >= cycle.start && date <= cycle.end;
}
