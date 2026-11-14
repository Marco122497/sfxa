import { HistoryIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/auth/roles";
import { formatMoney } from "@/lib/format";
import { PageHeading } from "@/components/layout/page-heading";
import {
  TransactionHistoryTable,
  type HistoryViewRow,
} from "@/components/finance/transaction-history-table";

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

const FETCH_SIZE = 1000;

export async function TransactionHistory() {
  const supabase = await createClient();
  const rows: HistoryRow[] = [];
  let errorMessage: string | null = null;

  for (let from = 0; ; from += FETCH_SIZE) {
    const { data, error } = await supabase
      .from("finance_history")
      .select(
        "history_id, created_at, actor_name, actor_role, action, source, or_number, amount, summary"
      )
      .order("created_at", { ascending: false })
      .range(from, from + FETCH_SIZE - 1);

    if (error) {
      errorMessage = error.message;
      break;
    }

    const batch = (data ?? []) as HistoryRow[];
    rows.push(...batch);
    if (batch.length < FETCH_SIZE) break;
  }

  const missingTable = Boolean(
    errorMessage &&
      /finance_history|relation|does not exist|schema cache/i.test(errorMessage)
  );
  const viewRows: HistoryViewRow[] = rows.map((row) => ({
    id: row.history_id,
    when: formatDateTime(row.created_at),
    actorName: row.actor_name,
    actorRole: row.actor_role,
    action: actionLabel[row.action] || row.action,
    orNumber: row.or_number || "—",
    amount: row.amount == null ? "—" : formatMoney(row.amount),
    summary: row.summary,
  }));

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
      {errorMessage && !missingTable ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
      {!errorMessage && viewRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No transactions have been recorded yet.
        </p>
      ) : null}
      {viewRows.length > 0 ? <TransactionHistoryTable rows={viewRows} /> : null}
    </div>
  );
}
