import type { SupabaseClient } from "@supabase/supabase-js";

import { isCollectionCategoryName } from "@/lib/categories";
import { toNumber } from "@/lib/format";
import {
  getAdminReportTypeMeta,
  type AdminReportType,
} from "@/lib/reports";
import type {
  FormalReportData,
  ReportBreakdownItem,
  ReportColumn,
  ReportMetric,
  ReportRow,
  ReportSummaryLine,
} from "@/lib/reports-data";
import { relationName } from "@/lib/treasurer/relations";
import { actualCash } from "@/lib/finance-ledgers";

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

function budgetStatus(allocated: number, used: number) {
  if (allocated <= 0) return used > 0 ? "Over Budget" : "Healthy";
  const pct = (used / allocated) * 100;
  if (pct > 100) return "Over Budget";
  if (pct >= 80) return "Near Limit";
  return "Healthy";
}

async function loadDonationCategories(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("donation_categories")
    .select("category_id, category_name")
    .order("category_name");
  return data ?? [];
}

export async function getAdminFormalReportData(
  supabase: SupabaseClient,
  type: AdminReportType,
  from: string,
  to: string
): Promise<FormalReportData> {
  const meta = getAdminReportTypeMeta(type);

  switch (type) {
    case "summary":
      return getFinancialSummaryReport(supabase, from, to, meta.title);
    case "donations":
      return getDonationReport(supabase, from, to, meta.title);
    case "collections":
      return getCollectionReport(supabase, from, to, meta.title);
    case "expenses":
      return getExpenseReport(supabase, from, to, meta.title);
    case "budget":
      return getBudgetUtilizationReport(supabase, from, to, meta.title);
  }
}

