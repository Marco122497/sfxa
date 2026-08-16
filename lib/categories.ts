export const COLLECTION_CATEGORY_NAMES = [
  "Sunday Collection - 1st Mass",
  "Sunday Collection - 2nd Mass",
  "Special Collection",
  "Fiesta Collection",
  "Other Collection",
  "Regular Collection",
  "Sunday Offering",
  "Chapel Collection",
] as const;

export type CollectionCategoryName =
  (typeof COLLECTION_CATEGORY_NAMES)[number];

export function isCollectionCategoryName(name: string | null | undefined) {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return (
    COLLECTION_CATEGORY_NAMES.some(
      (item) => item.toLowerCase() === normalized
    ) ||
    normalized.includes("collection") ||
    normalized.includes("offering")
  );
}

export const CATEGORY_TABS = [
  {
    href: "/administrator/categories/income",
    label: "Income Categories",
    kind: "income" as const,
  },
  {
    href: "/administrator/categories/income-services",
    label: "Income Services",
    kind: "income-services" as const,
  },
  {
    href: "/administrator/categories/expenses",
    label: "Expense Categories",
    kind: "expense" as const,
  },
] as const;

export type CategoryTabHref = (typeof CATEGORY_TABS)[number]["href"];

export function resolveCategoryTab(pathname: string): CategoryTabHref {
  const match = CATEGORY_TABS.find(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  );
  return match?.href ?? CATEGORY_TABS[0].href;
}
