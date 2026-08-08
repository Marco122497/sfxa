import { HistoryIcon } from "lucide-react";
import { requireTreasurer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/auth/roles";
import { formatMoney } from "@/lib/format";
import { relationName } from "@/lib/treasurer/relations";
import { BudgetPageHeader } from "@/components/treasurer/budget-page-header";
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

type HistoryRow = {
  history_id: number;
  budget_id: number | null;
  category_name: string | null;
  subcategory_name?: string | null;
  fiscal_year: number | null;
  new_amount: number | string | null;
  remarks: string | null;
  changed_at: string;
  profiles?:
    | { full_name?: string }
    | { full_name?: string }[]
    | null;
  budgets?:
    | {
        expense_subcategories?:
          | { subcategory_name?: string }
          | { subcategory_name?: string }[]
          | null;
      }
    | {
        expense_subcategories?:
          | { subcategory_name?: string }
          | { subcategory_name?: string }[]
          | null;
      }[]
    | null;
};

export default async function TreasurerBudgetHistoryPage() {
  await requireTreasurer();
  const supabase = await createClient();

  let error: { message: string } | null = null;
  let rows: HistoryRow[] = [];

  const primary = await supabase
    .from("budget_history")
    .select(
      "history_id, budget_id, category_name, subcategory_name, fiscal_year, new_amount, remarks, changed_at, profiles(full_name), budgets(expense_subcategories(subcategory_name))"
    )
    .order("changed_at", { ascending: false })
    .limit(100);

  if (primary.error) {
    const fallback = await supabase
      .from("budget_history")
      .select(
        "history_id, budget_id, category_name, fiscal_year, new_amount, remarks, changed_at, profiles(full_name), budgets(expense_subcategories(subcategory_name))"
      )
      .order("changed_at", { ascending: false })
      .limit(100);

    if (fallback.error) {
      error = fallback.error;
    } else {
      rows = (fallback.data ?? []) as HistoryRow[];
    }
  } else {
    rows = (primary.data ?? []) as HistoryRow[];
  }

  return (
    <div className="space-y-6">
      <BudgetPageHeader
        title="Budget History"
        description="Audit trail of budget create, update, and delete actions."
        icon={HistoryIcon}
      />

      <Card>
        <CardHeader>
          <CardTitle>Change history</CardTitle>
          <CardDescription>
            {error
              ? "History table is not available yet. Run sql/phase6-budget.sql in Supabase."
              : "Most recent budget changes across the parish."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-muted-foreground">{error.message}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No budget history yet. Allocations you create or update will
              appear here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>General category</TableHead>
                  <TableHead>Specific category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const changedBy = Array.isArray(row.profiles)
                    ? row.profiles[0]?.full_name
                    : row.profiles?.full_name;

                  const linkedBudget = Array.isArray(row.budgets)
                    ? row.budgets[0]
                    : row.budgets;

                  const linkedSpecific = relationName(
                    linkedBudget?.expense_subcategories ?? null,
                    "subcategory_name"
                  );

                  const specific = row.subcategory_name || linkedSpecific || null;

                  return (
                    <TableRow key={row.history_id}>
                      <TableCell>{formatDateTime(row.changed_at)}</TableCell>
                      <TableCell>{row.category_name || "—"}</TableCell>
                      <TableCell>
                        {specific || (
                          <span className="text-muted-foreground">
                            General
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.new_amount == null
                          ? "—"
                          : formatMoney(row.new_amount)}
                      </TableCell>
                      <TableCell>{changedBy || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
