import { createAdminClient } from "@/lib/supabase/admin";
import { isCollectionCategoryName } from "@/lib/categories";
import { toNumber } from "@/lib/format";
import { relationName } from "@/lib/treasurer/relations";

export type AdminDashboardStats = {
  totalDonations: number;
  totalCollections: number;
  totalExpenses: number;
  currentBalance: number;
  remainingBudget: number;
  totalUsers: number;
  activeUsers: number;
};

export type MonthlySummaryRow = {
  month: string;
  income: number;
  expenses: number;
};

export type ExpenseCategorySlice = {
  category: string;
  amount: number;
  fill: string;
};

export type RecentFinancialActivity = {
  id: string;
  date: string;
  transaction: string;
  amount: number;
};

export type RecentUserActivity = {
  id: string;
  user: string;
  activity: string;
  date: string;
};

const EXPENSE_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-3)",
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

function profileField(
  value: unknown,
  field: "full_name" | "role"
): string | null {
  if (Array.isArray(value)) {
    const first = value[0] as Record<string, unknown> | undefined;
    return first?.[field] ? String(first[field]) : null;
  }
  if (value && typeof value === "object" && field in value) {
    const v = (value as Record<string, unknown>)[field];
    return v ? String(v) : null;
  }
  return null;
}

function humanizeActivity(action: string | null, description: string | null) {
  if (description?.trim()) return description.trim();
  if (!action) return "Activity recorded";
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function getAdminDashboardData() {
  const admin = createAdminClient();

  const [
    { data: donationCategories },
    { data: donations },
    expensesResult,
    { data: budgets },
    { count: totalUsers },
    { count: activeUsers },
    { data: recentDonations },
    expensesRecentResult,
    { data: recentBudgetHistory },
    { data: recentAudits },
  ] = await Promise.all([
    admin
      .from("donation_categories")
      .select("category_id, category_name"),
    admin.from("donations").select("amount, donation_date, category_id"),
    admin
      .from("expenses")
      .select("amount, expense_date, expense_categories(category_name)"),
    admin.from("budgets").select("allocated_amount"),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", true),
    admin
      .from("donations")
      .select(
        "donation_id, donor_name, amount, donation_date, category_id, donation_categories(category_name)"
      )
      .order("donation_date", { ascending: false })
      .limit(12),
    admin
      .from("expenses")
      .select(
        "expense_id, description, amount, expense_date, expense_categories(category_name)"
      )
      .order("expense_date", { ascending: false })
      .limit(12),
    admin
      .from("budget_history")
      .select("history_id, new_amount, action, changed_at, category_name")
      .order("changed_at", { ascending: false })
      .limit(8),
    admin
      .from("audit_logs")
      .select(
        "audit_id, action, description, created_at, profiles(full_name, role)"
      )
      .order("created_at", { ascending: false })
      .limit(8),
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
    const fallback = await admin
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
    const fallback = await admin
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
  for (const row of donations ?? []) {
    const amount = toNumber(row.amount);
    if (row.category_id != null && collectionIds.has(row.category_id)) {
      totalCollections += amount;
    } else {
      totalDonations += amount;
    }
  }

  const totalExpenses = (expenses ?? []).reduce(
    (sum, row) => sum + toNumber(row.amount),
    0
  );
  const totalBudget = (budgets ?? []).reduce(
    (sum, row) => sum + toNumber(row.allocated_amount),
    0
  );
  const currentBalance = totalDonations + totalCollections - totalExpenses;
  const remainingBudget = totalBudget - totalExpenses;

  const stats: AdminDashboardStats = {
    totalDonations,
    totalCollections,
    totalExpenses,
    currentBalance,
    remainingBudget,
    totalUsers: totalUsers ?? 0,
    activeUsers: activeUsers ?? 0,
  };

  const monthKeys = lastSixMonthKeys();
  const monthMap = new Map(
    monthKeys.map((key) => [key, { income: 0, expenses: 0 }])
  );

  for (const row of donations ?? []) {
    const key = monthKey(String(row.donation_date));
    const current = monthMap.get(key);
    if (!current) continue;
    current.income += toNumber(row.amount);
  }
  for (const row of expenses ?? []) {
    const key = monthKey(String(row.expense_date));
    const current = monthMap.get(key);
    if (!current) continue;
    current.expenses += toNumber(row.amount);
  }

  const monthlySummary: MonthlySummaryRow[] = monthKeys.map((key) => {
    const value = monthMap.get(key)!;
    return {
      month: monthLabel(key),
      income: value.income,
      expenses: value.expenses,
    };
  });

  const categoryTotals = new Map<string, number>();
  for (const row of expenses ?? []) {
    const category =
      relationName(
        row.expense_categories as
          | { category_name?: string }
          | { category_name?: string }[]
          | null
      ) || "Others";
    categoryTotals.set(
      category,
      (categoryTotals.get(category) ?? 0) + toNumber(row.amount)
    );
  }

  const sortedCategories = [...categoryTotals.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  const topCategories = sortedCategories.slice(0, 5);
  const otherAmount = sortedCategories
    .slice(5)
    .reduce((sum, [, amount]) => sum + amount, 0);

  const expensesByCategory: ExpenseCategorySlice[] = topCategories.map(
    ([category, amount], index) => ({
      category,
      amount,
      fill: EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length],
    })
  );

  if (otherAmount > 0) {
    expensesByCategory.push({
      category: "Others",
      amount: otherAmount,
      fill: EXPENSE_CHART_COLORS[5],
    });
  }

  const recentFinancialActivities: RecentFinancialActivity[] = [
    ...(recentDonations ?? []).map((row) => {
      const category =
        relationName(
          row.donation_categories as
            | { category_name?: string }
            | { category_name?: string }[]
            | null
        ) || "Donation";
      const isCollection =
        row.category_id != null && collectionIds.has(row.category_id);
      return {
        id: `d-${row.donation_id}`,
        date: row.donation_date as string,
        transaction: isCollection
          ? category
          : row.donor_name
            ? `Donation Received — ${row.donor_name}`
            : "Donation Received",
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
        ) || null;
      return {
        id: `e-${row.expense_id}`,
        date: row.expense_date as string,
        transaction:
          row.description?.trim() ||
          (category ? `${category} Expense` : "Expense Recorded"),
        amount: toNumber(row.amount),
      };
    }),
    ...(recentBudgetHistory ?? []).map((row) => ({
      id: `b-${row.history_id}`,
      date: String(row.changed_at).slice(0, 10),
      transaction: row.category_name
        ? `Budget ${row.action || "Updated"} — ${row.category_name}`
        : `Budget ${row.action || "Updated"}`,
      amount: toNumber(row.new_amount),
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const recentUserActivities: RecentUserActivity[] = (recentAudits ?? [])
    .map((row) => ({
      id: String(row.audit_id),
      user:
        profileField(row.profiles, "role") ||
        profileField(row.profiles, "full_name") ||
        "System",
      activity: humanizeActivity(row.action, row.description),
      date: String(row.created_at).slice(0, 10),
    }))
    .slice(0, 8);

  return {
    stats,
    monthlySummary,
    expensesByCategory,
    recentFinancialActivities,
    recentUserActivities,
  };
}
