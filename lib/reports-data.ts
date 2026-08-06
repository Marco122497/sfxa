import type { SupabaseClient } from "@supabase/supabase-js";

import { isCollectionCategoryName } from "@/lib/categories";
import { toNumber } from "@/lib/format";
import {
  getReportTypeMeta,
  type ReportType,
} from "@/lib/reports";
import { relationName } from "@/lib/treasurer/relations";

export type ReportMetric = {
  id: string;
  label: string;
  value: string;
  tone: "navy" | "green" | "gold" | "purple";
};

export type ReportColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type ReportRowBreakdownItem = {
  label: string;
  amount: number;
  display: string;
};

export type ReportRow = {
  id: string;
  cells: Record<string, string>;
  amount: number;
  /** Optional expandable line-item breakdown (e.g. donation types). */
  children?: ReportRowBreakdownItem[];
};

export type ReportBreakdownItem = {
  label: string;
  amount: number;
  percent: number;
  color: string;
};

export type ReportSummaryLine = {
  label: string;
  amount: number;
  emphasis?: boolean;
  display?: string;
};

export type FormalReportData = {
  type: string;
  title: string;
  from: string;
  to: string;
  metrics: ReportMetric[];
  columns: ReportColumn[];
  rows: ReportRow[];
  summaryLines: ReportSummaryLine[];
  breakdown: ReportBreakdownItem[];
  notes: string;
  exportRows: string[][];
  tableTitle?: string;
  showBreakdown?: boolean;
};

const BREAKDOWN_COLORS = [
  "#D99A2B",
  "#4F7D4A",
  "#B85C38",
  "#7A4E7D",
  "#D06B64",
  "#75843A",
  "#9A6A32",
  "#A64D79",
];

function formatMoneyPlain(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

function buildBreakdown(
  amountsByLabel: Map<string, number>
): ReportBreakdownItem[] {
  const total = [...amountsByLabel.values()].reduce((sum, n) => sum + n, 0);
  return [...amountsByLabel.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount], index) => ({
      label,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
      color: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length],
    }));
}

async function loadDonationCategories(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("donation_categories")
    .select("category_id, category_name")
    .order("category_name");
  return data ?? [];
}

export async function getFormalReportData(
  supabase: SupabaseClient,
  type: ReportType,
  from: string,
  to: string
): Promise<FormalReportData> {
  const meta = getReportTypeMeta(type);

  if (type === "donations" || type === "collections") {
    return getDonationStyleReport(supabase, type, from, to, meta.title);
  }
  if (type === "expenses") {
    return getExpenseReport(supabase, from, to, meta.title);
  }
  return getBudgetReport(supabase, from, to, meta.title);
}

