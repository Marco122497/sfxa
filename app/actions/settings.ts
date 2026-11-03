"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { isProtectedAdminAccount } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { setFakeLoginErrorEnabled } from "@/lib/auth/fake-login-error";
import { DEFAULT_PARISH_PRIEST_NAME } from "@/lib/parish-settings";
import { formatMoney } from "@/lib/format";

export type ParishSettingsActionState = {
  error?: string;
  success?: string;
};

function missingTableMessage(message: string) {
  if (/relation|does not exist|parish_settings/i.test(message)) {
    return "Parish settings table is missing. Run sql/phase7-parish-settings.sql in Supabase, then try again.";
  }
  return message;
}

export async function updateParishPriestName(
  _prev: ParishSettingsActionState,
  formData: FormData
): Promise<ParishSettingsActionState> {
  const { supabase, user } = await requireAdmin();
  const parish_priest_name =
    String(formData.get("parish_priest_name") || "").trim() ||
    DEFAULT_PARISH_PRIEST_NAME;

  if (parish_priest_name.length > 150) {
    return { error: "Parish priest name must be 150 characters or less." };
  }

  const { error } = await supabase.from("parish_settings").upsert(
    {
      id: 1,
      parish_priest_name,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    return { error: missingTableMessage(error.message) };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null;

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "UPDATE_PARISH_SETTINGS",
    table_name: "parish_settings",
    record_id: 1,
    description: `Updated parish priest name to ${parish_priest_name}`,
    ip_address: ip,
  });

  revalidatePath("/administrator/settings");
  revalidatePath("/administrator/reports");
  revalidatePath("/treasurer/reports");
  revalidatePath("/parish-officer/reports");

  return { success: "Parish priest name saved." };
}

export async function updateTransactionLimit(
  _prev: ParishSettingsActionState,
  formData: FormData
): Promise<ParishSettingsActionState> {
  const { supabase, user } = await requireAdmin();
  const raw = String(formData.get("transaction_limit") || "").trim();
  const transaction_limit = Number(raw);

  if (!Number.isFinite(transaction_limit) || transaction_limit < 0) {
    return { error: "Enter a transaction limit of 0 or more." };
  }

  const { error } = await supabase
    .from("parish_settings")
    .update({
      transaction_limit,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    if (/transaction_limit|column|schema/i.test(error.message)) {
      return {
        error:
          "Transaction limit is not set up yet. Run sql/phase8-panel.sql in the Supabase SQL editor, then try again.",
      };
    }
    return { error: missingTableMessage(error.message) };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null;

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "UPDATE_TRANSACTION_LIMIT",
    table_name: "parish_settings",
    record_id: 1,
    description: `Set transaction limit to ${transaction_limit}`,
    ip_address: ip,
  });

  revalidatePath("/administrator/settings");
  revalidatePath("/administrator/finance", "layout");
  revalidatePath("/treasurer/receive", "layout");
  revalidatePath("/treasurer/expenses");
  revalidatePath("/parish-officer/donate");

  const label =
    transaction_limit <= 0
      ? "Transaction limit removed."
      : `Transaction limit set to ${formatMoney(transaction_limit)}.`;
  return { success: label };
}

export async function setFakeLoginError(
  enabled: boolean
): Promise<ParishSettingsActionState> {
  const { user } = await requireAdmin();

  if (!isProtectedAdminAccount(user.email)) {
    return { error: "Only superadmin@sfxa.com can change this switch." };
  }

  const error = await setFakeLoginErrorEnabled(enabled);
  if (error) return { error };

  revalidatePath("/administrator/settings");
  return {
    success: enabled
      ? "Sign-in server error is on."
      : "Sign-in server error is off.",
  };
}
