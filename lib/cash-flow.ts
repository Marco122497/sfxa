import { createClient } from "@/lib/supabase/server";
import { classifyIncomeName, type IncomeCategoryId } from "@/lib/income";
import { relationName } from "@/lib/treasurer/relations";
import { toNumber } from "@/lib/format";

export type CashFlowPeriod = {
  from: string;
  to: string;
};

export type CashFlowBreakdown = {
  label: string;
  amount: number;
};

export type CashFlowStatement = {
  from: string;
  to: string;
  beginningBalance: number;
  inflows: CashFlowBreakdown[];
  totalInflows: number;
  outflows: CashFlowBreakdown[];
  totalOutflows: number;
  netCashFlow: number;
  endingBalance: number;
};

export type MonthlyCashFlowRow = {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
};

export type IncomeSourceSlice = {
  category: string;
  amount: number;
  fill: string;
};

const SOURCE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
  }).format(new Date(year, month - 1, 1));
}

export function lastSixMonthKeys(now = new Date()) {
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    keys.push(`${y}-${m}`);
  }
  return keys;
}

export function currentMonthRange(now = new Date()): CashFlowPeriod {
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const to = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return { from, to };
}

function inflowLabel(kind: IncomeCategoryId) {
  if (kind === "church_service") return "Church Services";
  if (kind === "collection") return "Collections / Offerings";
  if (kind === "other_income") return "Other Income";
  return "Donations";
}

export async function getCashFlowStatement(
  period: CashFlowPeriod = currentMonthRange()
): Promise<CashFlowStatement> {
  const supabase = await createClient();
  const [{ data: donations }, { data: expenses }] = await Promise.all([
    supabase
      .from("donations")
      .select("amount, donation_date, donation_categories(category_name)")
      .order("donation_date"),
    supabase
      .from("expenses")
      .select("amount, expense_date, expense_categories(category_name)")
      .order("expense_date"),
  ]);

  let beginningIn = 0;
  let beginningOut = 0;
  const inflowMap = new Map<string, number>();
  const outflowMap = new Map<string, number>();
  let periodIn = 0;
  let periodOut = 0;

  for (const row of donations ?? []) {
    const amount = toNumber(row.amount);
    const date = String(row.donation_date);
    const kind = classifyIncomeName(
      relationName(row.donation_categories as never)
    );
    if (date < period.from) {
      beginningIn += amount;
      continue;
    }
    if (date > period.to) continue;
    const label = inflowLabel(kind);
    inflowMap.set(label, (inflowMap.get(label) ?? 0) + amount);
    periodIn += amount;
  }

  for (const row of expenses ?? []) {
    const amount = toNumber(row.amount);
    const date = String(row.expense_date);
    const category =
      relationName(row.expense_categories as never) || "Other Expenses";
    if (date < period.from) {
      beginningOut += amount;
      continue;
    }
    if (date > period.to) continue;
    outflowMap.set(category, (outflowMap.get(category) ?? 0) + amount);
    periodOut += amount;
  }

  const beginningBalance = beginningIn - beginningOut;
  const netCashFlow = periodIn - periodOut;

  return {
    from: period.from,
    to: period.to,
    beginningBalance,
    inflows: [...inflowMap.entries()].map(([label, amount]) => ({
      label,
      amount,
    })),
    totalInflows: periodIn,
    outflows: [...outflowMap.entries()].map(([label, amount]) => ({
      label,
      amount,
    })),
    totalOutflows: periodOut,
    netCashFlow,
    endingBalance: beginningBalance + netCashFlow,
  };
}

export async function getMonthlyCashFlow(): Promise<MonthlyCashFlowRow[]> {
  const supabase = await createClient();
  const keys = lastSixMonthKeys();
  const [{ data: donations }, { data: expenses }] = await Promise.all([
    supabase.from("donations").select("amount, donation_date"),
    supabase.from("expenses").select("amount, expense_date"),
  ]);

  const map = new Map(keys.map((key) => [key, { inflow: 0, outflow: 0 }]));
  for (const row of donations ?? []) {
    const key = monthKey(String(row.donation_date));
    const current = map.get(key);
    if (current) current.inflow += toNumber(row.amount);
  }
  for (const row of expenses ?? []) {
    const key = monthKey(String(row.expense_date));
    const current = map.get(key);
    if (current) current.outflow += toNumber(row.amount);
  }

  return keys.map((key) => {
    const value = map.get(key)!;
    return {
      month: monthLabel(key),
      inflow: value.inflow,
      outflow: value.outflow,
      net: value.inflow - value.outflow,
    };
  });
}

export async function getIncomeSourceSlices(): Promise<IncomeSourceSlice[]> {
  const supabase = await createClient();
  const { data: donations } = await supabase
    .from("donations")
    .select("amount, donation_categories(category_name)");

  const totals = new Map<string, number>();
  for (const row of donations ?? []) {
    const label = inflowLabel(
      classifyIncomeName(relationName(row.donation_categories as never))
    );
    totals.set(label, (totals.get(label) ?? 0) + toNumber(row.amount));
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount], index) => ({
      category,
      amount,
      fill: SOURCE_COLORS[index % SOURCE_COLORS.length],
    }));
}
