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
  inflow: { label: "Cash Inflow", color: "#2563eb" },
  outflow: { label: "Cash Outflow", color: "#0ea5e9" },
} satisfies ChartConfig;

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

type CashFlowRange = "daily" | "weekly" | "monthly";

const RANGE_OPTIONS: { id: CashFlowRange; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const RANGE_DESCRIPTION: Record<CashFlowRange, string> = {
  daily: "Cash inflow and outflow for each day this month.",
  weekly: "Cash inflow and outflow for the 4 weeks this month.",
  monthly: "Cash inflow and outflow for the 12 months this year.",
};

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function monthPrefix(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function weekNumberFromDay(day: number) {
  return Math.min(4, Math.ceil(day / 7));
}

function weekRange(year: number, monthIndex: number, week: number) {
  const lastDay = daysInMonth(year, monthIndex);
  const from = (week - 1) * 7 + 1;
  const to = week === 4 ? lastDay : week * 7;
  return { from, to };
}

function aggregateCashFlow(
  rows: DailyCashFlowRow[],
  range: CashFlowRange,
  now = new Date()
): DailyCashFlowRow[] {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const prefix = monthPrefix(year, monthIndex);
  const byDate = new Map(rows.map((row) => [row.date, row]));

  if (range === "daily") {
    const lastDay = daysInMonth(year, monthIndex);
    const result: DailyCashFlowRow[] = [];
    for (let day = 1; day <= lastDay; day++) {
      const date = `${prefix}-${String(day).padStart(2, "0")}`;
      const row = byDate.get(date);
      const inflow = row?.inflow ?? 0;
      const outflow = row?.outflow ?? 0;
      result.push({ date, inflow, outflow, net: inflow - outflow });
    }
    return result;
  }

  if (range === "weekly") {
    return [1, 2, 3, 4].map((week) => {
      const { from, to } = weekRange(year, monthIndex, week);
      let inflow = 0;
      let outflow = 0;
      for (let day = from; day <= to; day++) {
        const date = `${prefix}-${String(day).padStart(2, "0")}`;
        const row = byDate.get(date);
        inflow += row?.inflow ?? 0;
        outflow += row?.outflow ?? 0;
      }
      return {
        date: `${prefix}-${String(from).padStart(2, "0")}`,
        inflow,
        outflow,
        net: inflow - outflow,
      };
    });
  }

  const months = Array.from({ length: 12 }, () => ({
    inflow: 0,
    outflow: 0,
  }));
  const yearPrefix = `${year}-`;
  for (const row of rows) {
    if (!row.date.startsWith(yearPrefix)) continue;
    const month = Number(row.date.slice(5, 7)) - 1;
    if (month < 0 || month > 11) continue;
    months[month].inflow += row.inflow;
    months[month].outflow += row.outflow;
  }

  return months.map((value, index) => ({
    date: `${monthPrefix(year, index)}-01`,
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
  if (range === "weekly") {
    return `Week ${weekNumberFromDay(date.getDate())}`;
  }
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

function formatRangeTooltip(value: string, range: CashFlowRange) {
  const date = parseISODate(value);
  if (range === "monthly") {
    return date.toLocaleDateString("en-PH", {
      month: "long",
      year: "numeric",
    });
  }
  if (range === "weekly") {
    const week = weekNumberFromDay(date.getDate());
    const { from, to } = weekRange(
      date.getFullYear(),
      date.getMonth(),
      week
    );
    const month = date.toLocaleDateString("en-PH", { month: "short" });
    return `Week ${week} · ${month} ${from}–${to}, ${date.getFullYear()}`;
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
}: {
  data: DailyCashFlowRow[];
  className?: string;
  title?: string;
}) {
  const [range, setRange] = useState<CashFlowRange>("daily");
  const chartData = useMemo(
    () => aggregateCashFlow(data, range),
    [data, range]
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
                      formatRangeTooltip(String(value), range)
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
