import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_TRANSACTION_LIMIT } from "@/lib/payments";

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

export async function getTransactionLimit(
  supabase: SupabaseClient
): Promise<number> {
  const { data, error } = await supabase
    .from("parish_settings")
    .select("transaction_limit")
    .eq("id", 1)
    .maybeSingle();

  if (error || data?.transaction_limit == null) {
    return DEFAULT_TRANSACTION_LIMIT;
  }

  const value = Number(data.transaction_limit);
  if (!Number.isFinite(value) || value < 0) {
    return DEFAULT_TRANSACTION_LIMIT;
  }
  return value;
}
