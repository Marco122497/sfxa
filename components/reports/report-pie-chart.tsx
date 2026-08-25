"use client";

import { Cell, Pie, PieChart } from "recharts";

import { formatMoney } from "@/lib/format";
import type { ReportBreakdownItem } from "@/lib/reports-data";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/** Flat monochrome blues — light to dark, matching the reference chart */
const BLUE_PALETTE = [
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
  "#1e3a8a",
  "#172554",
];

function slugify(label: string, index: number) {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `item-${index}`;
}

function shortAmount(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₱${Math.round(value / 1_000)}k`;
  return `₱${Math.round(value)}`;
}

export function ReportPieChart({
  breakdown,
  title,
}: {
  breakdown: ReportBreakdownItem[];
  title?: string;
}) {
  if (breakdown.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-[#6b7c90]">
        No breakdown available.
      </div>
    );
  }

  const chartData = breakdown.map((item, index) => {
    const key = slugify(item.label, index);
    const fill = BLUE_PALETTE[index % BLUE_PALETTE.length];
    return {
      key,
      category: item.label,
      amount: item.amount,
      percent: item.percent,
      fill,
    };
  });

  const chartConfig = {
    amount: {
      label: "Amount",
    },
    ...Object.fromEntries(
      chartData.map((item) => [
        item.key,
        {
          label: item.category,
          color: item.fill,
        },
      ])
    ),
  } satisfies ChartConfig;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[240px] w-full px-0 print:max-h-[220px]"
        initialDimension={{ width: 260, height: 260 }}
      >
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="category"
                hideLabel
                formatter={(value, _name, item) => (
                  <div className="flex w-full flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {String(item.payload?.category ?? "")}
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {formatMoney(
                        typeof value === "number" ? value : Number(value)
                      )}{" "}
                      ({item.payload?.percent ?? 0}%)
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={90}
            stroke="#ffffff"
            strokeWidth={1}
            isAnimationActive={false}
            labelLine={false}
            label={({ payload, ...props }) => {
              const amount = Number(payload?.amount ?? 0);
              if (!amount) return null;
              return (
                <text
                  cx={props.cx}
                  cy={props.cy}
                  x={props.x}
                  y={props.y}
                  textAnchor={props.textAnchor}
                  dominantBaseline={props.dominantBaseline}
                  fill="#334155"
                  className="text-[11px] font-medium"
                >
                  {shortAmount(amount)}
                </text>
              );
            }}
          >
            {chartData.map((item) => (
              <Cell key={item.key} fill={item.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="w-full space-y-1.5 text-[13px]">
        {breakdown.map((item, index) => (
          <li key={item.label} className="flex items-start gap-2">
            <span
              className="mt-1 size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: BLUE_PALETTE[index % BLUE_PALETTE.length],
              }}
            />
            <span className="min-w-0">
              <span className="font-medium text-[#1a2332]">{item.label}: </span>
              <span className="tabular-nums text-[#3d4f63]">
                {formatMoney(item.amount)} ({item.percent}%)
              </span>
            </span>
          </li>
        ))}
      </ul>

      {title ? (
        <p className="text-center text-xs text-muted-foreground print:hidden">
          {title}
        </p>
      ) : null}
    </div>
  );
}
