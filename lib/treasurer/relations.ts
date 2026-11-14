import { formatTypeLabel } from "@/lib/income-access";

function relationName(
  value:
    | { category_name?: string; subcategory_name?: string }
    | { category_name?: string; subcategory_name?: string }[]
    | null,
  field: "category_name" | "subcategory_name" = "category_name"
) {
  const raw = Array.isArray(value) ? value[0]?.[field] : value?.[field];
  if (!raw) return null;
  return formatTypeLabel(raw);
}

export { relationName };
