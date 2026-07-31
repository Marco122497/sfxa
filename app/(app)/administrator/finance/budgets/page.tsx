import { requireAdmin } from "@/lib/auth/session";
import { getBudgetModuleData } from "@/lib/treasurer/budget-data";
import { formatMoney } from "@/lib/format";
import { FinancePageHeader } from "@/components/administrator/finance-page-header";
import { BudgetManager } from "@/components/treasurer/budget-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminBudgetsPage() {
  await requireAdmin();
  const { categories, rows, totals, subcategorySetupRequired } =
    await getBudgetModuleData();

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Budget Allocation"
        description="Allocate budgets per general or specific category; specific allocations roll up into the general total."
      />
      {subcategorySetupRequired && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Specific budget allocations need a database update. Run{" "}
          <code className="text-xs">sql/phase10-budget-subcategories.sql</code>{" "}
          in Supabase, then refresh.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Budget</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(totals.allocated)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remaining Budget</CardTitle>
            <CardDescription>Budget minus recorded expenses</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(totals.remaining)}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-6">
          <BudgetManager budgets={rows} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
