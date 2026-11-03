import { HistoryIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/auth/roles";
import { formatMoney } from "@/lib/format";
import { PageHeading } from "@/components/layout/page-heading";
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
  created_at: string;
  actor_name: string;
  actor_role: string;
  action: string;
  source: string;
  or_number: string | null;
  amount: number | string | null;
  summary: string;
};

const actionLabel: Record<string, string> = {
  RECORDED_PAYMENT: "Payment recorded",
  UPDATED_PAYMENT: "Payment updated",
  DELETED_PAYMENT: "Payment deleted",
  SUBMITTED_ONLINE_PAYMENT: "Online payment submitted",
  PROCESSED_ONLINE_PAYMENT: "Online payment processed",
  RECORDED_EXPENSE: "Expense recorded",
  UPDATED_EXPENSE: "Expense updated",
  DELETED_EXPENSE: "Expense deleted",
};

export async function TransactionHistory() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finance_history")
    .select(
      "history_id, created_at, actor_name, actor_role, action, source, or_number, amount, summary"
    )
    .order("created_at", { ascending: false })
    .limit(300);

  const rows = (data ?? []) as HistoryRow[];
  const missingTable = Boolean(
    error && /finance_history|relation|does not exist|schema cache/i.test(error.message)
  );

  return (
    <div className="space-y-4">
      <PageHeading
        title="Transaction History"
        description="A permanent record of payments and expenses. Entries stay here even when a transaction is changed or removed."
        icon={HistoryIcon}
      />
      {missingTable ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Transaction history is not set up yet. Run{" "}
          <code className="text-xs">sql/phase9-finance-history.sql</code> in
          Supabase, then refresh.
        </p>
      ) : null}
      {error && !missingTable ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : null}
      {!error && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No transactions have been recorded yet.
        </p>
      ) : null}
      {rows.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>OR No.</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Record</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.history_id}>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(row.created_at)}
                </TableCell>
                <TableCell>
                  <div>{row.actor_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.actor_role}
                  </div>
                </TableCell>
                <TableCell>{actionLabel[row.action] || row.action}</TableCell>
                <TableCell>{row.or_number || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.amount == null ? "—" : formatMoney(row.amount)}
                </TableCell>
                <TableCell className="max-w-[360px]">{row.summary}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
}
