"use server";

import { revalidatePath } from "next/cache";

import { requireParishOfficer } from "@/lib/auth/session";

export type OnlineDonationState = {
  error?: string;
  success?: string;
};

export async function submitOnlineDonation(
  _prev: OnlineDonationState,
  formData: FormData
): Promise<OnlineDonationState> {
  const { supabase, user, profile } = await requireParishOfficer();
  const category_id = Number(formData.get("category_id"));
  const amount = Number(formData.get("amount"));
  const payment_method = String(formData.get("payment_method") || "").trim();
  const remarks = String(formData.get("remarks") || "").trim();

  if (!category_id || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Select a donation type and enter a valid amount." };
  }
  if (!payment_method) {
    return { error: "Select a payment method." };
  }

  const payload: Record<string, unknown> = {
    donor_name: profile.full_name,
    category_id,
    amount,
    donation_date: new Date().toISOString().slice(0, 10),
    remarks: `[ONLINE][${payment_method}] ${remarks}`.trim(),
    created_by: user.id,
  };

  let { error } = await supabase.from("donations").insert({
    ...payload,
    donor_user_id: user.id,
    payment_method,
    status: "pending",
  });

  if (error) {
    const fallback = await supabase.from("donations").insert(payload);
    error = fallback.error;
  }

  if (error) return { error: error.message };

  revalidatePath("/parish-officer");
  revalidatePath("/parish-officer/donate");
  revalidatePath("/parish-officer/donations");
  revalidatePath("/parish-officer/receipts");
  revalidatePath("/treasurer/donations");
  revalidatePath("/treasurer/receive", "layout");
  return {
    success:
      "Donation submitted. The Treasurer will verify and receive this into cash inflow.",
  };
}
