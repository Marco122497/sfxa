"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  formatIncomeServiceName,
  isIncomeAccessType,
} from "@/lib/income-access";
import {
  ADDABLE_INCOME_CATEGORIES,
  isIncomeCategoryId,
  type IncomeCategoryId,
} from "@/lib/income";
import { currentParishDateTime } from "@/lib/format";
import { feeSchemaMessage, type FeeYearAdjustment } from "@/lib/service-fees";

export type IncomeServiceActionState = {
  error?: string;
  success?: string;
};

function isLegacyCategory(value: string): value is IncomeCategoryId {
  return (
    isIncomeCategoryId(value) &&
    ADDABLE_INCOME_CATEGORIES.some((item) => item.id === value)
  );
}

async function isKnownCategory(
  supabase: ReturnType<typeof createAdminClient>,
  value: string
) {
  if (!value) return false;
  const { data, error } = await supabase
    .from("income_categories")
    .select("category_code")
    .eq("category_code", value)
    .maybeSingle();
  if (!error) return Boolean(data);
  return isLegacyCategory(value);
}

function parseFeeYears(raw: string): FeeYearAdjustment[] | { error: string } {
  if (!raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Year fee adjustments could not be read." };
  }
  if (!Array.isArray(parsed)) return [];
  const years = new Set<number>();
  const rows: FeeYearAdjustment[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const year = Number((item as { year?: unknown }).year);
    const adjustment = Number((item as { adjustment?: unknown }).adjustment);
    const currentYear = Number(currentParishDateTime().date.slice(0, 4));
    if (!Number.isInteger(year) || year <= currentYear || year > 2100) {
      return { error: `Each fee year must be after ${currentYear}.` };
    }
    if (!Number.isFinite(adjustment)) {
      return { error: "Each year adjustment must be a number. Use a minus for a lower fee." };
    }
    if (years.has(year)) return { error: `The year ${year} is listed more than once.` };
    years.add(year);
    rows.push({ year, adjustment: Math.round(adjustment * 100) / 100 });
  }
  return rows;
}

async function saveChurchFee(
  supabase: ReturnType<typeof createAdminClient>,
  serviceId: number,
  category: string,
  formData: FormData
) {
  if (category !== "church_service") {
    const cleared = await supabase
      .from("income_services")
      .update({ standard_amount: null })
      .eq("service_id", serviceId);
    if (cleared.error && !feeSchemaMessage(cleared.error.message)) {
      return cleared.error.message;
    }
    await supabase.from("service_fee_years").delete().eq("service_id", serviceId);
    return null;
  }

  const standard = Number(String(formData.get("standard_amount") || "").trim());
  if (!Number.isFinite(standard) || standard <= 0) {
    return "Enter the standard fee for this church service. Payments use it automatically.";
  }
  const years = parseFeeYears(String(formData.get("fee_years") || "[]"));
  if ("error" in years) return years.error;

  const saved = await supabase
    .from("income_services")
    .update({ standard_amount: standard })
    .eq("service_id", serviceId);
  if (saved.error) {
    return feeSchemaMessage(saved.error.message) ?? saved.error.message;
  }

  const removed = await supabase
    .from("service_fee_years")
    .delete()
    .eq("service_id", serviceId);
  if (removed.error) {
    return feeSchemaMessage(removed.error.message) ?? removed.error.message;
  }
  if (years.length === 0) return null;

  const inserted = await supabase.from("service_fee_years").insert(
    years.map((row) => ({
      service_id: serviceId,
      fee_year: row.year,
      adjustment: row.adjustment,
    }))
  );
  if (inserted.error) {
    return feeSchemaMessage(inserted.error.message) ?? inserted.error.message;
  }
  return null;
}

function revalidateIncomeConfig() {
  revalidatePath("/administrator/categories");
  revalidatePath("/administrator/categories/income");
  revalidatePath("/administrator/categories/income-services");
  revalidatePath("/administrator/income-services");
  revalidatePath("/administrator/finance", "layout");
  revalidatePath("/treasurer/receive", "layout");
}

export async function createIncomeService(
  _prev: IncomeServiceActionState,
  formData: FormData
): Promise<IncomeServiceActionState> {
  await requireAdmin();
  const supabase = createAdminClient();
  const rawName = String(formData.get("service_name") || "").trim();
  const accessType = String(formData.get("access_type") || "").trim();
  const category = String(formData.get("category") || "").trim();
  if (!isIncomeAccessType(accessType)) {
    return { error: "Choose whether this service is public, private, or not specified." };
  }
  const service_name = formatIncomeServiceName(rawName, accessType);
  if (!service_name || !(await isKnownCategory(supabase, category))) {
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

  const { data: created, error } = await supabase
    .from("income_services")
    .insert({
      service_name,
      category,
      is_active: true,
      donation_category_id,
    })
    .select("service_id")
    .single();
  if (error || !created) {
    return {
      error: error?.code === "23505"
        ? "That income service already exists."
        : error?.message.includes("does not exist")
          ? "Run sql/phase3-categories.sql in Supabase first."
        : error?.message || "Could not add the income service.",
    };
  }
  const feeError = await saveChurchFee(supabase, created.service_id, category, formData);
  if (feeError) return { error: feeError };
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
  const rawName = String(formData.get("service_name") || "").trim();
  const accessType = String(formData.get("access_type") || "").trim();
  const category = String(formData.get("category") || "").trim();
  if (!isIncomeAccessType(accessType)) {
    return { error: "Choose whether this service is public, private, or not specified." };
  }
  const service_name = formatIncomeServiceName(rawName, accessType);
  if (!service_id || !service_name || !(await isKnownCategory(supabase, category))) {
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

  const feeError = await saveChurchFee(supabase, service_id, category, formData);
  if (feeError) return { error: feeError };

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
          "Cannot delete this service because it has transactions.",
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
          "Cannot delete this service because it has transactions.",
      };
    }
    return { error: error.message };
  }

  revalidateIncomeConfig();
  return { success: "Income service deleted." };
}
