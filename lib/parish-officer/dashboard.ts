import { createClient } from "@/lib/supabase/server";
import { isCollectionCategoryName } from "@/lib/categories";
import { toNumber } from "@/lib/format";
import { relationName } from "@/lib/treasurer/relations";

export type ParishDashboardStats = {
  totalDonations: number;
  totalCollections: number;
  totalExpenses: number;
  currentBalance: number;
  budgetUtilizationPct: number;
  totalBudget: number;
  budgetSpent: number;
};

export type MonthlySummaryRow = {
  month: string;
  income: number;
  expenses: number;
};

export type IncomeSourceSlice = {
  category: string;
  amount: number;
  percent: number;
  fill: string;
};

export type ParishFinancialActivity = {
  id: string;
  date: string;
  activity: string;
  amount: number;
};

const INCOME_CHART_COLORS = [
  "#4F7D4A",
  "#D99A2B",
  "#B85C38",
  "#7A4E7D",
  "#75843A",
];

const INCOME_SOURCE_ORDER = [
  "Donations",
  "Sunday Collections",
  "Special Collections",
  "Fundraising Activities",
  "Other Income",
] as const;

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
  }).format(new Date(year, month - 1, 1));
}

function lastSixMonthKeys(now = new Date()) {
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    keys.push(`${y}-${m}`);
  }
  return keys;
}

function incomeSourceLabel(
  categoryName: string | null,
  isCollection: boolean
): (typeof INCOME_SOURCE_ORDER)[number] {
  if (!isCollection) return "Donations";
  const n = (categoryName || "").toLowerCase();
  if (n.includes("sunday")) return "Sunday Collections";
  if (n.includes("special") || n.includes("fiesta")) return "Special Collections";
  if (n.includes("fundrais")) return "Fundraising Activities";
  return "Other Income";
}

function summarizeDonationActivity(
  categoryName: string | null,
  isCollection: boolean
) {
  if (!isCollection) return "Donation Received";
  const n = (categoryName || "").toLowerCase();
  if (n.includes("sunday")) return "Sunday Collection Recorded";
  if (n.includes("special")) return "Special Collection Recorded";
  if (n.includes("fiesta")) return "Fiesta Collection Recorded";
  return "Collection Recorded";
}

function summarizeExpenseActivity(categoryName: string | null) {
  if (!categoryName) return "Expense Recorded";
  return `${categoryName} Expense Recorded`;
}

export async function getParishOfficerDashboardData() {
  const supabase = await createClient();

  const [
    { data: donationCategories },
    { data: donations },
    expensesResult,
    { data: budgets },
    { data: recentDonations },
    expensesRecentResult,
  ] = await Promise.all([
    supabase
      .from("donation_categories")
      .select("category_id, category_name"),
    supabase
      .from("donations")
      .select("amount, donation_date, category_id"),
    supabase
      .from("expenses")
      .select("amount, expense_date, expense_categories(category_name)"),
    supabase.from("budgets").select("allocated_amount"),
    supabase
      .from("donations")
      .select(
        "donation_id, amount, donation_date, category_id, donation_categories(category_name)"
      )
      .order("donation_date", { ascending: false })
      .limit(10),
    supabase
      .from("expenses")
      .select(
        "expense_id, amount, expense_date, expense_categories(category_name)"
      )
      .order("expense_date", { ascending: false })
      .limit(10),
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
      .select("expense_id, amount, expense_date")
      .order("expense_date", { ascending: false })
      .limit(10);
    recentExpenses = fallback.data as typeof recentExpenses;
  }

  const collectionIds = new Set(
    (donationCategories ?? [])
      .filter((row) => isCollectionCategoryName(row.category_name))
      .map((row) => row.category_id)
  );

  const categoryNameById = new Map(
    (donationCategories ?? []).map((row) => [
      row.category_id,
      row.category_name as string,
    ])
  );

  let totalDonations = 0;
  let totalCollections = 0;
  const incomeBySource = new Map<string, number>();
  const monthKeys = lastSixMonthKeys();
  const monthMap = new Map(
    monthKeys.map((key) => [key, { income: 0, expenses: 0 }])
  );

  for (const row of donations ?? []) {
    const amount = toNumber(row.amount);
    const isCollection =
      row.category_id != null && collectionIds.has(row.category_id);
    const categoryName =
      (row.category_id != null
        ? categoryNameById.get(row.category_id) ?? null
        : null) ?? null;
    const source = incomeSourceLabel(categoryName, isCollection);

    if (isCollection) totalCollections += amount;
    else totalDonations += amount;

    incomeBySource.set(source, (incomeBySource.get(source) ?? 0) + amount);

    const key = monthKey(String(row.donation_date));
    const bucket = monthMap.get(key);
    if (bucket) bucket.income += amount;
  }

  let totalExpenses = 0;
  for (const row of expenses ?? []) {
    const amount = toNumber(row.amount);
    totalExpenses += amount;
    const key = monthKey(String(row.expense_date));
    const bucket = monthMap.get(key);
    if (bucket) bucket.expenses += amount;
  }

  const totalBudget = (budgets ?? []).reduce(
    (sum, row) => sum + toNumber(row.allocated_amount),
    0
  );
  const budgetUtilizationPct =
    totalBudget > 0
      ? Math.min(100, Math.round((totalExpenses / totalBudget) * 100))
      : 0;

  const stats: ParishDashboardStats = {
    totalDonations,
    totalCollections,
    totalExpenses,
    currentBalance: totalDonations + totalCollections - totalExpenses,
    budgetUtilizationPct,
    totalBudget,
    budgetSpent: totalExpenses,
  };

  const monthlySummary: MonthlySummaryRow[] = monthKeys.map((key) => {
    const value = monthMap.get(key)!;
    return {
      month: monthLabel(key),
      income: value.income,
      expenses: value.expenses,
    };
  });

  const incomeTotal =
    [...incomeBySource.values()].reduce((sum, n) => sum + n, 0) || 1;
  const incomeSources: IncomeSourceSlice[] = INCOME_SOURCE_ORDER.filter(
    (label) => (incomeBySource.get(label) ?? 0) > 0
  ).map((label, index) => {
    const amount = incomeBySource.get(label) ?? 0;
    return {
      category: label,
      amount,
      percent: Math.round((amount / incomeTotal) * 100),
      fill: INCOME_CHART_COLORS[index % INCOME_CHART_COLORS.length],
    };
  });

  const recentFinancialSummary: ParishFinancialActivity[] = [
    ...(recentDonations ?? []).map((row) => {
      const category =
        relationName(
          row.donation_categories as
            | { category_name?: string }
            | { category_name?: string }[]
            | null
        ) ||
        (row.category_id != null
          ? categoryNameById.get(row.category_id) ?? null
          : null);
      const isCollection =
        row.category_id != null && collectionIds.has(row.category_id);
      return {
        id: `d-${row.donation_id}`,
        date: row.donation_date as string,
        activity: summarizeDonationActivity(category, isCollection),
        amount: toNumber(row.amount),
      };
    }),
    ...(recentExpenses ?? []).map((row) => {
      const category = relationName(
        (row as { expense_categories?: unknown }).expense_categories as
          | { category_name?: string }
          | { category_name?: string }[]
          | null
      );
      return {
        id: `e-${row.expense_id}`,
        date: row.expense_date as string,
        activity: summarizeExpenseActivity(category),
        amount: toNumber(row.amount),
      };
    }),
  ]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 8);

  return {
    stats,
    monthlySummary,
    incomeSources,
    recentFinancialSummary,
  };
}
