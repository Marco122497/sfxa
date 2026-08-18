import { ReceiptIcon } from "lucide-react";
import { requireTreasurer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { relationName } from "@/lib/treasurer/relations";
import { getBudgetModuleData } from "@/lib/treasurer/budget-data";
import { toExpenseBudgetCaps } from "@/lib/expense-budget";
import { TreasurerPageHeader } from "@/components/treasurer/treasurer-page-header";
import { ExpenseManager } from "@/components/treasurer/expense-manager";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default async function TreasurerExpensesPage() {
  await requireTreasurer();
  const supabase = await createClient();

  const [
    { data: categories },
    subcategoriesResult,
    expensesResult,
    budgetModule,
  ] = await Promise.all([
    supabase
      .from("expense_categories")
      .select("expense_category_id, category_name")
      .order("category_name"),
    supabase
      .from("expense_subcategories")
      .select("subcategory_id, expense_category_id, subcategory_name")
      .order("subcategory_name"),
    supabase
      .from("expenses")
      .select(
        "expense_id, expense_category_id, expense_subcategory_id, description, amount, expense_date, receipt_url, expense_categories(category_name), expense_subcategories(subcategory_name)"
      )
      .order("expense_date", { ascending: false })
      .limit(200),
    getBudgetModuleData(),
  ]);

  const budgetedCategoryNames = new Set(
    budgetModule.rows.map((row) => row.category_name).filter(Boolean)
  );
  const budgetCaps = toExpenseBudgetCaps(budgetModule.rows, categories ?? []);

  let expenses:
    | {
        expense_id: number;
        expense_category_id: number | null;
        expense_subcategory_id?: number | null;
        description: string | null;
        amount: number | string;
        expense_date: string;
        receipt_url?: string | null;
        expense_categories?:
          | { category_name?: string }
          | { category_name?: string }[]
          | null;
        expense_subcategories?:
          | { subcategory_name?: string }
          | { subcategory_name?: string }[]
          | null;
      }[]
    | null = expensesResult.data;

  if (expensesResult.error) {
    const fallback = await supabase
      .from("expenses")
      .select(
        "expense_id, expense_category_id, description, amount, expense_date, receipt_url, expense_categories(category_name)"
      )
      .order("expense_date", { ascending: false })
      .limit(200);
    expenses = fallback.data as typeof expenses;
  }

  const rows = (expenses ?? []).map((row) => ({
    expense_id: row.expense_id,
    expense_category_id: row.expense_category_id,
    expense_subcategory_id: row.expense_subcategory_id ?? null,
    description: row.description,
    amount: row.amount,
    expense_date: row.expense_date,
    receipt_url: row.receipt_url ?? null,
    category_name: relationName(row.expense_categories ?? null),
    subcategory_name: relationName(
      row.expense_subcategories ?? null,
      "subcategory_name"
    ),
  }));

  return (
    <div className="space-y-4">
      <TreasurerPageHeader
        title="Expenses"
        description="Record spending with a general category and a specific category under it."
        icon={ReceiptIcon}
      />
      {(subcategoriesResult.error || expensesResult.error) && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Specific categories need a database update. Run{" "}
          <code className="text-xs">sql/phase3-categories.sql</code>{" "}
          in Supabase, then refresh.
        </p>
      )}
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <ExpenseManager
            expenses={rows}
            categories={(categories ?? []).map((category) => ({
              ...category,
              has_budget: budgetedCategoryNames.has(category.category_name),
            }))}
            subcategories={subcategoriesResult.data ?? []}
            budgetCaps={budgetCaps}
          />
        </CardContent>
      </Card>
    </div>
  );
}
