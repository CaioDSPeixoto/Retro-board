import type { FinanceItem } from "@/types/finance";

function escapeCsvValue(value: string | number): string {
  const text = String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportFinanceItemsCsv(items: FinanceItem[], fileName: string) {
  const headers = [
    "Data",
    "Tipo",
    "Categoria",
    "Descrição",
    "Valor",
    "Status",
    "Valor Pago",
    "Valor Aberto",
    "Cartão",
    "Notas",
    "Tags",
  ];

  const rows = items.map((item) => [
    item.date,
    item.type === "income" ? "Receita" : "Despesa",
    item.category,
    item.title,
    item.amount.toFixed(2).replace(".", ","),
    item.status,
    (item.paidAmount ?? 0).toFixed(2).replace(".", ","),
    (item.openAmount ?? Math.max(item.amount - (item.paidAmount || 0), 0)).toFixed(2).replace(".", ","),
    item.cardName || "",
    item.notes || "",
    (item.tags || []).join("; "),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(";"))
    .join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
