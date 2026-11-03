import type { SupabaseClient } from "@supabase/supabase-js";

import { formatMoney } from "@/lib/format";

export const PAYMENT_METHODS = ["Cash"] as const;

export const DEFAULT_TRANSACTION_LIMIT = 10_000;

export function normalizeOrNumber(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 40);
}

export function isPostedPayment(status: string | null | undefined) {
  return status !== "pending";
}

export function exceedsTransactionLimit(
  amount: number,
  limit: number,
  role: string
) {
  if (role === "Administrator") return false;
  if (limit <= 0) return false;
  return Math.round(amount * 100) > Math.round(limit * 100);
}

export function transactionLimitMessage(limit: number) {
  return `This amount is above the transaction limit of ${formatMoney(limit)}. An administrator must record it.`;
}

export function orNumberSchemaMessage(message: string) {
  if (/or_number/i.test(message) && /column|schema|does not exist/i.test(message)) {
    return "Official receipt numbers are not set up yet. Run sql/phase8-panel.sql in the Supabase SQL editor, then try again.";
  }
  if (/23505|duplicate|unique/i.test(message)) {
    return "This OR number is already used on another payment.";
  }
  return null;
}

export async function nextOfficialReceiptNumber(supabase: SupabaseClient) {
  const year = new Date().getFullYear();
  const prefix = `OR-${year}-`;
  const { data, error } = await supabase
    .from("donations")
    .select("or_number")
    .ilike("or_number", `${prefix}%`)
    .order("or_number", { ascending: false })
    .limit(50);

  if (error || !data) return "";

  let max = 0;
  for (const row of data) {
    const match = String(row.or_number || "").match(/(\d+)\s*$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}
