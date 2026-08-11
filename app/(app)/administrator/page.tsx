import {
  BanknoteIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  ShoppingBasketIcon,
  UsersIcon,
  WalletCardsIcon,
  WalletIcon,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { formatMoney } from "@/lib/format";
import {
  IncomeExpenseBarChart,
  ExpensesByCategoryPieChart,
} from "@/components/administrator/dashboard-charts";
import {
  RecentFinancialActivitiesTable,
  RecentUserActivitiesTable,
} from "@/components/administrator/dashboard-activity-tables";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdministratorDashboardPage() {
  const { profile } = await requireAdmin();
  const {
    stats,
    monthlySummary,
    expensesByCategory,
    recentFinancialActivities,
    recentUserActivities,
  } = await getAdminDashboardData();

  const cards = [
    {
      title: "Total Donations",
      value: formatMoney(stats.totalDonations),
      icon: HandCoinsIcon,
    },
    {
      title: "Total Collections",
      value: formatMoney(stats.totalCollections),
      icon: ShoppingBasketIcon,
    },
    {
      title: "Total Expenses",
      value: formatMoney(stats.totalExpenses),
      icon: WalletCardsIcon,
    },
    {
      title: "Current Balance",
      value: formatMoney(stats.currentBalance),
      icon: BanknoteIcon,
    },
    {
      title: "Remaining Budget",
      value: formatMoney(stats.remainingBudget),
      icon: WalletIcon,
    },
    {
      title: "Total Users",
      value: String(stats.totalUsers),
      description: `${stats.activeUsers} active`,
      icon: UsersIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
            <LayoutDashboardIcon className="size-4" aria-hidden />
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            Administrator Dashboard
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Overall financial and system overview for {profile.first_name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {card.value}
              </div>
              {"description" in card && card.description ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Income vs. Expenses</CardTitle>
            <CardDescription>
              Monthly income vs. expenses — illustrative comparison of parish
              income and expenses by month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeExpenseBarChart data={monthlySummary} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>
              Where parish funds are being spent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesByCategoryPieChart data={expensesByCategory} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Financial Activities</CardTitle>
            <CardDescription>
              Latest donations, collections, expenses, and budget changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentFinancialActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No financial activity yet.
              </p>
            ) : (
              <RecentFinancialActivitiesTable
                rows={recentFinancialActivities}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent User Activities</CardTitle>
            <CardDescription>
              Latest actions recorded in the audit trail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentUserActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No user activity yet.
              </p>
            ) : (
              <RecentUserActivitiesTable rows={recentUserActivities} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
