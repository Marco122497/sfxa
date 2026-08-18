"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReservedFinanceKind } from "@/lib/income-categories";

export type IncomeCategoryActionState = {
  error?: string;
  success?: string;
};

function revalidateIncomeCategories() {
  revalidatePath("/administrator/categories");
  revalidatePath("/administrator/categories/income");
  revalidatePath("/administrator/categories/income-services");
  revalidatePath("/administrator/finance", "layout");
  revalidatePath("/treasurer/receive", "layout");
  revalidatePath("/", "layout");
}

async function getIp() {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null
  );
}

function toCategoryCode(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return slug || "category";
}

async function uniqueCategoryCode(
  supabase: ReturnType<typeof createAdminClient>,
  base: string
) {
  let code = base;
  let n = 2;
  if (isReservedFinanceKind(code)) {
    code = `${base}_${n}`;
    n += 1;
  }
  while (n < 50) {
    const { data } = await supabase
      .from("income_categories")
      .select("income_category_id")
      .eq("category_code", code)
      .maybeSingle();
    if (!data) return code;
    code = `${base}_${n}`;
    n += 1;
  }
  return `${base}_${Date.now()}`;
}

export async function createIncomeCategory(
  _prev: IncomeCategoryActionState,
  formData: FormData
): Promise<IncomeCategoryActionState> {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();
  const category_name = String(formData.get("category_name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;

  if (!category_name) {
    return { error: "Category name is required." };
  }

  const category_code = await uniqueCategoryCode(
    supabase,
    toCategoryCode(category_name)
  );

  const { data, error } = await supabase
    .from("income_categories")
    .insert({ category_code, category_name, description })
    .select("income_category_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "That income category name already exists." };
    }
    if (error.message.includes("does not exist")) {
      return {
        error: "Run sql/phase3-income-categories.sql in Supabase first.",
      };
    }
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "CREATE_INCOME_CATEGORY",
    table_name: "income_categories",
    record_id: data.income_category_id,
    description: `Created income category ${category_name}`,
    ip_address: await getIp(),
  });

  revalidateIncomeCategories();
  return { success: "Income category added." };
}

export async function updateIncomeCategory(
  _prev: IncomeCategoryActionState,
  formData: FormData
): Promise<IncomeCategoryActionState> {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();
  const income_category_id = Number(formData.get("income_category_id"));
  const category_name = String(formData.get("category_name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;

  if (!income_category_id || !category_name) {
    return { error: "Category name is required." };
  }

  const { error } = await supabase
    .from("income_categories")
    .update({ category_name, description })
    .eq("income_category_id", income_category_id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That income category name already exists." };
    }
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "UPDATE_INCOME_CATEGORY",
    table_name: "income_categories",
    record_id: income_category_id,
    description: `Updated income category ${category_name}`,
    ip_address: await getIp(),
  });

  revalidateIncomeCategories();
  return { success: "Income category updated." };
}

export async function deleteIncomeCategory(
  _prev: IncomeCategoryActionState,
  formData: FormData
): Promise<IncomeCategoryActionState> {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();
  const income_category_id = Number(formData.get("income_category_id"));
  if (!income_category_id) return { error: "Missing category." };

  const { data: existing } = await supabase
    .from("income_categories")
    .select("category_code, category_name")
    .eq("income_category_id", income_category_id)
    .maybeSingle();

  if (!existing) return { error: "Category not found." };

  const { count } = await supabase
    .from("income_services")
    .select("service_id", { count: "exact", head: true })
    .eq("category", existing.category_code);

  if ((count ?? 0) > 0) {
    return {
      error:
        "Cannot delete this category because income services still use it. Move or delete those services first.",
    };
  }

  const { error } = await supabase
    .from("income_categories")
    .delete()
    .eq("income_category_id", income_category_id);

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "DELETE_INCOME_CATEGORY",
    table_name: "income_categories",
    record_id: income_category_id,
    description: `Deleted income category ${existing.category_name}`,
    ip_address: await getIp(),
  });

  revalidateIncomeCategories();
  return { success: "Income category deleted." };
}