async function getFinancialSummaryReport(
  supabase: SupabaseClient,
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
  const categoryNameById = new Map(
    categories.map((row) => [row.category_id, row.category_name])
  );

  const [{ data: donations }, expensesResult] = await Promise.all([
    supabase
      .from("donations")
      .select(
        "amount, category_id, donation_date, donation_categories(category_name)"
      )
      .gte("donation_date", from)
      .lte("donation_date", to),
    supabase
      .from("expenses")
      .select("amount, expense_date, expense_categories(category_name)")
      .gte("expense_date", from)
      .lte("expense_date", to),
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
      .select("amount, expense_date")
      .gte("expense_date", from)
      .lte("expense_date", to);
    expenses = fallback.data as typeof expenses;
  }

  let totalDonations = 0;
  let totalCollections = 0;
  const donationBreakdown = new Map<string, number>();
  const collectionBreakdown = new Map<string, number>();

  for (const row of donations ?? []) {
    const amount = toNumber(row.amount);
    const category =
      relationName(
        row.donation_categories as
          | { category_name?: string }
          | { category_name?: string }[]
          | null
      ) ||
      (row.category_id != null
        ? categoryNameById.get(row.category_id)
        : null) ||
      "Uncategorized";

    if (row.category_id != null && collectionIds.has(row.category_id)) {
      totalCollections += amount;
      collectionBreakdown.set(
        category,
        (collectionBreakdown.get(category) ?? 0) + amount
      );
    } else {
      totalDonations += amount;
      donationBreakdown.set(
        category,
        (donationBreakdown.get(category) ?? 0) + amount
      );
    }
  }

  const expenseBreakdown = new Map<string, number>();
  const totalExpenses = (expenses ?? []).reduce((sum, row) => {
    const amount = toNumber(row.amount);
    const category =
      relationName(row.expense_categories ?? null) || "Uncategorized";
    expenseBreakdown.set(
      category,
      (expenseBreakdown.get(category) ?? 0) + amount
    );
    return sum + amount;
  }, 0);

  const totalIncome = totalDonations + totalCollections;
  const cashOnHand = actualCash(totalIncome, totalExpenses);

  const metrics: ReportMetric[] = [
    {
      id: "donations",
      label: "Total Donations",
      value: formatMoneyPlain(totalDonations),
      tone: "green",
    },
    {
      id: "collections",
      label: "Total Collections",
      value: formatMoneyPlain(totalCollections),
      tone: "gold",
    },
    {
      id: "income",
      label: "Total Income",
      value: formatMoneyPlain(totalIncome),
      tone: "navy",
    },
    {
      id: "expenses",
      label: "Total Expenses",
      value: formatMoneyPlain(totalExpenses),
      tone: "purple",
    },
    {
      id: "net",
      label: "Actual Cash",
      value: formatMoneyPlain(cashOnHand),
      tone: "green",
    },
  ];

  function toChildren(map: Map<string, number>) {
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, amount]) => ({
        label,
        amount,
        display: formatMoneyPlain(amount),
      }));
  }

  const donationChildren = toChildren(donationBreakdown);
  const collectionChildren = toChildren(collectionBreakdown);
  const expenseChildren = toChildren(expenseBreakdown);
  const incomeChildren = [
    {
      label: "Donations",
      amount: totalDonations,
      display: formatMoneyPlain(totalDonations),
    },
    {
      label: "Collections",
      amount: totalCollections,
      display: formatMoneyPlain(totalCollections),
    },
  ].filter((item) => item.amount > 0);

  const summaryRows = [
    {
      id: "donations",
      label: "Total Donations",
      amount: totalDonations,
      children: donationChildren,
    },
    {
      id: "collections",
      label: "Total Collections",
      amount: totalCollections,
      children: collectionChildren,
    },
    {
      id: "income",
      label: "Total Income",
      amount: totalIncome,
      children: incomeChildren,
    },
    {
      id: "expenses",
      label: "Total Expenses",
      amount: totalExpenses,
      children: expenseChildren,
    },
    { id: "net", label: "Actual Cash", amount: cashOnHand },
  ];

  const columns: ReportColumn[] = [
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount", align: "right" },
  ];

  const rows: ReportRow[] = summaryRows.map((row) => ({
    id: `summary-${row.id}`,
    amount: row.amount,
    cells: {
      description: row.label,
      amount: formatMoneyPlain(row.amount),
    },
    children: row.children?.length ? row.children : undefined,
  }));

  const summaryLines: ReportSummaryLine[] = summaryRows.map((row) => ({
    label: row.label,
    amount: row.amount,
    emphasis: row.id === "net",
  }));

  const breakdown = buildBreakdown(
    new Map([
      ["Donations", totalDonations],
      ["Collections", totalCollections],
      ["Expenses", totalExpenses],
    ])
  ).filter((item) => item.amount > 0);

  const exportRows = [
    ["Description", "Amount"],
    ...summaryRows.flatMap((row) => [
      [row.label, formatMoneyPlain(row.amount)],
      ...(row.children ?? []).map((child) => [
        `  ${child.label}`,
        child.display,
      ]),
    ]),
  ];

  return {
    type: "summary",
    title,
    from,
    to,
    metrics,
    columns,
    rows,
    summaryLines,
    breakdown,
    tableTitle: "Summary Table",
    notes:
      "Expand Total Donations, Collections, Income, or Expenses in the summary table to view category breakdowns. This financial summary provides an overall picture of the parish's financial condition for the selected period.",
    exportRows,
  };
}

