import { isCollectionCategoryName } from "@/lib/categories";

export const INCOME_CATEGORIES = [
  {
    id: "donation",
    label: "Donations",
    description:
      "Money given freely to the parish, including general, special, thanksgiving, and ministry support.",
  },
  {
    id: "collection",
    label: "Collections / Offerings",
    description:
      "Offerings collected during masses and chapel services, including regular, Sunday, special, and chapel collections.",
  },
  {
    id: "church_service",
    label: "Church Services",
    description:
      "Income from sacramental and parish services. Individual services are configurable by the Administrator.",
  },
  {
    id: "other_income",
    label: "Other Income",
    description:
      "Receipts that are not donations, collections, or church services, such as fundraising.",
  },
] as const;

export type IncomeCategoryId = (typeof INCOME_CATEGORIES)[number]["id"];

/** All income classifications can have configurable services. */
export const ADDABLE_INCOME_CATEGORIES = INCOME_CATEGORIES;

export const CHURCH_SERVICE_NAMES = [
  "Baptism",
  "Confirmation",
  "Wedding",
  "Funeral",
  "Mass Intention",
  "Blessing",
  "Other Church Service",
  "Other Sacramental Services",
] as const;

export const OTHER_INCOME_NAMES = [
  "Fundraising",
  "Facility Rental",
  "Sale of Religious Items",
  "Other Income",
  "Other Receipts",
] as const;

export function isIncomeCategoryId(value: string): value is IncomeCategoryId {
  return INCOME_CATEGORIES.some((item) => item.id === value);
}

export function classifyIncomeName(
  name: string | null | undefined
): IncomeCategoryId {
  if (!name) return "donation";
  const normalized = name.trim().toLowerCase();
  if (
    isCollectionCategoryName(name) ||
    normalized.includes("offering") ||
    normalized.includes("collection")
  ) {
    return "collection";
  }
  if (
    CHURCH_SERVICE_NAMES.some((item) => item.toLowerCase() === normalized) ||
    normalized.includes("baptism") ||
    normalized.includes("wedding") ||
    normalized.includes("funeral") ||
    normalized.includes("mass intention") ||
    normalized.includes("blessing")
  ) {
    return "church_service";
  }
  if (
    OTHER_INCOME_NAMES.some((item) => item.toLowerCase() === normalized) ||
    normalized.includes("fundraising") ||
    normalized.includes("rental")
  ) {
    return "other_income";
  }
  return "donation";
}

export function incomeCategoryLabel(id: string) {
  return (
    INCOME_CATEGORIES.find((item) => item.id === id)?.label ?? id
  );
}

export function incomeCategoryDescription(id: IncomeCategoryId) {
  return (
    INCOME_CATEGORIES.find((item) => item.id === id)?.description ?? ""
  );
}

export function filterByIncomeKind<T extends { category_name?: string | null }>(
  rows: T[],
  kind: IncomeCategoryId
) {
  return rows.filter(
    (row) => classifyIncomeName(row.category_name) === kind
  );
}

export function displayRoleName(role: string | null | undefined) {
  if (role === "Parish Officer") return "Parish Member";
  return role || "—";
}
