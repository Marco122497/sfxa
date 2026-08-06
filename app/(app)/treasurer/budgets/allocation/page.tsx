import { requireTreasurer } from "@/lib/auth/session";
import { getBudgetModuleData } from "@/lib/treasurer/budget-data";
import { BudgetPageHeader } from "@/components/treasurer/budget-page-header";
import { BudgetManager } from "@/components/treasurer/budget-manager";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default async function TreasurerBudgetAllocationPage() {
  await requireTreasurer();
  const { categories, rows, subcategorySetupRequired } =
    await getBudgetModuleData();

  return (
    <div className="space-y-4">
      <BudgetPageHeader
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
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <BudgetManager budgets={rows} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
