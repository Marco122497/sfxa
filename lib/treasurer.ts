import {
  COLLECTION_CATEGORY_NAMES,
  isCollectionCategoryName,
  type CollectionCategoryName,
} from "@/lib/categories";

export const TREASURER_TABS = [
  { href: "/treasurer/donations", label: "Donations" },
  { href: "/treasurer/collections", label: "Collections" },
  { href: "/treasurer/expenses", label: "Expenses" },
] as const;

export type TreasurerTabHref = (typeof TREASURER_TABS)[number]["href"];

export { COLLECTION_CATEGORY_NAMES, isCollectionCategoryName };
export type { CollectionCategoryName };

export function resolveTreasurerTab(pathname: string): TreasurerTabHref {
  const match = TREASURER_TABS.find(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  );
  return match?.href ?? TREASURER_TABS[0].href;
}
