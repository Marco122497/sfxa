import { ReceiptIcon } from "lucide-react";
import { requireParishOfficer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import { isReportPeriod } from "@/lib/reports";
import { startOfPeriod } from "@/lib/reports-period";
import { relationName } from "@/lib/treasurer/relations";
import { ParishViewPageHeader } from "@/components/parish-officer/parish-view-page-header";
import { ReportPeriodSelect } from "@/components/administrator/report-period-select";
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

export default async function ParishExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireParishOfficer();
  const params = await searchParams;
  const period = isReportPeriod(params.period) ? params.period : "monthly";
  const fromDate = startOfPeriod(period);
  const supabase = await createClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select(
      "expense_id, description, amount, expense_date, expense_categories(category_name), expense_subcategories(subcategory_name)"
    )
    .gte("expense_date", fromDate)
    .order("expense_date", { ascending: false });

  const total = (expenses ?? []).reduce(
    (sum, row) => sum + toNumber(row.amount),
    0
  );

  return (
    <div className="space-y-6">
      <ParishViewPageHeader
        title="Expenses"
        description="Read-only view of expenses by general and specific category."
        icon={ReceiptIcon}
        actions={
          <ReportPeriodSelect
            period={period}
            basePath="/parish-officer/expenses"
          />
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Expense records</CardTitle>
          <CardDescription>
            From {formatDate(fromDate)} · Total {formatMoney(total)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(expenses ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No expenses in period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>General</TableHead>
                  <TableHead>Specific</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(expenses ?? []).map((row) => {
                  const category = relationName(
                    row.expense_categories as
                      | { category_name?: string }
                      | { category_name?: string }[]
                      | null
                  );
                  const subcategory = relationName(
                    row.expense_subcategories as
                      | { subcategory_name?: string }
                      | { subcategory_name?: string }[]
                      | null,
                    "subcategory_name"
                  );
                  return (
                    <TableRow key={row.expense_id}>
                      <TableCell>{formatDate(row.expense_date)}</TableCell>
                      <TableCell>{category || "—"}</TableCell>
                      <TableCell className="max-w-[240px] truncate">
                        {subcategory || row.description || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.amount)}
                      </TableCell>
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
