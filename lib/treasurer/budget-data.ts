import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format";
import { relationName } from "@/lib/treasurer/relations";

export type BudgetSubcategoryOption = {
  subcategory_id: number;
  subcategory_name: string;
};

export type BudgetCategoryOption = {
  budget_category_id: number;
  category_name: string;
  subcategories: BudgetSubcategoryOption[];
};

export type BudgetAllocationRow = {
  budget_id: number;
  budget_category_id: number | null;
  expense_subcategory_id: number | null;
  fiscal_year: number;
  allocated_amount: number | string;
  remarks: string | null;
  category_name: string | null;
  subcategory_name: string | null;
  spent: number;
  /** Total spend for the whole general category (shared by all rows in a year+category group). */
  category_spent: number;
  remaining: number;
  utilizationPct: number;
};

export async function getBudgetModuleData() {
  const supabase = await createClient();

  const [
    { data: categories },
    budgetsResult,
    { data: expenses },
    { data: expenseCategories },
    { data: expenseSubcategories },
  ] = await Promise.all([
    supabase
      .from("budget_categories")
      .select("budget_category_id, category_name")
      .order("category_name"),
    supabase
      .from("budgets")
      .select(
        "budget_id, budget_category_id, expense_subcategory_id, fiscal_year, allocated_amount, remarks, budget_categories(category_name), expense_subcategories(subcategory_name)"
      )
      .order("fiscal_year", { ascending: false }),
    supabase
      .from("expenses")
      .select("amount, expense_category_id, expense_subcategory_id"),
    supabase
      .from("expense_categories")
      .select("expense_category_id, category_name"),
    supabase
      .from("expense_subcategories")
      .select("subcategory_id, expense_category_id, subcategory_name")
      .order("subcategory_name"),
  ]);

  // Before sql/phase5-budget.sql the budgets table has no subcategory column; fall back.
  let budgets = budgetsResult.data as
    | {
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
      }[]
    | null;
  const subcategorySetupRequired = Boolean(budgetsResult.error);

  if (budgetsResult.error) {
    const fallback = await supabase
      .from("budgets")
      .select(
        "budget_id, budget_category_id, fiscal_year, allocated_amount, remarks, budget_categories(category_name)"
      )
      .order("fiscal_year", { ascending: false });
    budgets = fallback.data as typeof budgets;
  }

  const expenseCategoryNameById = new Map(
    (expenseCategories ?? []).map((c) => [
      c.expense_category_id,
      c.category_name,
    ])
  );

  // Budget categories mirror expense categories by name; attach subcategory options.
  const subcategoriesByCategoryName = new Map<string, BudgetSubcategoryOption[]>();
  for (const sub of expenseSubcategories ?? []) {
    const parentName = expenseCategoryNameById.get(sub.expense_category_id);
    if (!parentName) continue;
    const list = subcategoriesByCategoryName.get(parentName) ?? [];
    list.push({
      subcategory_id: sub.subcategory_id,
      subcategory_name: sub.subcategory_name,
    });
    subcategoriesByCategoryName.set(parentName, list);
  }

  const categoryOptions: BudgetCategoryOption[] = (categories ?? []).map(
    (category) => ({
      budget_category_id: category.budget_category_id,
      category_name: category.category_name,
      subcategories:
        subcategoriesByCategoryName.get(category.category_name) ?? [],
    })
  );

  const spentByCategoryName = new Map<string, number>();
  const spentBySubcategoryId = new Map<number, number>();
  for (const row of expenses ?? []) {
    const name = expenseCategoryNameById.get(row.expense_category_id ?? -1);
    if (!name) continue;
    const amount = toNumber(row.amount);
    spentByCategoryName.set(name, (spentByCategoryName.get(name) ?? 0) + amount);
    if (row.expense_subcategory_id != null) {
      spentBySubcategoryId.set(
        row.expense_subcategory_id,
        (spentBySubcategoryId.get(row.expense_subcategory_id) ?? 0) + amount
      );
    }
  }

  type RawBudget = NonNullable<typeof budgets>[number];

  // Group budgets by fiscal year + category so general allocations can absorb
  // the spend not covered by their sibling specific allocations.
  const groups = new Map<string, RawBudget[]>();
  for (const row of budgets ?? []) {
    const categoryName = relationName(row.budget_categories ?? null);
    const key = `${row.fiscal_year}::${categoryName ?? ""}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const rows: BudgetAllocationRow[] = [];
  for (const groupRows of groups.values()) {
    const categoryName = relationName(groupRows[0].budget_categories ?? null);
    const categorySpent = categoryName
      ? (spentByCategoryName.get(categoryName) ?? 0)
      : 0;
    const siblingSubSpend = groupRows.reduce(
      (sum, row) =>
        row.expense_subcategory_id != null
          ? sum + (spentBySubcategoryId.get(row.expense_subcategory_id) ?? 0)
          : sum,
      0
    );
    let generalRemainderAssigned = false;

    for (const row of groupRows) {
      const allocated = toNumber(row.allocated_amount);
      let spent: number;
      if (row.expense_subcategory_id != null) {
        spent = spentBySubcategoryId.get(row.expense_subcategory_id) ?? 0;
      } else if (!generalRemainderAssigned) {
        spent = Math.max(0, categorySpent - siblingSubSpend);
        generalRemainderAssigned = true;
      } else {
        spent = 0;
      }

      const remaining = allocated - spent;
      rows.push({
        budget_id: row.budget_id,
        budget_category_id: row.budget_category_id,
        expense_subcategory_id: row.expense_subcategory_id ?? null,
        fiscal_year: row.fiscal_year,
        allocated_amount: row.allocated_amount,
        remarks: row.remarks,
        category_name: categoryName,
        subcategory_name: relationName(
          row.expense_subcategories ?? null,
          "subcategory_name"
        ),
        spent,
        category_spent: categorySpent,
        remaining,
        utilizationPct:
          allocated > 0
            ? Math.min(100, Math.round((spent / allocated) * 100))
            : 0,
      });
    }
  }

  rows.sort(
    (a, b) =>
      b.fiscal_year - a.fiscal_year ||
      (a.category_name ?? "").localeCompare(b.category_name ?? "") ||
      (a.subcategory_name ?? "").localeCompare(b.subcategory_name ?? "")
  );

  const totalAllocated = rows.reduce(
    (sum, row) => sum + toNumber(row.allocated_amount),
    0
  );
  const totalSpent = rows.reduce((sum, row) => sum + row.spent, 0);

  return {
    categories: categoryOptions,
    rows,
    subcategorySetupRequired,
    totals: {
      allocated: totalAllocated,
      utilized: totalSpent,
      remaining: totalAllocated - totalSpent,
      utilizationPct:
        totalAllocated > 0
          ? Math.min(100, Math.round((totalSpent / totalAllocated) * 100))
          : 0,
    },
  };
}
