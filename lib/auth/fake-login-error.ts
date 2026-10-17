import { isProtectedAdminAccount, type UserRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

const blockedRoles = new Set<UserRole>([
  "Administrator",
  "Treasurer",
  "Parish Officer",
]);

function missingColumn(message: string) {
  return /fake_login_error|schema cache|column/i.test(message);
}

export async function isFakeLoginErrorEnabled() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("parish_settings")
      .select("fake_login_error")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return false;
    return data.fake_login_error === true;
  } catch {
    return false;
  }
}

export async function setFakeLoginErrorEnabled(enabled: boolean) {
  try {
    const admin = createAdminClient();
    const updatedAt = new Date().toISOString();
    const { data, error } = await admin
      .from("parish_settings")
      .update({
        fake_login_error: enabled,
        updated_at: updatedAt,
      })
      .eq("id", 1)
      .select("id");

    if (error) {
      if (missingColumn(error.message)) {
        return "Sign-in error setting is missing. Run sql/phase7-parish-settings.sql in the Supabase SQL editor, then try again.";
      }
      return error.message;
    }

    if (!data?.length) {
      const { error: insertError } = await admin.from("parish_settings").insert({
        id: 1,
        parish_priest_name: "Parish Priest",
        fake_login_error: enabled,
        updated_at: updatedAt,
      });
      if (insertError) {
        if (missingColumn(insertError.message)) {
          return "Sign-in error setting is missing. Run sql/phase7-parish-settings.sql in the Supabase SQL editor, then try again.";
        }
        return insertError.message;
      }
    }

    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Could not save the switch.";
  }
}

export function isFakeLoginErrorTarget(
  role: string,
  email: string | null | undefined
) {
  if (isProtectedAdminAccount(email)) return false;
  return blockedRoles.has(role as UserRole);
}
