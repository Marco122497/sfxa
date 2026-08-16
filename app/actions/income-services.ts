"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ADDABLE_INCOME_CATEGORIES,
  isIncomeCategoryId,
  type IncomeCategoryId,
} from "@/lib/income";

export type IncomeServiceActionState = {
  error?: string;
  success?: string;
};

function isCategory(value: string): value is IncomeCategoryId {
  return (
    isIncomeCategoryId(value) &&
    ADDABLE_INCOME_CATEGORIES.some((item) => item.id === value)
  );
}

function revalidateIncomeConfig() {
  revalidatePath("/administrator/categories");
  revalidatePath("/administrator/categories/income");
  revalidatePath("/administrator/categories/income-services");
  revalidatePath("/administrator/income-services");
  revalidatePath("/treasurer/receive/collections");
  revalidatePath("/treasurer/receive/donations");
  revalidatePath("/treasurer/receive/services");
  revalidatePath("/treasurer/receive/other");
}

export async function createIncomeService(
  _prev: IncomeServiceActionState,
  formData: FormData
): Promise<IncomeServiceActionState> {
  await requireAdmin();
  const supabase = createAdminClient();
  const service_name = String(formData.get("service_name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  if (!service_name || !isCategory(category)) {
    return { error: "Name and category are required." };
  }

  const { data: existing } = await supabase
    .from("donation_categories")
    .select("category_id")
    .eq("category_name", service_name)
    .maybeSingle();

  let donation_category_id = existing?.category_id ?? null;
  if (!donation_category_id) {
    const inserted = await supabase
      .from("donation_categories")
      .insert({ category_name: service_name })
      .select("category_id")
      .single();
    donation_category_id = inserted.data?.category_id ?? null;
  }

  const { error } = await supabase.from("income_services").insert({
    service_name,
    category,
    is_active: true,
    donation_category_id,
  });
  if (error) {
    return {
      error: error.message.includes("does not exist")
        ? "Run sql/phase3-categories.sql in Supabase first."
        : error.message,
    };
  }
  revalidateIncomeConfig();
  return { success: "Income service added." };
}

export async function toggleIncomeService(
  _prev: IncomeServiceActionState,
  formData: FormData
): Promise<IncomeServiceActionState> {
  await requireAdmin();
  const supabase = createAdminClient();
  const service_id = Number(formData.get("service_id"));
  const is_active = String(formData.get("is_active") || "") === "1";
  if (!service_id) return { error: "Missing service." };
  const { error } = await supabase
    .from("income_services")
    .update({ is_active })
    .eq("service_id", service_id);
  if (error) return { error: error.message };
  revalidateIncomeConfig();
  return { success: is_active ? "Service activated." : "Service deactivated." };
}

export async function updateIncomeService(
  _prev: IncomeServiceActionState,
  formData: FormData
): Promise<IncomeServiceActionState> {
  await requireAdmin();
  const supabase = createAdminClient();
  const service_id = Number(formData.get("service_id"));
  const service_name = String(formData.get("service_name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  if (!service_id || !service_name || !isCategory(category)) {
    return { error: "Name and category are required." };
  }

  const { data: existing, error: loadError } = await supabase
    .from("income_services")
    .select("service_name, donation_category_id")
    .eq("service_id", service_id)
    .maybeSingle();

  if (loadError) return { error: loadError.message };
  if (!existing) return { error: "Service not found." };

  const { error } = await supabase
    .from("income_services")
    .update({ service_name, category })
    .eq("service_id", service_id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That income service name already exists." };
    }
    return { error: error.message };
  }

  if (
    existing.donation_category_id &&
    existing.service_name !== service_name
  ) {
    const renamed = await supabase
      .from("donation_categories")
      .update({ category_name: service_name })
      .eq("category_id", existing.donation_category_id);
    if (renamed.error && renamed.error.code !== "23505") {
      return { error: renamed.error.message };
    }
  }

  revalidateIncomeConfig();
  return { success: "Income service updated." };
}

export async function deleteIncomeService(
  _prev: IncomeServiceActionState,
  formData: FormData
): Promise<IncomeServiceActionState> {
  await requireAdmin();
  const supabase = createAdminClient();
  const service_id = Number(formData.get("service_id"));
  if (!service_id) return { error: "Missing service." };

  const { data: existing } = await supabase
    .from("income_services")
    .select("donation_category_id")
    .eq("service_id", service_id)
    .maybeSingle();

  if (existing?.donation_category_id) {
    const { count } = await supabase
      .from("donations")
      .select("donation_id", { count: "exact", head: true })
      .eq("category_id", existing.donation_category_id);
    if ((count ?? 0) > 0) {
      return {
        error:
          "Cannot delete this service because it is used by existing records. Deactivate it instead.",
      };
    }
  }

  const { error } = await supabase
    .from("income_services")
    .delete()
    .eq("service_id", service_id);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "Cannot delete this service because it is used by existing records. Deactivate it instead.",
      };
    }
    return { error: error.message };
  }

  revalidateIncomeConfig();
  return { success: "Income service deleted." };
}
