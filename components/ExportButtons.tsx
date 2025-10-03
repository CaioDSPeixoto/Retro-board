"use client";

import { Card } from "@/types/card";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useTranslations } from "next-intl";

type Props = {
  cards: Card[];
  title?: string; // título customizável opcional
};

export default function ExportButtons({ cards, title }: Props) {
  const t = useTranslations("Export");

  // Ordem das categorias
  const CATEGORY_ORDER: Record<Card["category"], number> = {
    bom: 0,
    ruim: 1,
    melhorar: 2,
  };

  // Cores do PDF
  const CATEGORY_COLORS: Record<Card["category"], string> = {
    bom: "#d1fae5",
    ruim: "#fee2e2",
    melhorar: "#fef3c7",
  };

  // Sanitiza nomes de arquivo/planilha
  const sanitizeFileName = (name: string) => name.replace(/[/\\?%*:|"<>]/g, "_");

  // Exporta PDF
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

      // Quebra de página
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`${sanitizeFileName(reportTitle)}.pdf`);
  };

  // Exporta Excel
  const exportExcel = () => {
    const reportTitle = title || t("defaultTitle");
    const sortedCards = [...cards].sort(
      (a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category]
    );

    const worksheetData = sortedCards.map((card) => ({
      [t("category")]: card.category,
      [t("content")]: card.text,
      [t("author")]: card.author || t("anonymous"),
      [t("likes")]: card.likes,
      [t("dislikes")]: card.dislikes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();

    const sheetName = sanitizeFileName(reportTitle);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${sheetName}.xlsx`);
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
        onClick={exportExcel}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        {t("exportExcel")}
      </button>
    </div>
  );
}
