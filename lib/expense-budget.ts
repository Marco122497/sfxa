import { toNumber } from "@/lib/format";

export type ExpenseBudgetCap = {
  fiscalYear: number;
  expenseCategoryId: number;
  expenseSubcategoryId: number | null;
  allocated: number;
  remaining: number;
};

export function toExpenseBudgetCaps(
  rows: {
    fiscal_year: number;
    category_name: string | null;
    expense_subcategory_id: number | null;
    allocated_amount: number | string;
    remaining: number;
  }[],
  expenseCategories: { expense_category_id: number; category_name: string }[]
): ExpenseBudgetCap[] {
  const idByName = new Map(
    expenseCategories.map((category) => [
      category.category_name,
      category.expense_category_id,
    ])
  );

  return rows.flatMap((row) => {
    const expenseCategoryId = idByName.get(row.category_name ?? "");
    if (!expenseCategoryId) return [];
    return [
      {
        fiscalYear: row.fiscal_year,
        expenseCategoryId,
        expenseSubcategoryId: row.expense_subcategory_id,
        allocated: toNumber(row.allocated_amount),
        remaining: row.remaining,
      },
    ];
  });
}

export function resolveExpenseBudgetCap(
  caps: ExpenseBudgetCap[],
  expenseCategoryId: number | "",
  expenseSubcategoryId: number | "",
  fiscalYear: number
): ExpenseBudgetCap | null {
  if (expenseCategoryId === "") return null;

  const categoryId = Number(expenseCategoryId);
  const subcategoryId =
    expenseSubcategoryId === "" ? null : Number(expenseSubcategoryId);
  const forCategory = caps.filter(
    (cap) => cap.expenseCategoryId === categoryId
  );
  if (forCategory.length === 0) return null;

  const yearCaps = forCategory.filter((cap) => cap.fiscalYear === fiscalYear);
  const pool =
    yearCaps.length > 0
      ? yearCaps
      : forCategory.filter(
          (cap) =>
            cap.fiscalYear ===
            Math.max(...forCategory.map((item) => item.fiscalYear))
        );

  if (subcategoryId != null) {
    const specific = pool.find(
      (cap) => cap.expenseSubcategoryId === subcategoryId
    );
    if (specific) return specific;
  }

  return pool.find((cap) => cap.expenseSubcategoryId == null) ?? null;
}