async function getDonationStyleReport(
  supabase: SupabaseClient,
  type: "donations" | "collections",
  from: string,
  to: string,
  title: string
): Promise<FormalReportData> {
  const categories = await loadDonationCategories(supabase);
  const collectionIds = new Set(
    categories
      .filter((row) => isCollectionCategoryName(row.category_name))
      .map((row) => row.category_id)
  );
  const donationIds = new Set(
    categories
      .filter((row) => !isCollectionCategoryName(row.category_name))
      .map((row) => row.category_id)
  );

  const { data } = await supabase
    .from("donations")
    .select(
      "donation_id, donor_name, category_id, amount, donation_date, remarks, donation_categories(category_name)"
    )
    .gte("donation_date", from)
    .lte("donation_date", to)
    .order("donation_date", { ascending: true });

  const filtered = (data ?? []).filter((row) => {
    if (type === "collections") {
      return row.category_id != null && collectionIds.has(row.category_id);
    }
    return (
      row.category_id == null || donationIds.has(row.category_id)
    );
  });

  const amountsByCategory = new Map<string, number>();
  let total = 0;

  const rows: ReportRow[] = filtered.map((row, index) => {
    const category =
      relationName(
        row.donation_categories as
          | { category_name?: string }
          | { category_name?: string }[]
          | null
      ) || (type === "collections" ? "Collection" : "Donation");
    const amount = toNumber(row.amount);
    total += amount;
    amountsByCategory.set(
      category,
      (amountsByCategory.get(category) ?? 0) + amount
    );

    return {
      id: String(row.donation_id),
      amount,
      cells: {
        no: String(index + 1),
        date: row.donation_date,
        name:
          type === "collections"
            ? category
            : row.donor_name?.trim() || "Anonymous",
        type: category,
        amount: formatMoneyPlain(amount),
        remarks: row.remarks?.trim() || "—",
      },
    };
  });

  const categoryCount = amountsByCategory.size;
  const average = filtered.length > 0 ? total / filtered.length : 0;

  const isCollection = type === "collections";
  const columns: ReportColumn[] = isCollection
    ? [
        { key: "no", label: "No." },
        { key: "date", label: "Date" },
        { key: "type", label: "Collection Type" },
        { key: "amount", label: "Amount (₱)", align: "right" },
        { key: "remarks", label: "Remarks" },
      ]
    : [
        { key: "no", label: "No." },
        { key: "date", label: "Date" },
        { key: "name", label: "Donor Name" },
        { key: "type", label: "Donation Type" },
        { key: "amount", label: "Amount (₱)", align: "right" },
        { key: "remarks", label: "Remarks" },
      ];

  const metrics: ReportMetric[] = [
    {
      id: "count",
      label: isCollection
        ? "Total Number of Collections"
        : "Total Number of Donations",
      value: String(filtered.length),
      tone: "navy",
    },
    {
      id: "total",
      label: isCollection ? "Total Collection Amount" : "Total Donation Amount",
      value: formatMoneyPlain(total),
      tone: "green",
    },
    {
      id: "categories",
      label: isCollection ? "Collection Types" : "Donation Types",
      value: String(categoryCount),
      tone: "gold",
    },
    {
      id: "average",
      label: isCollection ? "Average Collection" : "Average Donation",
      value: formatMoneyPlain(average),
      tone: "purple",
    },
  ];

  const breakdown = buildBreakdown(amountsByCategory);
  const leadingBreakdown = breakdown.slice(0, 4);
  const otherAmount = breakdown
    .slice(4)
    .reduce((sum, item) => sum + item.amount, 0);
  const summaryLines: ReportSummaryLine[] = [
    ...leadingBreakdown.map((item) => ({
      label: item.label,
      amount: item.amount,
    })),
    ...(otherAmount > 0
      ? [{ label: "Other categories", amount: otherAmount }]
      : []),
    { label: "GRAND TOTAL", amount: total, emphasis: true },
  ];

  const exportRows = [
    columns.map((col) => col.label),
    ...rows.map((row) => columns.map((col) => row.cells[col.key] ?? "")),
    ["", "", "", "Grand Total", formatMoneyPlain(total), ""],
  ];

  return {
    type,
    title,
    from,
    to,
    metrics,
    columns,
    rows,
    summaryLines,
    breakdown,
    notes: isCollection
      ? "All amounts are in Philippine Peso (₱). This report reflects all parish collections recorded within the specified period."
      : "All amounts are in Philippine Peso (₱). This report reflects all donations received and recorded within the specified period.",
    exportRows,
  };
}

