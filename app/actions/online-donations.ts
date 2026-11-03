"use server";

import { requireParishOfficer } from "@/lib/auth/session";

export type OnlineDonationState = {
  error?: string;
  success?: string;
};

export async function submitOnlineDonation(
  _prev: OnlineDonationState,
  _formData: FormData
): Promise<OnlineDonationState> {
  await requireParishOfficer();
  return {
    error:
      "Payments are taken in person at the parish. The treasurer records the payment and its official receipt number.",
  };
}
