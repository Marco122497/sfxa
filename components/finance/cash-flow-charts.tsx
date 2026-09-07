"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/format";
import type {
  DailyCashFlowRow,
  IncomeSourceSlice,
  MonthlyCashFlowRow,
} from "@/lib/cash-flow";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const cashFlowConfig = {
  inflow: { label: "Cash Inflow", color: "var(--chart-4)" },
  outflow: { label: "Cash Outflow", color: "var(--chart-5)" },
  net: { label: "Net Cash Flow", color: "var(--chart-1)" },
} satisfies ChartConfig;

const lineChartConfig = {
  inflow: { label: "Cash Inflow", color: "var(--chart-1)" },
  outflow: { label: "Cash Outflow", color: "var(--chart-3)" },
} satisfies ChartConfig;

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function eachDay(from: string, to: string) {
  const keys: string[] = [];
  const cursor = parseISODate(from);
  const end = parseISODate(to);
  while (cursor <= end) {
    keys.push(isoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function addDaysIso(value: string, days: number) {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

function minIso(a: string, b: string) {
  return a <= b ? a : b;
}

type CashFlowRange = "daily" | "weekly" | "monthly";

const RANGE_OPTIONS: { id: CashFlowRange; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const RANGE_DESCRIPTION: Record<CashFlowRange, string> = {
  daily: "Cash inflow and outflow for each day in the selected date range.",
  weekly: "Cash inflow and outflow by week in the selected date range.",
  monthly: "Cash inflow and outflow by month in the selected date range.",
};

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function monthPrefix(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function currentMonthBounds(now = new Date()) {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const prefix = monthPrefix(year, monthIndex);
  const lastDay = daysInMonth(year, monthIndex);
  return {
    from: `${prefix}-01`,
    to: `${prefix}-${String(lastDay).padStart(2, "0")}`,
  };
}

function aggregateCashFlow(
  rows: DailyCashFlowRow[],
  range: CashFlowRange,
  from: string,
  to: string
): DailyCashFlowRow[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const days = eachDay(from, to);

  if (range === "daily") {
    return days.map((date) => {
      const row = byDate.get(date);
      const inflow = row?.inflow ?? 0;
      const outflow = row?.outflow ?? 0;
      return { date, inflow, outflow, net: inflow - outflow };
    });
  }

  if (range === "weekly") {
    const result: DailyCashFlowRow[] = [];
    for (let i = 0; i < days.length; i += 7) {
      const slice = days.slice(i, i + 7);
      let inflow = 0;
      let outflow = 0;
      for (const date of slice) {
        const row = byDate.get(date);
        inflow += row?.inflow ?? 0;
        outflow += row?.outflow ?? 0;
      }
      result.push({
        date: slice[0],
        inflow,
        outflow,
        net: inflow - outflow,
      });
    }
    return result;
  }

  const months = new Map<string, { inflow: number; outflow: number }>();
  for (const date of days) {
    const key = date.slice(0, 7);
    const current = months.get(key) ?? { inflow: 0, outflow: 0 };
    const row = byDate.get(date);
    current.inflow += row?.inflow ?? 0;
    current.outflow += row?.outflow ?? 0;
    months.set(key, current);
  }

  return [...months.entries()].map(([key, value]) => ({
    date: `${key}-01`,
    inflow: value.inflow,
    outflow: value.outflow,
    net: value.inflow - value.outflow,
  }));
}

function formatRangeTick(value: string, range: CashFlowRange) {
  const date = parseISODate(value);
  if (range === "monthly") {
    return date.toLocaleDateString("en-PH", { month: "short" });
  }
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

function formatRangeTooltip(
  value: string,
  range: CashFlowRange,
  periodTo: string
) {
  const date = parseISODate(value);
  if (range === "monthly") {
    return date.toLocaleDateString("en-PH", {
      month: "long",
      year: "numeric",
    });
  }
  if (range === "weekly") {
    const weekEnd = minIso(addDaysIso(value, 6), periodTo);
    const fromLabel = date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
    const toLabel = parseISODate(weekEnd).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${fromLabel} – ${toLabel}`;
  }
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function moneyTick(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₱${Math.round(value / 1_000)}k`;
  return `₱${value}`;
}

export function CashFlowBarChart({ data }: { data: MonthlyCashFlowRow[] }) {
  if (data.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No cash flow data yet.
      </p>
    );
  }

  return (
    <ChartContainer
      config={cashFlowConfig}
      className="aspect-auto h-[280px] w-full"
      initialDimension={{ width: 640, height: 280 }}
    >
      <BarChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={56}
          tickFormatter={moneyTick}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {name === "inflow"
                      ? "Cash Inflow"
                      : name === "outflow"
                        ? "Cash Outflow"
                        : "Net Cash Flow"}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatMoney(typeof value === "number" ? value : Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="inflow" fill="var(--color-inflow)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="outflow" fill="var(--color-outflow)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="net" fill="var(--color-net)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  );
}

export function CashFlowLineChart({
  data,
  className,
  title = "Cash Flow",
  from,
  to,
}: {
  data: DailyCashFlowRow[];
  className?: string;
  title?: string;
  from?: string;
  to?: string;
}) {
  const [range, setRange] = useState<CashFlowRange>("daily");
  const now = new Date();
  const monthBounds = currentMonthBounds(now);
  const yearBounds = {
    from: `${now.getFullYear()}-01-01`,
    to: `${now.getFullYear()}-12-31`,
  };
  const periodFrom =
    from ?? (range === "monthly" ? yearBounds.from : monthBounds.from);
  const periodTo =
    to ?? (range === "monthly" ? yearBounds.to : monthBounds.to);
  const chartData = useMemo(
    () => aggregateCashFlow(data, range, periodFrom, periodTo),
    [data, range, periodFrom, periodTo]
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{RANGE_DESCRIPTION[range]}</CardDescription>
        <CardAction>
          <div className="flex rounded-lg border border-border p-0.5">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                size="xs"
                variant={range === option.id ? "secondary" : "ghost"}
                aria-pressed={range === option.id}
                onClick={() => setRange(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No cash flow data yet.
          </p>
        ) : (
          <ChartContainer
            config={lineChartConfig}
            className="aspect-auto h-[250px] w-full"
            initialDimension={{ width: 640, height: 250 }}
          >
            <LineChart
              key={range}
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <YAxis
                hide
                domain={[0, (dataMax: number) => dataMax * 1.25]}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={range === "daily" ? 24 : 0}
                interval={range === "daily" ? "preserveStartEnd" : 0}
                tickFormatter={(value) =>
                  formatRangeTick(String(value), range)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[180px]"
                    labelFormatter={(value) =>
                      formatRangeTooltip(String(value), range, periodTo)
                    }
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {name === "inflow" ? "Cash Inflow" : "Cash Outflow"}
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatMoney(
                            typeof value === "number" ? value : Number(value)
                          )}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="inflow"
                type="monotone"
                stroke="var(--color-inflow)"
                strokeWidth={2}
                dot={range !== "daily"}
              />
              <Line
                dataKey="outflow"
                type="monotone"
                stroke="var(--color-outflow)"
                strokeWidth={2}
                dot={range !== "daily"}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function IncomeSourcesPieChart({ data }: { data: IncomeSourceSlice[] }) {
  if (data.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No income source data yet.
      </p>
    );
  }

  const config = {
    amount: { label: "Amount" },
    ...Object.fromEntries(
      data.map((item) => [item.category, { label: item.category, color: item.fill }])
    ),
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ChartContainer
        config={config}
        className="mx-auto aspect-square h-[220px] w-[220px]"
        initialDimension={{ width: 220, height: 220 }}
      >
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="category"
                formatter={(value, _name, item) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {String(item.payload?.category ?? "")}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {formatMoney(typeof value === "number" ? value : Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            innerRadius={48}
            outerRadius={88}
            strokeWidth={2}
            stroke="#ffffff"
          >
            {data.map((item) => (
              <Cell key={item.category} fill={item.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {data.map((item) => (
          <li key={item.category} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {item.category}
            </span>
            <span className="tabular-nums font-medium">{formatMoney(item.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
