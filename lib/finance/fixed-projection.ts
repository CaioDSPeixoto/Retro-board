import type { FinanceItem } from "@/types/finance";
import type { FinanceFixedTemplateDocument } from "@/lib/finance/schema";

function getDateForTemplate(monthKey: string, day: number): string {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const lastDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(Math.max(Number(day || 1), 1), lastDay);
  return `${yearText}-${monthText}-${String(safeDay).padStart(2, "0")}`;
}

export function createProjectedFixedItems(
  templates: FinanceFixedTemplateDocument[],
  months: string[],
  existingItems: FinanceItem[],
  sessionUserId: string,
): FinanceItem[] {
  const existingFixedKeys = new Set(
    existingItems
      .filter((item) => item.fixedTemplateId)
      .map((item) => `${item.fixedTemplateId}:${item.date.slice(0, 7)}`),
  );

  return templates.flatMap((template) => {
    if (!template.active) return [];

    return months.flatMap((month) => {
      if (existingFixedKeys.has(`${template.id}:${month}`)) return [];

      return [{
        id: `projected_fixed_${template.id}_${month}`,
        userId: template.userId || sessionUserId,
        boardId: template.boardId,
        title: template.title,
        amount: template.amount,
        date: getDateForTemplate(month, template.day),
        type: template.type,
        status: "pending",
        category: template.category,
        createdAt: `${month}-01T00:00:00.000Z`,
        isFixed: true,
        isSynthetic: false,
        fixedTemplateId: template.id,
        paidAmount: 0,
        openAmount: template.amount,
      } satisfies FinanceItem];
    });
  });
}
