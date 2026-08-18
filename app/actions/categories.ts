"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireAdmin, requireRole } from "@/lib/auth/session";
import { isCollectionCategoryName } from "@/lib/categories";

export type CategoryActionState = {
  error?: string;
  success?: string;
};

export type CategoryKind = "donation" | "collection" | "expense" | "budget";

const KIND_CONFIG = {
  donation: {
    table: "donation_categories",
    idColumn: "category_id",
    label: "Donation type",
  },
  collection: {
    table: "donation_categories",
    idColumn: "category_id",
    label: "Collection type",
  },
  expense: {
    table: "expense_categories",
    idColumn: "expense_category_id",
    label: "General expense category",
  },
  budget: {
    table: "budget_categories",
    idColumn: "budget_category_id",
    label: "Budget category",
  },
} as const;

function isCategoryKind(value: string): value is CategoryKind {
  return (
    value === "donation" ||
    value === "collection" ||
    value === "expense" ||
    value === "budget"
  );
}

async function requireCategoryAccess(kind: CategoryKind) {
  if (kind === "budget") {
    return {
      error:
        "Budget categories are managed under Expense Categories (general categories).",
    } as const;
  }
  if (kind === "donation" || kind === "expense") {
    return requireRole(["Administrator", "Treasurer"]);
  }
  return requireAdmin();
}

async function getIp() {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null
  );
}

function revalidateCategories() {
  revalidatePath("/administrator/categories");
  revalidatePath("/administrator/categories/income");
  revalidatePath("/administrator/categories/income-services");
  revalidatePath("/administrator/categories/expenses");
  revalidatePath("/administrator/categories/budgets");
  revalidatePath("/treasurer/donations");
  revalidatePath("/treasurer/collections");
  revalidatePath("/treasurer/receive", "layout");
  revalidatePath("/treasurer/expenses");
  revalidatePath("/treasurer/budgets");
  revalidatePath("/treasurer/budgets/categories");
  revalidatePath("/treasurer/budgets/allocation");
  revalidatePath("/treasurer/budgets/monitoring");
  revalidatePath("/treasurer/budgets/history");
}

function validateCategoryName(kind: CategoryKind, category_name: string) {
  if (kind === "donation" && isCollectionCategoryName(category_name)) {
    return "Collection types belong under Collection categories. Use a donation type name instead.";
  }
  if (kind === "collection" && !isCollectionCategoryName(category_name)) {
    return 'Collection type names should include "Collection" (e.g. Youth Collection).';
  }
  return null;
}

/** General expense categories drive budget allocation categories by name. */
async function syncBudgetCategoryFromExpense(
  supabase: Awaited<ReturnType<typeof requireRole>>["supabase"],
  category_name: string,
  previousName?: string
) {
  if (previousName && previousName !== category_name) {
    await supabase
      .from("budget_categories")
      .update({ category_name })
      .eq("category_name", previousName);
  }
  await supabase
    .from("budget_categories")
    .upsert({ category_name }, { onConflict: "category_name", ignoreDuplicates: true });
}

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const kindRaw = String(formData.get("kind") || "");
  if (!isCategoryKind(kindRaw)) {
    return { error: "Invalid category type." };
  }

  const access = await requireCategoryAccess(kindRaw);
  if ("error" in access) return { error: access.error };
  const { supabase, user } = access;

  const category_name = String(formData.get("category_name") || "").trim();

  if (!category_name) {
    return { error: "Category name is required." };
  }

  const nameError = validateCategoryName(kindRaw, category_name);
  if (nameError) {
    return { error: nameError };
  }

  const config = KIND_CONFIG[kindRaw];
  const { data, error } = await supabase
    .from(config.table)
    .insert({ category_name })
    .select(config.idColumn)
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "That category name already exists." };
    }
    return { error: error.message };
  }

  if (kindRaw === "expense") {
    await syncBudgetCategoryFromExpense(supabase, category_name);
  }

  const recordId = Number(
    (data as Record<string, number | null>)[config.idColumn]
  );

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "CREATE_CATEGORY",
    table_name: config.table,
    record_id: recordId || null,
    description: `Created ${config.label}: ${category_name}`,
    ip_address: await getIp(),
  });

  revalidateCategories();
  return { success: `${config.label} added.` };
}

