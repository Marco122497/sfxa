"use server";

import { revalidatePath } from "next/cache";

import { requireTreasurerOrAdmin } from "@/lib/auth/session";

export type ReceiveDonationState = {
  error?: string;
  success?: string;
};

export async function receiveOnlineDonation(
  _prev: ReceiveDonationState,
  formData: FormData
): Promise<ReceiveDonationState> {
  const { supabase } = await requireTreasurerOrAdmin();
  const donation_id = Number(formData.get("donation_id"));
  if (!donation_id) return { error: "Missing donation." };

  const { error } = await supabase
    .from("donations")
    .update({ status: "received" })
    .eq("donation_id", donation_id);

  if (error) {
    return {
      error: error.message.includes("status")
        ? "Donation recorded. Run sql/phase4-treasurer.sql to enable verify/receive status."
        : error.message,
    };
  }
  revalidatePath("/treasurer/receive/donations");
  revalidatePath("/treasurer/donations");
  revalidatePath("/treasurer/cash-flow");
  revalidatePath("/administrator");
  return { success: "Donation received into cash inflow." };
}
