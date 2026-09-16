import type { SupabaseClient } from "@supabase/supabase-js";

import {
  classifyIncomeName,
  isIncomeCategoryId,
  type IncomeCategoryId,
} from "@/lib/income";

export type IncomeKindFor = (
  name?: string | null,
  categoryId?: number | null
) => IncomeCategoryId;

/**
 * Prefer Administrator-configured income_services.category over name guessing.
 * Baptism listed under Collections / Offerings is a collection, not a church service.
 */
export async function loadIncomeKindFor(
  supabase: SupabaseClient
): Promise<IncomeKindFor> {
  const { data } = await supabase
    .from("income_services")
    .select("service_name, category, donation_category_id");

  const byId = new Map<number, IncomeCategoryId>();
  const byName = new Map<string, IncomeCategoryId>();

  for (const row of data ?? []) {
    const kind = isIncomeCategoryId(row.category)
      ? row.category
      : classifyIncomeName(row.service_name);
    if (typeof row.donation_category_id === "number") {
      byId.set(row.donation_category_id, kind);
    }
    if (row.service_name) {
      byName.set(row.service_name.trim().toLowerCase(), kind);
    }
  }

  return (name, categoryId) => {
    if (categoryId != null && byId.has(categoryId)) {
      return byId.get(categoryId)!;
    }
    const key = name?.trim().toLowerCase() ?? "";
    if (key && byName.has(key)) return byName.get(key)!;
    return classifyIncomeName(name);
  };
}