export async function updateCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const kindRaw = String(formData.get("kind") || "");
  const categoryId = Number(formData.get("category_id"));
  const category_name = String(formData.get("category_name") || "").trim();

  if (!isCategoryKind(kindRaw) || !categoryId) {
    return { error: "Invalid category." };
  }

  const access = await requireCategoryAccess(kindRaw);
  if ("error" in access) return { error: access.error };
  const { supabase, user } = access;

  if (!category_name) {
    return { error: "Category name is required." };
  }

  const nameError = validateCategoryName(kindRaw, category_name);
  if (nameError) {
    return { error: nameError };
  }

  const config = KIND_CONFIG[kindRaw];
  let previousName: string | undefined;

  if (kindRaw === "expense") {
    const { data: existing } = await supabase
      .from("expense_categories")
      .select("category_name")
      .eq("expense_category_id", categoryId)
      .maybeSingle();
    previousName = existing?.category_name;
  }

  const { error } = await supabase
    .from(config.table)
    .update({ category_name })
    .eq(config.idColumn, categoryId);

  if (error) {
    if (error.code === "23505") {
      return { error: "That category name already exists." };
    }
    return { error: error.message };
  }

  if (kindRaw === "expense") {
    await syncBudgetCategoryFromExpense(supabase, category_name, previousName);
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "UPDATE_CATEGORY",
    table_name: config.table,
    record_id: categoryId,
    description: `Updated ${config.label} #${categoryId} to ${category_name}`,
    ip_address: await getIp(),
  });

  revalidateCategories();
  return { success: `${config.label} updated.` };
}

export async function deleteCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const kindRaw = String(formData.get("kind") || "");
  const categoryId = Number(formData.get("category_id"));

  if (!isCategoryKind(kindRaw) || !categoryId) {
    return { error: "Invalid category." };
  }

  const access = await requireCategoryAccess(kindRaw);
  if ("error" in access) return { error: access.error };
  const { supabase, user } = access;
  const config = KIND_CONFIG[kindRaw];

  let categoryName: string | undefined;
  if (kindRaw === "expense") {
    const { data: existing } = await supabase
      .from("expense_categories")
      .select("category_name")
      .eq("expense_category_id", categoryId)
      .maybeSingle();
    categoryName = existing?.category_name;
  }

  const { error } = await supabase
    .from(config.table)
    .delete()
    .eq(config.idColumn, categoryId);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "Cannot delete this category because it is used by existing records.",
      };
    }
    return { error: error.message };
  }

  if (kindRaw === "expense" && categoryName) {
    await supabase
      .from("budget_categories")
      .delete()
      .eq("category_name", categoryName);
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "DELETE_CATEGORY",
    table_name: config.table,
    record_id: categoryId,
    description: `Deleted ${config.label} #${categoryId}`,
    ip_address: await getIp(),
  });

  revalidateCategories();
  return { success: `${config.label} deleted.` };
}

export async function createExpenseSubcategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const { supabase, user } = await requireRole(["Administrator", "Treasurer"]);
  const expense_category_id = Number(formData.get("expense_category_id"));
  const subcategory_name = String(
    formData.get("subcategory_name") || ""
  ).trim();

  if (!expense_category_id || !subcategory_name) {
    return {
      error: "Choose a general category and enter a specific category name.",
    };
  }

  const { data, error } = await supabase
    .from("expense_subcategories")
    .insert({ expense_category_id, subcategory_name })
    .select("subcategory_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "That specific category already exists under this general category.",
      };
    }
    if (/relation|does not exist|expense_subcategories/i.test(error.message)) {
      return {
        error:
          "Specific categories table is missing. Run sql/phase3-categories.sql in Supabase.",
      };
    }
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "CREATE_EXPENSE_SUBCATEGORY",
    table_name: "expense_subcategories",
    record_id: data.subcategory_id,
    description: `Created specific expense category: ${subcategory_name}`,
    ip_address: await getIp(),
  });

  revalidateCategories();
  return { success: "Specific category added." };
}

export async function updateExpenseSubcategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const { supabase, user } = await requireRole(["Administrator", "Treasurer"]);
  const subcategory_id = Number(formData.get("subcategory_id"));
  const subcategory_name = String(
    formData.get("subcategory_name") || ""
  ).trim();

  if (!subcategory_id || !subcategory_name) {
    return { error: "Specific category name is required." };
  }

  const { error } = await supabase
    .from("expense_subcategories")
    .update({ subcategory_name })
    .eq("subcategory_id", subcategory_id);

  if (error) {
    if (error.code === "23505") {
      return {
        error: "That specific category already exists under this general category.",
      };
    }
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "UPDATE_EXPENSE_SUBCATEGORY",
    table_name: "expense_subcategories",
    record_id: subcategory_id,
    description: `Updated specific category #${subcategory_id} to ${subcategory_name}`,
    ip_address: await getIp(),
  });

  revalidateCategories();
  return { success: "Specific category updated." };
}

export async function deleteExpenseSubcategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const { supabase, user } = await requireRole(["Administrator", "Treasurer"]);
  const subcategory_id = Number(formData.get("subcategory_id"));

  if (!subcategory_id) {
    return { error: "Invalid specific category." };
  }

  const { error } = await supabase
    .from("expense_subcategories")
    .delete()
    .eq("subcategory_id", subcategory_id);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "Cannot delete this category because it is used by existing expense records.",
      };
    }
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "DELETE_EXPENSE_SUBCATEGORY",
    table_name: "expense_subcategories",
    record_id: subcategory_id,
    description: `Deleted specific category #${subcategory_id}`,
    ip_address: await getIp(),
  });

  revalidateCategories();
  return { success: "Specific category deleted." };
}
