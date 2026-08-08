import { PiggyBankIcon } from "lucide-react";
import { requireParishOfficer } from "@/lib/auth/session";
import { getBudgetModuleData } from "@/lib/treasurer/budget-data";
import { formatMoney } from "@/lib/format";
import { ParishViewPageHeader } from "@/components/parish-officer/parish-view-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ParishBudgetMonitoringPage() {
  await requireParishOfficer();
  const { rows, totals, subcategorySetupRequired } =
    await getBudgetModuleData();

  return (
    <div className="space-y-6">
      <ParishViewPageHeader
        title="Budget Monitoring"
        description="View budget allocation, utilization, and remaining balances."
        icon={PiggyBankIcon}
      />

      {subcategorySetupRequired ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Specific budget allocations need a database update. Run{" "}
          <code className="text-xs">sql/phase10-budget-subcategories.sql</code>{" "}
          in Supabase, then refresh.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation</CardTitle>
            <CardDescription>Total allocated</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(totals.allocated)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>Total spent</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(totals.utilized)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remaining Budget</CardTitle>
            <CardDescription>Allocation minus spent</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(totals.remaining)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Allocation details</CardTitle>
          <CardDescription>
            General and specific category allocations with remaining budget.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No budgets yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>General</TableHead>
                  <TableHead>Specific</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Utilized</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.budget_id}>
                    <TableCell>{row.fiscal_year}</TableCell>
                    <TableCell>{row.category_name || "—"}</TableCell>
                    <TableCell>
                      {row.subcategory_name || (
                        <span className="text-muted-foreground">General</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {row.remarks || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.allocated_amount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.spent)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.remaining)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.utilizationPct}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
