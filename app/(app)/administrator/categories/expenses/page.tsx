import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CategoryPageHeader } from "@/components/administrator/category-page-header";
import { ExpenseCategoryManager } from "@/components/administrator/expense-category-manager";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminExpenseCategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: generals }, { data: specifics, error: specificsError }] =
    await Promise.all([
      supabase
        .from("expense_categories")
        .select("expense_category_id, category_name")
        .order("category_name"),
      supabase
        .from("expense_subcategories")
        .select("subcategory_id, expense_category_id, subcategory_name")
        .order("subcategory_name"),
    ]);

  return (
    <div className="space-y-4">
      <CategoryPageHeader
        title="Expense Categories"
        description="Add a general category first (also used for budgets). Then add specific categories under it."
      />
      {specificsError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Specific categories could not load. Run{" "}
          <code className="text-xs">sql/phase9-expense-subcategories.sql</code>{" "}
          in Supabase, then refresh.
        </p>
      )}
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <ExpenseCategoryManager
            generals={(generals ?? []).map((row) => ({
              id: row.expense_category_id,
              name: row.category_name,
            }))}
            specifics={specifics ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
