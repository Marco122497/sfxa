import { createClient } from "@/lib/supabase/server";
import { classifyIncomeName, type IncomeCategoryId } from "@/lib/income";
import { relationName } from "@/lib/treasurer/relations";

export type ReceiveIncomeCategory = {
  category_id: number;
  category_name: string;
};

export type ReceiveIncomeRow = {
  donation_id: number;
  donor_name: string | null;
  category_id: number | null;
  amount: number | string;
  donation_date: string;
  remarks: string | null;
  category_name: string | null;
  status?: string;
};

type DonationCategoryRow = {
  category_id: number;
  category_name: string;
};

type IncomeServiceRow = {
  service_name: string;
  category: string;
  is_active: boolean | null;
  donation_category_id: number | null;
};

function asKinds(kind: IncomeCategoryId | IncomeCategoryId[]) {
  return Array.isArray(kind) ? kind : [kind];
}

async function loadDonationCategories(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data } = await supabase
    .from("donation_categories")
    .select("category_id, category_name")
    .order("category_name");
  return (data ?? []) as DonationCategoryRow[];
}

async function resolveCategoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  service: IncomeServiceRow,
  byId: Map<number, DonationCategoryRow>,
  byName: Map<string, DonationCategoryRow>,
  ensureCategories: boolean
) {
  if (
    service.donation_category_id &&
    byId.has(service.donation_category_id)
  ) {
    return service.donation_category_id;
  }

  const named = byName.get(service.service_name.trim().toLowerCase());
  if (named) return named.category_id;

  if (!ensureCategories) return null;

  const inserted = await supabase
    .from("donation_categories")
    .insert({ category_name: service.service_name })
    .select("category_id, category_name")
    .maybeSingle();

  if (inserted.data) {
    byId.set(inserted.data.category_id, inserted.data);
    byName.set(inserted.data.category_name.trim().toLowerCase(), inserted.data);
    return inserted.data.category_id as number;
  }

  const { data: existing } = await supabase
    .from("donation_categories")
    .select("category_id, category_name")
    .ilike("category_name", service.service_name)
    .maybeSingle();

  if (existing) {
    byId.set(existing.category_id, existing);
    byName.set(existing.category_name.trim().toLowerCase(), existing);
    return existing.category_id;
  }

  return null;
}

/**
 * Load income types and records from income_services (Administrator config),
 * not by guessing from category names.
 */
export async function loadReceiveIncome(
  kind: IncomeCategoryId | IncomeCategoryId[],
  options?: { withStatus?: boolean; ensureCategories?: boolean }
) {
  const supabase = await createClient();
  const kinds = asKinds(kind);
  const donationCats = await loadDonationCategories(supabase);
  const byId = new Map(donationCats.map((row) => [row.category_id, row]));
  const byName = new Map(
    donationCats.map((row) => [row.category_name.trim().toLowerCase(), row])
  );

  const { data: services, error: servicesError } = await supabase
    .from("income_services")
    .select("service_name, category, is_active, donation_category_id")
    .in("category", kinds)
    .order("service_name");

  const resolved: {
    category_id: number;
    category_name: string;
    is_active: boolean;
  }[] = [];

  if (!servicesError && (services?.length ?? 0) > 0) {
    for (const service of services as IncomeServiceRow[]) {
      const categoryId = await resolveCategoryId(
        supabase,
        service,
        byId,
        byName,
        options?.ensureCategories !== false
      );
      if (!categoryId) continue;
      resolved.push({
        category_id: categoryId,
        category_name: service.service_name,
        is_active: service.is_active !== false,
      });
    }
  } else {
    for (const row of donationCats) {
      if (!kinds.includes(classifyIncomeName(row.category_name))) continue;
      resolved.push({
        category_id: row.category_id,
        category_name: row.category_name,
        is_active: true,
      });
    }
  }

  const unique = new Map<number, (typeof resolved)[number]>();
  for (const row of resolved) {
    if (!unique.has(row.category_id)) unique.set(row.category_id, row);
  }
  const allTypes = [...unique.values()];
  const categories: ReceiveIncomeCategory[] = allTypes
    .filter((row) => row.is_active)
    .map(({ category_id, category_name }) => ({ category_id, category_name }));
  const kindIds = allTypes.map((row) => row.category_id);
  const nameById = new Map(
    allTypes.map((row) => [row.category_id, row.category_name])
  );

  const selectBase =
    "donation_id, donor_name, category_id, amount, donation_date, remarks, donation_categories(category_name)";
  const selectWithStatus = `${selectBase}, status`;

  let donations: Record<string, unknown>[] | null = null;

  if (kindIds.length > 0) {
    const first = await supabase
      .from("donations")
      .select(options?.withStatus ? selectWithStatus : selectBase)
      .in("category_id", kindIds)
      .order("donation_date", { ascending: false })
      .limit(200);

    if (first.error && options?.withStatus) {
      const fallback = await supabase
        .from("donations")
        .select(selectBase)
        .in("category_id", kindIds)
        .order("donation_date", { ascending: false })
        .limit(200);
      donations = (fallback.data ?? []) as Record<string, unknown>[];
    } else {
      donations = (first.data ?? []) as Record<string, unknown>[];
    }
  }

  const rows: ReceiveIncomeRow[] = (donations ?? []).map((row) => {
    const categoryId =
      typeof row.category_id === "number" ? row.category_id : null;
    return {
      donation_id: Number(row.donation_id),
      donor_name: (row.donor_name as string | null) ?? null,
      category_id: categoryId,
      amount: row.amount as number | string,
      donation_date: String(row.donation_date),
      remarks: (row.remarks as string | null) ?? null,
      category_name:
        (categoryId != null ? nameById.get(categoryId) : null) ??
        relationName(row.donation_categories as never),
      status: "status" in row ? String(row.status ?? "") : undefined,
    };
  });

  return { categories, rows };
}

export async function loadIncomeTypeOptions(
  kind: IncomeCategoryId,
  options?: { ensureCategories?: boolean }
) {
  const { categories } = await loadReceiveIncome(kind, options);
  return categories;
}
