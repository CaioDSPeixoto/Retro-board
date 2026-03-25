"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Spinner from "@/components/ui/Spinner";
import LineChartEvolution from "@/components/finance/LineChartEvolution";
import BarChartCategories from "@/components/finance/BarChartCategories";
import { getChartData } from "@/app/[locale]/tools/finance/(protected)/actions";
import type {
  ChartGroupBy,
  ChartDataPoint,
  CategoryChartDataPoint,
} from "@/types/finance";
import { format, parseISO } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";

type Props = {
  boardId: string;
  selectedMonth: string; // "YYYY-MM"
  locale: string;
};

const GROUP_OPTIONS: ChartGroupBy[] = ["week", "month", "year"];

function getDateLocale(locale: string) {
  if (locale === "pt") return ptBR;
  if (locale === "es") return es;
  return enUS;
}

export default function FinanceChartsPanel({
  boardId,
  selectedMonth,
  locale,
}: Props) {
  const t = useTranslations("FinanceCharts");

  const [groupBy, setGroupBy] = useState<ChartGroupBy>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lineData, setLineData] = useState<ChartDataPoint[]>([]);
  const [barData, setBarData] = useState<CategoryChartDataPoint[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getChartData(boardId || null, selectedMonth, groupBy, locale);

    if ("error" in result) {
      setError(result.error);
      setLineData([]);
      setBarData([]);
    } else {
      setLineData(result.lineData);
      setBarData(result.barData);
    }

    setLoading(false);
  }, [boardId, selectedMonth, groupBy, locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive currentLabel for LineChartEvolution highlight
  const currentLabel = (() => {
    if (groupBy !== "month") return undefined;
    try {
      const dateLocale = getDateLocale(locale);
      const date = parseISO(selectedMonth + "-01");
      let label = format(date, "MMM yyyy", { locale: dateLocale });
      return label.charAt(0).toUpperCase() + label.slice(1);
    } catch {
      return undefined;
    }
  })();

  const groupLabelMap: Record<ChartGroupBy, string> = {
    week: t("groupByWeek"),
    month: t("groupByMonth"),
    year: t("groupByYear"),
  };

  const hasData = lineData.length > 0 || barData.length > 0;

  return (
    <div className="space-y-6">
      {/* Segmented Buttons */}
      <div className="flex items-center justify-start">
        <div
          className="inline-flex rounded-xl p-1 text-xs font-semibold"
          style={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
          }}
          role="group"
          aria-label={t("title")}
        >
          {GROUP_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setGroupBy(option)}
              className={`min-h-[44px] min-w-[44px] px-4 rounded-lg transition-all ${
                groupBy === option
                  ? "shadow-sm"
                  : ""
              }`}
              style={{
                background:
                  groupBy === option
                    ? "var(--color-surface)"
                    : "transparent",
                color:
                  groupBy === option
                    ? "var(--color-accent-primary)"
                    : "var(--color-text-muted)",
              }}
              aria-pressed={groupBy === option}
            >
              {groupLabelMap[option]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <Spinner size="lg" color="blue" />
          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("loading")}
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <p
            className="text-sm font-medium text-center px-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={fetchData}
            className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-sm"
          >
            {t("retryButton")}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !hasData && (
        <div
          className="flex items-center justify-center py-16 rounded-2xl border"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <p
            className="text-sm font-medium text-center px-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("noData")}
          </p>
        </div>
      )}

      {/* Charts */}
      {!loading && !error && hasData && (
        <>
          {/* Line Chart — Evolution */}
          {lineData.length > 0 && (
            <div
              className="rounded-2xl border p-4"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <h4
                className="text-sm font-bold mb-3"
                style={{ color: "var(--color-text-primary)" }}
              >
                {t("evolutionTitle")}
              </h4>
              <LineChartEvolution
                data={lineData}
                currentLabel={currentLabel}
              />
            </div>
          )}

          {/* Bar Chart — Category Distribution */}
          {barData.length > 0 && (
            <div
              className="rounded-2xl border p-4"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <h4
                className="text-sm font-bold mb-3"
                style={{ color: "var(--color-text-primary)" }}
              >
                {t("categoryDistributionTitle")}
              </h4>
              <BarChartCategories data={barData} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
