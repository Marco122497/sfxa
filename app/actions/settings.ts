"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { DEFAULT_PARISH_PRIEST_NAME } from "@/lib/parish-settings";

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
