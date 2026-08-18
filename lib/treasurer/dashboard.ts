import { createClient } from "@/lib/supabase/server";
import { isCollectionCategoryName } from "@/lib/categories";
import { toNumber } from "@/lib/format";
import { relationName } from "@/lib/treasurer/relations";
import { getBudgetModuleData } from "@/lib/treasurer/budget-data";
import { actualCash } from "@/lib/finance-ledgers";

export type TreasurerDashboardStats = {
  todaysDonations: number;
  todaysCollections: number;
  todaysExpenses: number;
  currentBalance: number;
};

export type DailyIncomePoint = {
  day: string;
  date: string;
  income: number;
};

export type ExpenseCategorySlice = {
  category: string;
  amount: number;
  percent: number;
  fill: string;
};

export type TreasurerTransaction = {
  id: string;
  date: string;
  transaction: "Donation" | "Collection" | "Expense";
  category: string;
  amount: number;
};

export type BudgetStatusRow = {
  category: string;
  used: number;
  remaining: number;
};

const EXPENSE_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-3)",
];

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-PH", { weekday: "short" }).format(date);
}

/** Monday–Sunday of the current local week. */
function currentWeekDays(now = new Date()) {
  const day = now.getDay(); // 0 Sun … 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export async function getTreasurerDashboardData() {
  const supabase = await createClient();
  const today = toDateKey(new Date());
  const weekDays = currentWeekDays();
  const weekStart = toDateKey(weekDays[0]);
  const weekEnd = toDateKey(weekDays[6]);
  const fiscalYear = new Date().getFullYear();

  const [
    { data: donationCategories },
    { data: donations },
    expensesResult,
    { data: recentDonations },
    expensesRecentResult,
    budgetModule,
  ] = await Promise.all([
    supabase
      .from("donation_categories")
      .select("category_id, category_name"),
    supabase
      .from("donations")
      .select("amount, donation_date, category_id"),
    supabase
      .from("expenses")
      .select(
        "amount, expense_date, expense_categories(category_name)"
      ),
    supabase
      .from("donations")
      .select(
        "donation_id, donor_name, amount, donation_date, category_id, donation_categories(category_name)"
      )
      .order("donation_date", { ascending: false })
      .limit(12),
    supabase
      .from("expenses")
      .select(
        "expense_id, description, amount, expense_date, expense_categories(category_name)"
      )
      .order("expense_date", { ascending: false })
      .limit(12),
    getBudgetModuleData(),
  ]);

  let expenses = expensesResult.data as
    | {
        amount: number | string;
        expense_date: string;
        expense_categories?:
          | { category_name?: string }
          | { category_name?: string }[]
          | null;
      }[]
    | null;

  if (expensesResult.error) {
    const fallback = await supabase
      .from("expenses")
      .select("amount, expense_date");
    expenses = fallback.data as typeof expenses;
  }

  let recentExpenses = expensesRecentResult.data as
    | {
        expense_id: number;
        description: string | null;
        amount: number | string;
        expense_date: string;
        expense_categories?:
          | { category_name?: string }
          | { category_name?: string }[]
          | null;
      }[]
    | null;

  if (expensesRecentResult.error) {
    const fallback = await supabase
      .from("expenses")
      .select("expense_id, description, amount, expense_date")
      .order("expense_date", { ascending: false })
      .limit(12);
    recentExpenses = fallback.data as typeof recentExpenses;
  }

  const collectionIds = new Set(
    (donationCategories ?? [])
      .filter((row) => isCollectionCategoryName(row.category_name))
      .map((row) => row.category_id)
  );

  let totalDonations = 0;
  let totalCollections = 0;
  let todaysDonations = 0;
  let todaysCollections = 0;
  const incomeByDay = new Map(weekDays.map((d) => [toDateKey(d), 0]));

  for (const row of donations ?? []) {
    const amount = toNumber(row.amount);
    const date = String(row.donation_date);
    const isCollection =
      row.category_id != null && collectionIds.has(row.category_id);

    if (isCollection) {
      totalCollections += amount;
      if (date === today) todaysCollections += amount;
    } else {
      totalDonations += amount;
      if (date === today) todaysDonations += amount;
    }

    if (date >= weekStart && date <= weekEnd && incomeByDay.has(date)) {
      incomeByDay.set(date, (incomeByDay.get(date) ?? 0) + amount);
    }
  }

  let totalExpenses = 0;
  let todaysExpenses = 0;
  const categoryTotals = new Map<string, number>();

  for (const row of expenses ?? []) {
    const amount = toNumber(row.amount);
    totalExpenses += amount;
    const date = String(row.expense_date);
    if (date === today) todaysExpenses += amount;

    const category =
      relationName(
        row.expense_categories as
          | { category_name?: string }
          | { category_name?: string }[]
          | null
      ) || "Others";
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + amount);
  }

  const stats: TreasurerDashboardStats = {
    todaysDonations,
    todaysCollections,
    todaysExpenses,
    currentBalance: actualCash(
      totalDonations + totalCollections,
      totalExpenses
    ),
  };

  const dailyIncome: DailyIncomePoint[] = weekDays.map((d) => {
    const key = toDateKey(d);
    return {
      day: weekdayLabel(d),
      date: key,
      income: incomeByDay.get(key) ?? 0,
    };
  });

  const sortedCategories = [...categoryTotals.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  const topCategories = sortedCategories.slice(0, 5);
  const otherAmount = sortedCategories
    .slice(5)
    .reduce((sum, [, amount]) => sum + amount, 0);
  const expenseTotalForPct = totalExpenses || 1;

  const expensesByCategory: ExpenseCategorySlice[] = topCategories.map(
    ([category, amount], index) => ({
      category,
      amount,
      percent: Math.round((amount / expenseTotalForPct) * 100),
      fill: EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length],
    })
  );

  if (otherAmount > 0) {
    expensesByCategory.push({
      category: "Others",
      amount: otherAmount,
      percent: Math.round((otherAmount / expenseTotalForPct) * 100),
      fill: EXPENSE_CHART_COLORS[5],
    });
  }

  const recentTransactions: TreasurerTransaction[] = [
    ...(recentDonations ?? []).map((row) => {
      const category =
        relationName(
          row.donation_categories as
            | { category_name?: string }
            | { category_name?: string }[]
            | null
        ) ||
        (row.category_id != null && collectionIds.has(row.category_id)
          ? "Collection"
          : "Donation");
      const isCollection =
        row.category_id != null && collectionIds.has(row.category_id);
      return {
        id: `d-${row.donation_id}`,
        date: row.donation_date as string,
        transaction: (isCollection ? "Collection" : "Donation") as
          | "Donation"
          | "Collection",
        category: isCollection
          ? category
          : row.donor_name?.trim() || category,
        amount: toNumber(row.amount),
      };
    }),
    ...(recentExpenses ?? []).map((row) => {
      const category =
        relationName(
          (row as { expense_categories?: unknown }).expense_categories as
            | { category_name?: string }
            | { category_name?: string }[]
            | null
        ) ||
        row.description?.trim() ||
        "Expense";
      return {
        id: `e-${row.expense_id}`,
        date: row.expense_date as string,
        transaction: "Expense" as const,
        category,
        amount: toNumber(row.amount),
      };
    }),
  ]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 10);

  // Budget status: roll up current fiscal year by general category.
  const budgetByCategory = new Map<
    string,
    { allocated: number; used: number }
  >();
  for (const row of budgetModule.rows) {
    if (row.fiscal_year !== fiscalYear) continue;
    const category = row.category_name || "Uncategorized";
    const current = budgetByCategory.get(category) ?? {
      allocated: 0,
      used: row.category_spent,
    };
    current.allocated += toNumber(row.allocated_amount);
    current.used = row.category_spent;
    budgetByCategory.set(category, current);
  }

  const budgetStatus: BudgetStatusRow[] = [...budgetByCategory.entries()]
    .map(([category, value]) => ({
      category,
      used: value.used,
      remaining: value.allocated - value.used,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  return {
    stats,
    dailyIncome,
    expensesByCategory,
    recentTransactions,
    budgetStatus,
  };
}
