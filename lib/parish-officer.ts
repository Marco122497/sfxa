export const PARISH_VIEW_TABS = [
  { href: "/parish-officer/donations", label: "Donations" },
  { href: "/parish-officer/collections", label: "Collections" },
  { href: "/parish-officer/expenses", label: "Expenses" },
  { href: "/parish-officer/budget", label: "Budget" },
] as const;

export type ParishViewTabHref = (typeof PARISH_VIEW_TABS)[number]["href"];

export function resolveParishViewTab(pathname: string): ParishViewTabHref {
  const match = PARISH_VIEW_TABS.find(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  );
  return match?.href ?? PARISH_VIEW_TABS[0].href;
}
