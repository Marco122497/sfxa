import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getRequestMeta() {
  const headerStore = await headers();
  return {
    ip:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerStore.get("x-real-ip") ||
      null,
    device: headerStore.get("user-agent") || null,
  };
}

export async function recordSuccessfulLogin(
  supabase: SupabaseClient,
  userId: string
) {
  const meta = await getRequestMeta();
  const now = new Date().toISOString();

  await supabase
    .from("profiles")
    .update({ last_login: now })
    .eq("id", userId);

  await supabase.from("login_history").insert({
    user_id: userId,
    login_time: now,
    ip_address: meta.ip,
    device_info: meta.device,
  });

  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "LOGIN",
    table_name: "profiles",
    description: "User signed in",
    ip_address: meta.ip,
  });
}

/** Map Google / OAuth metadata into profile name fields when still defaults. */
export function profileUpdatesFromAuthMetadata(
  profile: {
    first_name: string;
    last_name: string;
    full_name: string;
    profile_picture: string | null;
  },
  meta: Record<string, unknown> | undefined
) {
  if (!meta) return null;

  const updates: Record<string, string> = {};
  const fullName =
    String(meta.full_name || meta.name || meta.fullName || "").trim() || null;
  const given =
    String(meta.given_name || meta.first_name || "").trim() || null;
  const family =
    String(meta.family_name || meta.last_name || "").trim() || null;
  const picture =
    String(meta.avatar_url || meta.picture || "").trim() || null;

  const isDefaultName =
    profile.first_name === "User" && profile.last_name === "Account";

  if (isDefaultName) {
    if (given) updates.first_name = given;
    if (family) updates.last_name = family;
    if (!given && !family && fullName) {
      const parts = fullName.split(/\s+/);
      updates.first_name = parts[0] || profile.first_name;
      updates.last_name = parts.slice(1).join(" ") || profile.last_name;
    }
    if (fullName) {
      updates.full_name = fullName;
    } else if (updates.first_name || updates.last_name) {
      updates.full_name = [updates.first_name || profile.first_name, updates.last_name || profile.last_name]
        .filter(Boolean)
        .join(" ");
    }
  }

  if (!profile.profile_picture && picture) {
    updates.profile_picture = picture;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}