async function getDonationReport(
  supabase: SupabaseClient,
  from: string,
  to: string,
  title: string
): Promise<FormalReportData> {
  const categories = await loadDonationCategories(supabase);
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

  const filtered = (data ?? []).filter(
    (row) => row.category_id == null || donationIds.has(row.category_id)
  );

  const amountsByType = new Map<string, number>();
  let total = 0;

  const columns: ReportColumn[] = [
    { key: "date", label: "Date" },
    { key: "donor", label: "Donor" },
    { key: "type", label: "Donation Type" },
    { key: "amount", label: "Amount", align: "right" },
  ];

  const rows: ReportRow[] = filtered.map((row) => {
    const type =
      relationName(
        row.donation_categories as
          | { category_name?: string }
          | { category_name?: string }[]
          | null
      ) || "Donation";
    const amount = toNumber(row.amount);
    total += amount;
    amountsByType.set(type, (amountsByType.get(type) ?? 0) + amount);

    return {
      id: String(row.donation_id),
      amount,
      cells: {
        date: row.donation_date,
        donor: row.donor_name?.trim() || "Anonymous",
        type,
        amount: formatMoneyPlain(amount),
      },
    };
  });

  const metrics: ReportMetric[] = [
    {
      id: "total",
      label: "Total Donations",
      value: formatMoneyPlain(total),
      tone: "green",
    },
    {
      id: "count",
      label: "Number of Donations",
      value: String(filtered.length),
      tone: "navy",
    },
    {
      id: "types",
      label: "Donation Types",
      value: String(amountsByType.size),
      tone: "gold",
    },
    {
      id: "average",
      label: "Average Donation",
      value: formatMoneyPlain(filtered.length ? total / filtered.length : 0),
      tone: "purple",
    },
  ];

  return {
    type: "donations",
    title,
    from,
    to,
    metrics,
    columns,
    rows,
    summaryLines: [
      { label: "Total Donations", amount: total },
      {
        label: "Number of Donations",
        amount: filtered.length,
        display: String(filtered.length),
        emphasis: true,
      },
    ],
    breakdown: buildBreakdown(amountsByType),
    tableTitle: "Donation Transactions",
    notes:
      "This report reflects all donations received and recorded within the specified period.",
    exportRows: [
      columns.map((col) => col.label),
      ...rows.map((row) => columns.map((col) => row.cells[col.key] ?? "")),
      ["", "", "Total Donations", formatMoneyPlain(total)],
    ],
  };
}

