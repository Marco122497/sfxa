import type { SupabaseClient } from "@supabase/supabase-js";

import { displayRoleName } from "@/lib/income";

export type FinanceHistoryEntry = {
  userId: string;
  actorName: string;
  actorRole: string;
  action: string;
  source: "counter" | "online" | "expense";
  orNumber?: string | null;
  amount?: number | null;
  recordTable?: string | null;
  recordId?: number | null;
  summary: string;
};

/** Append-only. A missing table does not undo the transaction that was just saved. */
export async function recordFinanceHistory(
  supabase: SupabaseClient,
  entry: FinanceHistoryEntry
) {
  await supabase.from("finance_history").insert({
    user_id: entry.userId,
    actor_name: entry.actorName.trim() || "—",
    actor_role: displayRoleName(entry.actorRole),
    action: entry.action,
    source: entry.source,
    or_number: entry.orNumber?.trim() || null,
    amount: entry.amount ?? null,
    record_table: entry.recordTable ?? null,
    record_id: entry.recordId ?? null,
    summary: entry.summary,
  });
}
