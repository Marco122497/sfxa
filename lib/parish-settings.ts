import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_PARISH_PRIEST_NAME = "Parish Priest";

export async function getParishPriestName(
  supabase: SupabaseClient
): Promise<string> {
  const { data, error } = await supabase
    .from("parish_settings")
    .select("parish_priest_name")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data?.parish_priest_name?.trim()) {
    return DEFAULT_PARISH_PRIEST_NAME;
  }

  return data.parish_priest_name.trim();
}