async function getExpenseReport(
  supabase: SupabaseClient,
  from: string,
  to: string,
  title: string
): Promise<FormalReportData> {
  const result = await supabase
    .from("expenses")
    .select(
      "expense_id, expense_category_id, expense_subcategory_id, description, amount, expense_date, expense_categories(category_name), expense_subcategories(subcategory_name)"
    )
    .gte("expense_date", from)
    .lte("expense_date", to)
    .order("expense_date", { ascending: true });

  let data = result.data;
  if (result.error) {
    const fallback = await supabase
      .from("expenses")
      .select(
        "expense_id, expense_category_id, description, amount, expense_date, expense_categories(category_name)"
      )
      .gte("expense_date", from)
      .lte("expense_date", to)
      .order("expense_date", { ascending: true });
    data = fallback.data as typeof data;
  }

  const amountsByCategory = new Map<string, number>();
  let total = 0;

  const rows: ReportRow[] = (data ?? []).map((row, index) => {
    const category =
      relationName(
        row.expense_categories as
          | { category_name?: string }
          | { category_name?: string }[]
          | null
      ) || "Uncategorized";
    const subcategory =
      relationName(
        (row as { expense_subcategories?: unknown }).expense_subcategories as
          | { subcategory_name?: string }
          | { subcategory_name?: string }[]
          | null,
        "subcategory_name"
      ) || "—";
    const amount = toNumber(row.amount);
    total += amount;
    amountsByCategory.set(
      category,
      (amountsByCategory.get(category) ?? 0) + amount
    );

    return {
      id: String(row.expense_id),
      amount,
      cells: {
        no: String(index + 1),
        date: row.expense_date,
        category,
        subcategory,
        description: row.description?.trim() || "—",
        amount: formatMoneyPlain(amount),
      },
    };
  });

  const average = rows.length > 0 ? total / rows.length : 0;
  const columns: ReportColumn[] = [
    { key: "no", label: "No." },
    { key: "date", label: "Date" },
    { key: "category", label: "Category" },
    { key: "subcategory", label: "Subcategory" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount (₱)", align: "right" },
  ];

  const metrics: ReportMetric[] = [
    {
      id: "count",
      label: "Total Number of Expenses",
      value: String(rows.length),
      tone: "navy",
    },
    {
      id: "total",
      label: "Total Expense Amount",
      value: formatMoneyPlain(total),
      tone: "green",
    },
    {
      id: "categories",
      label: "Expense Categories",
      value: String(amountsByCategory.size),
      tone: "gold",
    },
    {
      id: "average",
      label: "Average Expense",
      value: formatMoneyPlain(average),
      tone: "purple",
    },
  ];

  const breakdown = buildBreakdown(amountsByCategory);
  const leadingBreakdown = breakdown.slice(0, 4);
  const otherAmount = breakdown
    .slice(4)
    .reduce((sum, item) => sum + item.amount, 0);
  const summaryLines: ReportSummaryLine[] = [
    ...leadingBreakdown.map((item) => ({
      label: item.label,
      amount: item.amount,
    })),
    ...(otherAmount > 0
      ? [{ label: "Other categories", amount: otherAmount }]
      : []),
    { label: "GRAND TOTAL", amount: total, emphasis: true },
  ];

  return {
    type: "expenses",
    title,
    from,
    to,
    metrics,
    columns,
    rows,
    summaryLines,
    breakdown,
    notes:
      "All amounts are in Philippine Peso (₱). This report reflects all expenses recorded within the specified period.",
    exportRows: [
      columns.map((col) => col.label),
      ...rows.map((row) => columns.map((col) => row.cells[col.key] ?? "")),
      ["", "", "", "", "Grand Total", formatMoneyPlain(total)],
    ],
  };
}

async function getBudgetReport(
  supabase: SupabaseClient,
  from: string,
  to: string,
  title: string
): Promise<FormalReportData> {
  const fromYear = Number(from.slice(0, 4));
  const toYear = Number(to.slice(0, 4));

  const [
    budgetsResult,
    { data: expenses },
    { data: expenseCategories },
  ] = await Promise.all([
    supabase
      .from("budgets")
      .select(
        "budget_id, budget_category_id, expense_subcategory_id, fiscal_year, allocated_amount, remarks, budget_categories(category_name), expense_subcategories(subcategory_name)"
      )
      .gte("fiscal_year", fromYear)
      .lte("fiscal_year", toYear)
      .order("fiscal_year", { ascending: false }),
    supabase
      .from("expenses")
      .select("amount, expense_category_id, expense_subcategory_id, expense_date")
      .gte("expense_date", from)
      .lte("expense_date", to),
    supabase
      .from("expense_categories")
      .select("expense_category_id, category_name"),
  ]);

  type BudgetRow = {
    budget_id: number;
    budget_category_id: number | null;
    expense_subcategory_id?: number | null;
    fiscal_year: number;
    allocated_amount: number | string;
    remarks: string | null;
    budget_categories?:
      | { category_name?: string }
      | { category_name?: string }[]
      | null;
    expense_subcategories?:
      | { subcategory_name?: string }
      | { subcategory_name?: string }[]
      | null;
  };

  let budgets = budgetsResult.data as BudgetRow[] | null;
  if (budgetsResult.error) {
    const fallback = await supabase
      .from("budgets")
      .select(
        "budget_id, budget_category_id, fiscal_year, allocated_amount, remarks, budget_categories(category_name)"
      )
      .gte("fiscal_year", fromYear)
      .lte("fiscal_year", toYear)
      .order("fiscal_year", { ascending: false });
    budgets = fallback.data as BudgetRow[] | null;
  }

  const expenseCategoryNameById = new Map(
    (expenseCategories ?? []).map((c) => [
      c.expense_category_id,
      c.category_name,
    ])
  );

  const spendByCategoryName = new Map<string, number>();
  const spendBySubcategoryId = new Map<number, number>();
  for (const expense of expenses ?? []) {
    const name =
      expenseCategoryNameById.get(expense.expense_category_id ?? -1) ||
      "Uncategorized";
    const amount = toNumber(expense.amount);
    spendByCategoryName.set(
      name,
      (spendByCategoryName.get(name) ?? 0) + amount
    );
    if (expense.expense_subcategory_id != null) {
      spendBySubcategoryId.set(
        expense.expense_subcategory_id,
        (spendBySubcategoryId.get(expense.expense_subcategory_id) ?? 0) + amount
      );
    }
  }

  const groups = new Map<string, BudgetRow[]>();
  for (const row of budgets ?? []) {
    const categoryName = relationName(row.budget_categories ?? null) || "Uncategorized";
    const key = `${row.fiscal_year}::${categoryName}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  let allocatedTotal = 0;
  let spentTotal = 0;
  const amountsByCategory = new Map<string, number>();
  const computed: {
    id: string;
    amount: number;
    cells: Record<string, string>;
  }[] = [];

  for (const groupRows of groups.values()) {
    const category =
      relationName(groupRows[0].budget_categories ?? null) || "Uncategorized";
    const categorySpent = spendByCategoryName.get(category) ?? 0;
    const siblingSubSpend = groupRows.reduce(
      (sum, row) =>
        row.expense_subcategory_id != null
          ? sum + (spendBySubcategoryId.get(row.expense_subcategory_id) ?? 0)
          : sum,
      0
    );
    let generalRemainderAssigned = false;

    for (const row of groupRows) {
      const subcategory =
        relationName(row.expense_subcategories ?? null, "subcategory_name") ||
        "—";
      const allocated = toNumber(row.allocated_amount);
      let spent: number;
      if (row.expense_subcategory_id != null) {
        spent = spendBySubcategoryId.get(row.expense_subcategory_id) ?? 0;
      } else if (!generalRemainderAssigned) {
        spent = Math.max(0, categorySpent - siblingSubSpend);
        generalRemainderAssigned = true;
      } else {
        spent = 0;
      }
      const remaining = allocated - spent;
      allocatedTotal += allocated;
      spentTotal += spent;
      amountsByCategory.set(
        category,
        (amountsByCategory.get(category) ?? 0) + allocated
      );

      computed.push({
        id: String(row.budget_id),
        amount: allocated,
        cells: {
          no: "",
          year: String(row.fiscal_year),
          category,
          subcategory,
          allocated: formatMoneyPlain(allocated),
          spent: formatMoneyPlain(spent),
          remaining: formatMoneyPlain(remaining),
          remarks: row.remarks?.trim() || "—",
        },
      });
    }
  }

  const rows: ReportRow[] = computed.map((row, index) => ({
    ...row,
    cells: { ...row.cells, no: String(index + 1) },
  }));
  const remainingTotal = allocatedTotal - spentTotal;

  const columns: ReportColumn[] = [
    { key: "no", label: "No." },
    { key: "year", label: "Year" },
    { key: "category", label: "Category" },
    { key: "subcategory", label: "Subcategory" },
    { key: "allocated", label: "Allocated (₱)", align: "right" },
    { key: "spent", label: "Spent (₱)", align: "right" },
    { key: "remaining", label: "Remaining (₱)", align: "right" },
  ];

  const metrics: ReportMetric[] = [
    {
      id: "count",
      label: "Budget Allocations",
      value: String(rows.length),
      tone: "navy",
    },
    {
      id: "allocated",
      label: "Total Allocated",
      value: formatMoneyPlain(allocatedTotal),
      tone: "green",
    },
    {
      id: "spent",
      label: "Spent in Period",
      value: formatMoneyPlain(spentTotal),
      tone: "gold",
    },
    {
      id: "remaining",
      label: "Remaining Budget",
      value: formatMoneyPlain(remainingTotal),
      tone: "purple",
    },
  ];

  const breakdown = buildBreakdown(amountsByCategory);
  const summaryLines: ReportSummaryLine[] = [
    { label: "Total Allocated", amount: allocatedTotal },
    { label: "Spent in Period", amount: spentTotal },
    { label: "REMAINING", amount: remainingTotal, emphasis: true },
  ];

  return {
    type: "budget",
    title,
    from,
    to,
    metrics,
    columns,
    rows,
    summaryLines,
    breakdown,
    notes:
      "All amounts are in Philippine Peso (₱). Budget allocations are shown for fiscal years in the selected range. Spent amounts reflect expenses recorded within the date range.",
    exportRows: [
      columns.map((col) => col.label),
      ...rows.map((row) => columns.map((col) => row.cells[col.key] ?? "")),
      [
        "",
        "",
        "",
        "Totals",
        formatMoneyPlain(allocatedTotal),
        formatMoneyPlain(spentTotal),
        formatMoneyPlain(remainingTotal),
      ],
    ],
  };
}