async function getCollectionReport(
  supabase: SupabaseClient,
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

  const { data } = await supabase
    .from("donations")
    .select(
      "donation_id, category_id, amount, donation_date, remarks, donation_categories(category_name)"
    )
    .gte("donation_date", from)
    .lte("donation_date", to)
    .order("donation_date", { ascending: true });

  const filtered = (data ?? []).filter(
    (row) => row.category_id != null && collectionIds.has(row.category_id)
  );

  const amountsByType = new Map<string, number>();
  let total = 0;

  const columns: ReportColumn[] = [
    { key: "date", label: "Date" },
    { key: "event", label: "Mass/Event" },
    { key: "type", label: "Collection Type" },
    { key: "amount", label: "Amount", align: "right" },
  ];

  const rows: ReportRow[] = filtered.map((row) => {
    const type =
      relationName(
        row.donation_categories as
          | { category_name?: string }
          | { category_name?: string }[]
          | null
      ) || "Collection";
    const amount = toNumber(row.amount);
    total += amount;
    amountsByType.set(type, (amountsByType.get(type) ?? 0) + amount);

    return {
      id: String(row.donation_id),
      amount,
      cells: {
        date: row.donation_date,
        event: row.remarks?.trim() || type,
        type,
        amount: formatMoneyPlain(amount),
      },
    };
  });

  const metrics: ReportMetric[] = [
    {
      id: "total",
      label: "Total Collections",
      value: formatMoneyPlain(total),
      tone: "green",
    },
    {
      id: "count",
      label: "Number of Collections",
      value: String(filtered.length),
      tone: "navy",
    },
    {
      id: "types",
      label: "Collection Types",
      value: String(amountsByType.size),
      tone: "gold",
    },
    {
      id: "average",
      label: "Average Collection",
      value: formatMoneyPlain(filtered.length ? total / filtered.length : 0),
      tone: "purple",
    },
  ];

  return {
    type: "collections",
    title,
    from,
    to,
    metrics,
    columns,
    rows,
    summaryLines: [
      { label: "Total Collections", amount: total, emphasis: true },
    ],
    breakdown: buildBreakdown(amountsByType),
    tableTitle: "Collection Transactions",
    notes:
      "This report reflects parish collections recorded within the selected period.",
    exportRows: [
      columns.map((col) => col.label),
      ...rows.map((row) => columns.map((col) => row.cells[col.key] ?? "")),
      ["", "", "Total Collections", formatMoneyPlain(total)],
    ],
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
      "expense_id, description, amount, expense_date, created_by, expense_categories(category_name)"
    )
    .gte("expense_date", from)
    .lte("expense_date", to)
    .order("expense_date", { ascending: true });

  let data = result.data as
    | {
        expense_id: number;
        description: string | null;
        amount: number | string;
        expense_date: string;
        created_by?: string | null;
        expense_categories?:
          | { category_name?: string }
          | { category_name?: string }[]
          | null;
      }[]
    | null;

  if (result.error) {
    const fallback = await supabase
      .from("expenses")
      .select(
        "expense_id, description, amount, expense_date, expense_categories(category_name)"
      )
      .gte("expense_date", from)
      .lte("expense_date", to)
      .order("expense_date", { ascending: true });
    data = fallback.data as typeof data;
  }

  const creatorIds = [
    ...new Set(
      (data ?? [])
        .map((row) => row.created_by)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const creatorNameById = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", creatorIds);
    for (const profile of profiles ?? []) {
      creatorNameById.set(
        profile.id,
        profile.full_name || profile.role || "—"
      );
    }
  }

  const amountsByCategory = new Map<string, number>();
  let total = 0;

  const columns: ReportColumn[] = [
    { key: "date", label: "Date" },
    { key: "category", label: "Expense Category" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount", align: "right" },
    { key: "approved", label: "Approved By" },
  ];

  const rows: ReportRow[] = (data ?? []).map((row) => {
    const category =
      relationName(row.expense_categories ?? null) || "Uncategorized";
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
        date: row.expense_date,
        category,
        description: row.description?.trim() || "—",
        amount: formatMoneyPlain(amount),
        approved: row.created_by
          ? creatorNameById.get(row.created_by) || "—"
          : "—",
      },
    };
  });

  const breakdown = buildBreakdown(amountsByCategory);
  const metrics: ReportMetric[] = [
    {
      id: "total",
      label: "Total Expenses",
      value: formatMoneyPlain(total),
      tone: "green",
    },
    {
      id: "count",
      label: "Number of Expenses",
      value: String(rows.length),
      tone: "navy",
    },
    {
      id: "categories",
      label: "Categories",
      value: String(amountsByCategory.size),
      tone: "gold",
    },
    {
      id: "average",
      label: "Average Expense",
      value: formatMoneyPlain(rows.length ? total / rows.length : 0),
      tone: "purple",
    },
  ];

  return {
    type: "expenses",
    title,
    from,
    to,
    metrics,
    columns,
    rows,
    summaryLines: [
      { label: "Total Expenses", amount: total, emphasis: true },
      ...breakdown.slice(0, 5).map((item) => ({
        label: item.label,
        amount: item.amount,
      })),
    ],
    breakdown,
    tableTitle: "Expense Transactions",
    notes:
      "Approved By shows the staff member who recorded the expense when available.",
    exportRows: [
      columns.map((col) => col.label),
      ...rows.map((row) => columns.map((col) => row.cells[col.key] ?? "")),
      ["", "", "Total Expenses", formatMoneyPlain(total), ""],
    ],
  };
}

