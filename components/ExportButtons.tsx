"use client";

import { Card } from "@/types/card";
import jsPDF from "jspdf";
import { useTranslations } from "next-intl";

type Props = {
  cards: Card[];
  title?: string;
};

export default function ExportButtons({ cards, title }: Props) {
  const t = useTranslations("Export");

  const CATEGORY_ORDER: Record<Card["category"], number> = {
    bom: 0,
    ruim: 1,
    melhorar: 2,
  };

  const CATEGORY_COLORS: Record<Card["category"], string> = {
    bom: "#d1fae5",
    ruim: "#fee2e2",
    melhorar: "#fef3c7",
  };

  const sanitizeFileName = (name: string) => name.replace(/[/\\?%*:|"<>]/g, "_");

  const exportPDF = () => {
    const reportTitle = title || t("defaultTitle");
    const sortedCards = [...cards].sort(
      (a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category]
    );

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    doc.setFontSize(12);

    let y = 30;

    sortedCards.forEach((card, index) => {
      const color = CATEGORY_COLORS[card.category] || "#ffffff";
      doc.setFillColor(color);
      doc.rect(10, y - 4, 190, 8, "F");

      const line = `${index + 1}. [${card.category.toUpperCase()}] ${card.text} (${t(
        "author"
      )}: ${card.author || t("anonymous")}) ${t("likes")}: ${card.likes} / ${t(
        "dislikes"
      )}: ${card.dislikes}`;

      doc.text(line, 14, y);
      y += 10;

      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`${sanitizeFileName(reportTitle)}.pdf`);
  };

  const escapeCsvField = (value: string | number) => {
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportCSV = () => {
    const reportTitle = title || t("defaultTitle");
    const sortedCards = [...cards].sort(
      (a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category]
    );

    const headers = [t("category"), t("content"), t("author"), t("likes"), t("dislikes")];
    const rows = sortedCards.map((card) => [
      escapeCsvField(card.category),
      escapeCsvField(card.text),
      escapeCsvField(card.author || t("anonymous")),
      escapeCsvField(card.likes),
      escapeCsvField(card.dislikes),
    ]);

    const bom = "\uFEFF";
    const csv = bom + [headers.map(escapeCsvField).join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFileName(reportTitle)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-4 mt-6 justify-center">
      <button
        onClick={exportPDF}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        {t("exportPDF")}
      </button>
      <button
        onClick={exportCSV}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        {t("exportCSV")}
      </button>
    </div>
  );
}
