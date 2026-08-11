"use client";

import {
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
  DailyIncomePoint,
  ExpenseCategorySlice,
} from "@/lib/treasurer/dashboard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const dailyIncomeConfig = {
  income: {
    label: "Income",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const expenseCategoryConfig = {
  amount: {
    label: "Amount",
  },
} satisfies ChartConfig;

function moneyTick(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₱${Math.round(value / 1_000)}k`;
  return `₱${value}`;
}

export function DailyIncomeLineChart({ data }: { data: DailyIncomePoint[] }) {
  const hasIncome = data.some((row) => row.income > 0);

  if (!hasIncome) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No income recorded this week yet.
      </p>
    );
  }

  return (
    <ChartContainer
      config={dailyIncomeConfig}
      className="aspect-auto h-[280px] w-full"
      initialDimension={{ width: 640, height: 280 }}
    >
      <LineChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
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
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">Income</span>
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
        <Line
          type="monotone"
          dataKey="income"
          stroke="var(--color-income)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-income)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function ExpenseDistributionPieChart({
  data,
}: {
  data: ExpenseCategorySlice[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No expense category data yet.
      </p>
    );
  }

  const config = {
    ...expenseCategoryConfig,
    ...Object.fromEntries(
      data.map((item) => [
        item.category,
        { label: item.category, color: item.fill },
      ])
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
                      {formatMoney(
                        typeof value === "number" ? value : Number(value)
                      )}
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
            stroke="var(--background)"
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
            <span className="tabular-nums font-medium">{item.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
