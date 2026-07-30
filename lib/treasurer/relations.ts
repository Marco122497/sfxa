function relationName(
  value:
    | { category_name?: string; subcategory_name?: string }
    | { category_name?: string; subcategory_name?: string }[]
    | null,
  field: "category_name" | "subcategory_name" = "category_name"
) {
  if (Array.isArray(value)) return value[0]?.[field] ?? null;
  return value?.[field] ?? null;
}

export { relationName };
