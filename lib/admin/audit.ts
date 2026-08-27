export const AUDIT_PAGE_SIZES = [10, 25, 50, 100] as const;

export type AuditTab = "logins" | "activity" | "transactions";

export const AUDIT_TABS: { id: AuditTab; label: string }[] = [
  { id: "logins", label: "Login History" },
  { id: "activity", label: "User Activities" },
  { id: "transactions", label: "Transaction History" },
];

export function parseAuditTab(value?: string): AuditTab {
  if (value === "logins" || value === "transactions" || value === "activity") {
    return value;
  }
  return "activity";
}

export function parseAuditPage(value?: string) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function parseAuditPerPage(value?: string) {
  const n = Number(value);
  return (AUDIT_PAGE_SIZES as readonly number[]).includes(n) ? n : 25;
}

export function auditTabHref(tab: AuditTab) {
  return `/administrator/audit?tab=${tab}&page=1&perPage=25`;
}
