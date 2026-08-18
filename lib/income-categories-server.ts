import { createClient } from "@/lib/supabase/server";
import { classifyIncomeName } from "@/lib/income";
import {
  FALLBACK_INCOME_CATEGORIES,
  type IncomeCategoryRecord,
} from "@/lib/income-categories";

export async function loadIncomeCategories(): Promise<IncomeCategoryRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income_categories")
    .select("category_code, category_name, description")
    .order("income_category_id");

  if (error || !data?.length) {
    return FALLBACK_INCOME_CATEGORIES;
  }

  return data.map((row) => ({
    code: row.category_code,
    name: row.category_name,
    description: row.description,
  }));
}

export async function loadIncomeKindLookup() {
  const categories = await loadIncomeCategories();
  const nameByCode = new Map(categories.map((item) => [item.code, item.name]));
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("income_services")
    .select("service_name, category, donation_category_id");

  const labelByCategoryId = new Map<number, string>();
  const labelByServiceName = new Map<string, string>();

  for (const row of services ?? []) {
    const label = nameByCode.get(row.category) ?? row.category;
    if (typeof row.donation_category_id === "number") {
      labelByCategoryId.set(row.donation_category_id, label);
    }
    if (row.service_name) {
      labelByServiceName.set(row.service_name.trim().toLowerCase(), label);
    }
  }

  function labelFor(name: string | null | undefined, categoryId?: number | null) {
    if (categoryId != null && labelByCategoryId.has(categoryId)) {
      return labelByCategoryId.get(categoryId)!;
    }
    const key = name?.trim().toLowerCase() ?? "";
    if (key && labelByServiceName.has(key)) {
      return labelByServiceName.get(key)!;
    }
    const classified = classifyIncomeName(name);
    return nameByCode.get(classified) ?? classified;
  }

  return { categories, labelFor };
}
