"use server";

import { revalidatePath } from "next/cache";

import { requireTreasurerOrAdmin } from "@/lib/auth/session";
import { recordFinanceHistory } from "@/lib/finance-history";
import { formatMoney, toNumber } from "@/lib/format";
import {
  exceedsTransactionLimit,
  nextOfficialReceiptNumber,
  normalizeOrNumber,
  transactionLimitMessage,
  orNumberSchemaMessage,
} from "@/lib/payments";
import { getTransactionLimit } from "@/lib/parish-settings";

export type ReceiveDonationState = {
  error?: string;
  success?: string;
};

export async function receiveOnlineDonation(
  _prev: ReceiveDonationState,
  formData: FormData
): Promise<ReceiveDonationState> {
  const { supabase, user, profile } = await requireTreasurerOrAdmin();
  const donation_id = Number(formData.get("donation_id"));
  let or_number = normalizeOrNumber(String(formData.get("or_number") || ""));
  if (!donation_id) return { error: "Missing donation." };
  if (!or_number) {
    or_number = await nextOfficialReceiptNumber(supabase);
  }
  if (!or_number) {
    return {
      error:
        "Official receipt numbers are not set up yet. Run sql/phase8-panel.sql in the Supabase SQL editor, then try again.",
    };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("donations")
    .select("amount, status")
    .eq("donation_id", donation_id)
    .maybeSingle();

  if (lookupError || !existing) {
    return { error: lookupError?.message || "Donation not found." };
  }

  const limit = await getTransactionLimit(supabase);
  if (exceedsTransactionLimit(toNumber(existing.amount), limit, profile.role)) {
    return { error: transactionLimitMessage(limit) };
  }

  const { data: duplicate } = await supabase
    .from("donations")
    .select("donation_id")
    .eq("or_number", or_number)
    .neq("donation_id", donation_id)
    .maybeSingle();

  if (duplicate) {
    return { error: "This OR number is already used on another payment." };
  }

  const { error } = await supabase
    .from("donations")
    .update({ status: "received", or_number })
    .eq("donation_id", donation_id);

  if (error) {
    return {
      error:
        orNumberSchemaMessage(error.message) ??
        (error.message.includes("status")
          ? "Donation recorded. Run sql/phase4-treasurer.sql to enable verify/receive status."
          : error.message),
    };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "RECEIVE_DONATION",
    table_name: "donations",
    record_id: donation_id,
    description: `Received donation #${donation_id} (${or_number})`,
  });

  await recordFinanceHistory(supabase, {
    userId: user.id,
    actorName: profile.full_name,
    actorRole: profile.role,
    action: "PROCESSED_ONLINE_PAYMENT",
    source: "online",
    orNumber: or_number,
    amount: toNumber(existing.amount),
    recordTable: "donations",
    recordId: donation_id,
    summary: `Processed online payment ${formatMoney(toNumber(existing.amount))} and assigned OR ${or_number}.`,
  });

  revalidatePath("/treasurer/receive", "layout");
  revalidatePath("/treasurer/donations");
  revalidatePath("/treasurer/cash-flow");
  revalidatePath("/treasurer/reports");
  revalidatePath("/administrator");
  revalidatePath("/administrator/reports");
  revalidatePath("/administrator/finance", "layout");
  revalidatePath("/treasurer/history");
  return { success: `Donation received. OR ${or_number}.` };
}
