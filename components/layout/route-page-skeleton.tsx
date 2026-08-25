import {
  AdminDashboardSkeleton,
  AnnouncementManagerSkeleton,
  AuditPageSkeleton,
  BudgetAllocationSkeleton,
  BudgetMonitoringSkeleton,
  CashFlowPageSkeleton,
  ExpensesPageSkeleton,
  FormPageSkeleton,
  IncomeOverviewSkeleton,
  ParishDashboardSkeleton,
  ParishListSkeleton,
  ReceiveFundsSkeleton,
  ReportsPageSkeleton,
  SettingsPageSkeleton,
  TableManagerSkeleton,
  TreasurerDashboardSkeleton,
  UsersPageSkeleton,
  ViewTableSkeleton,
} from "@/components/layout/page-skeletons";

function normalizeHref(href: string) {
  const path = href.split("?")[0] ?? href;
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path || "/";
}

export function RoutePageSkeleton({ href }: { href: string }) {
  const path = normalizeHref(href);

  if (path === "/administrator") return <AdminDashboardSkeleton />;
  if (path === "/treasurer") return <TreasurerDashboardSkeleton />;
  if (path === "/parish-officer") {
    return <ParishDashboardSkeleton />;
  }

  if (path.endsWith("/reports")) return <ReportsPageSkeleton />;
  if (path.endsWith("/cash-flow") || path.endsWith("/statements")) {
    return <CashFlowPageSkeleton />;
  }

  if (path === "/administrator/settings") return <SettingsPageSkeleton />;
  if (path === "/administrator/audit") return <AuditPageSkeleton />;
  if (path === "/administrator/users" || path.startsWith("/administrator/users/")) {
    return <UsersPageSkeleton />;
  }

  if (
    path === "/administrator/finance/expenses" ||
    path === "/treasurer/expenses" ||
    path === "/treasurer/release/expenses"
  ) {
    return <ExpensesPageSkeleton />;
  }

  if (path === "/administrator/finance/income") {
    return <IncomeOverviewSkeleton />;
  }

  if (path === "/treasurer/budgets/monitoring") {
    return <BudgetMonitoringSkeleton cards={4} />;
  }

  if (
    path === "/administrator/finance/budgets" ||
    path === "/parish-officer/budget"
  ) {
    return <BudgetMonitoringSkeleton />;
  }

  if (path === "/treasurer/budgets/allocation") {
    return <BudgetAllocationSkeleton />;
  }

  if (
    path.startsWith("/treasurer/receive/") ||
    (path.startsWith("/administrator/finance/") &&
      !path.endsWith("/finance"))
  ) {
    return <ReceiveFundsSkeleton />;
  }

  if (path.startsWith("/administrator/categories/")) {
    return <TableManagerSkeleton />;
  }

  if (
    path === "/administrator/parish/activities" ||
    path === "/administrator/parish/notices" ||
    path === "/administrator/announcements"
  ) {
    return <AnnouncementManagerSkeleton />;
  }

  if (path === "/treasurer/parish-info") {
    return <ParishListSkeleton columns={2} />;
  }

  if (
    path === "/parish-officer/activities" ||
    path === "/parish-officer/notices" ||
    path === "/parish-officer/parish-info"
  ) {
    return <ParishListSkeleton />;
  }

  if (
    path === "/parish-officer/expenses" ||
    path === "/parish-officer/donations" ||
    path === "/parish-officer/collections"
  ) {
    return <ViewTableSkeleton />;
  }

  if (path === "/profile" || path === "/change-password") {
    return <FormPageSkeleton />;
  }

  if (path.includes("/budgets/history") || path.includes("/budgets/categories")) {
    return <TableManagerSkeleton action={false} />;
  }

  return <TableManagerSkeleton />;
}