async function getBudgetUtilizationReport(
  supabase: SupabaseClient,
  from: string,
  to: string,
  title: string
): Promise<FormalReportData> {
  const fromYear = Number(from.slice(0, 4));
  const toYear = Number(to.slice(0, 4));

  const [budgetsResult, { data: expenses }, { data: expenseCategories }] =
    await Promise.all([
      supabase
        .from("budgets")
        .select(
          "budget_id, fiscal_year, allocated_amount, budget_categories(category_name)"
        )
        .gte("fiscal_year", fromYear)
        .lte("fiscal_year", toYear)
        .order("fiscal_year", { ascending: false }),
      supabase
        .from("expenses")
        .select("amount, expense_category_id, expense_date")
        .gte("expense_date", from)
        .lte("expense_date", to),
      supabase
        .from("expense_categories")
        .select("expense_category_id, category_name"),
    ]);

  let budgets = budgetsResult.data;
  if (budgetsResult.error) {
    const fallback = await supabase
      .from("budgets")
      .select(
        "budget_id, fiscal_year, allocated_amount, budget_categories(category_name)"
      )
      .order("fiscal_year", { ascending: false });
    budgets = fallback.data;
  }

  const expenseCategoryNameById = new Map(
    (expenseCategories ?? []).map((c) => [
      c.expense_category_id,
      c.category_name,
    ])
  );

  const spendByCategory = new Map<string, number>();
  for (const expense of expenses ?? []) {
    const name =
      expenseCategoryNameById.get(expense.expense_category_id ?? -1) ||
      "Uncategorized";
    spendByCategory.set(
      name,
      (spendByCategory.get(name) ?? 0) + toNumber(expense.amount)
    );
  }

  // Aggregate allocations by category name.
  const allocatedByCategory = new Map<string, number>();
  for (const row of budgets ?? []) {
    const category =
      relationName(
        row.budget_categories as
          | { category_name?: string }
          | { category_name?: string }[]
          | null
      ) || "Uncategorized";
    allocatedByCategory.set(
      category,
      (allocatedByCategory.get(category) ?? 0) + toNumber(row.allocated_amount)
    );
  }

  let allocatedTotal = 0;
  let usedTotal = 0;

  const columns: ReportColumn[] = [
    { key: "category", label: "Budget Category" },
    { key: "allocated", label: "Allocated", align: "right" },
    { key: "used", label: "Used", align: "right" },
    { key: "remaining", label: "Remaining", align: "right" },
    { key: "status", label: "Status" },
  ];

  const rows: ReportRow[] = [...allocatedByCategory.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, allocated], index) => {
      const used = spendByCategory.get(category) ?? 0;
      const remaining = allocated - used;
      allocatedTotal += allocated;
      usedTotal += used;

      return {
        id: `budget-${index}`,
        amount: allocated,
        cells: {
          category,
          allocated: formatMoneyPlain(allocated),
          used: formatMoneyPlain(used),
          remaining: formatMoneyPlain(remaining),
          status: budgetStatus(allocated, used),
        },
      };
    });

  const remainingTotal = allocatedTotal - usedTotal;
  const metrics: ReportMetric[] = [
    {
      id: "allocated",
      label: "Total Allocated",
      value: formatMoneyPlain(allocatedTotal),
      tone: "navy",
    },
    {
      id: "used",
      label: "Total Used",
      value: formatMoneyPlain(usedTotal),
      tone: "gold",
    },
    {
      id: "remaining",
      label: "Remaining",
      value: formatMoneyPlain(remainingTotal),
      tone: "green",
    },
    {
      id: "categories",
      label: "Categories",
      value: String(rows.length),
      tone: "purple",
    },
  ];

  return {
    type: "budget",
    title,
    from,
    to,
    metrics,
    columns,
    rows,
    summaryLines: [
      { label: "Total Allocated", amount: allocatedTotal },
      { label: "Total Used", amount: usedTotal },
      { label: "Remaining", amount: remainingTotal, emphasis: true },
    ],
    breakdown: buildBreakdown(allocatedByCategory),
    tableTitle: "Budget Utilization",
    notes:
      "Status: Healthy (<80% used), Near Limit (80–100%), Over Budget (>100%). Used amounts reflect expenses in the selected date range.",
    exportRows: [
      columns.map((col) => col.label),
      ...rows.map((row) => columns.map((col) => row.cells[col.key] ?? "")),
      [
        "Totals",
        formatMoneyPlain(allocatedTotal),
        formatMoneyPlain(usedTotal),
        formatMoneyPlain(remainingTotal),
        "",
      ],
    ],
  };
}
