"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartDataPoint } from "@/types/finance";

type Props = {
  data: ChartDataPoint[];
  currentLabel?: string;
};

const COLORS = {
  income: "#22c55e",
  expense: "#ef4444",
  balance: "#3b82f6",
} as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  incomeLabel: string;
  expenseLabel: string;
  balanceLabel: string;
};

function CustomTooltip({
  active,
  payload,
  label,
  incomeLabel,
  expenseLabel,
  balanceLabel,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const labelMap: Record<string, string> = {
    income: incomeLabel,
    expense: expenseLabel,
    balance: balanceLabel,
  };

  return (
    <div
      className="rounded-xl border p-3 shadow-lg text-sm"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <p
        className="font-bold text-xs mb-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span style={{ color: "var(--color-text-secondary)" }}>
            {labelMap[entry.name] ?? entry.name}:
          </span>
          <span className="font-semibold" style={{ color: entry.color }}>
            {formatCurrency(entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

type CustomDotProps = {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
  currentLabel?: string;
  color: string;
};

function CurrentMonthDot({ cx, cy, payload, currentLabel, color }: CustomDotProps) {
  if (!cx || !cy || !payload || payload.label !== currentLabel) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={color}
      stroke="var(--color-surface)"
      strokeWidth={2}
    />
  );
}

export default function LineChartEvolution({ data, currentLabel }: Props) {
  const t = useTranslations("FinanceCharts");
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  const incomeLabel = t("incomeLabel");
  const expenseLabel = t("expenseLabel");
  const balanceLabel = t("balanceLabel");

  const handleLegendClick = useCallback(
    (dataKey: string) => {
      setHiddenLines((prev) => {
        const next = new Set(prev);
        if (next.has(dataKey)) {
          next.delete(dataKey);
        } else {
          next.add(dataKey);
        }
        return next;
      });
    },
    [],
  );

  const legendPayload = [
    { value: incomeLabel, dataKey: "income", color: COLORS.income },
    { value: expenseLabel, dataKey: "expense", color: COLORS.expense },
    { value: balanceLabel, dataKey: "balance", color: COLORS.balance },
  ];

  const renderLegend = useCallback(
    () => (
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {legendPayload.map((entry) => {
          const isHidden = hiddenLines.has(entry.dataKey);
          return (
            <button
              key={entry.dataKey}
              type="button"
              onClick={() => handleLegendClick(entry.dataKey)}
              className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-opacity duration-200 min-h-[44px] min-w-[44px] cursor-pointer"
              style={{
                opacity: isHidden ? 0.4 : 1,
                color: isHidden ? "var(--color-text-muted)" : entry.color,
              }}
            >
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{
                  backgroundColor: isHidden ? "var(--color-text-muted)" : entry.color,
                }}
              />
              {entry.value}
            </button>
          );
        })}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hiddenLines, incomeLabel, expenseLabel, balanceLabel],
  );

  if (!data.length) return null;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-subtle)"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
            width={45}
          />
          <Tooltip
            content={
              <CustomTooltip
                incomeLabel={incomeLabel}
                expenseLabel={expenseLabel}
                balanceLabel={balanceLabel}
              />
            }
          />
          <Legend content={renderLegend} />
          <Line
            type="monotone"
            dataKey="income"
            name="income"
            stroke={COLORS.income}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
            hide={hiddenLines.has("income")}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="expense"
            stroke={COLORS.expense}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
            hide={hiddenLines.has("expense")}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="balance"
            stroke={COLORS.balance}
            strokeWidth={2}
            dot={
              currentLabel
                ? (props: Record<string, unknown>) => (
                    <CurrentMonthDot
                      key={`balance-dot-${props.index}`}
                      cx={props.cx as number}
                      cy={props.cy as number}
                      payload={props.payload as ChartDataPoint}
                      currentLabel={currentLabel}
                      color={COLORS.balance}
                    />
                  )
                : false
            }
            activeDot={{ r: 5, strokeWidth: 0 }}
            hide={hiddenLines.has("balance")}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
