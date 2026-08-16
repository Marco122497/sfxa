import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  BanknoteIcon,
  LayoutDashboardIcon,
  ReceiptIcon,
  ScaleIcon,
  WalletIcon,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import {
  getCashFlowStatement,
  getIncomeSourceSlices,
  getMonthlyCashFlow,
} from "@/lib/cash-flow";
import { formatMoney } from "@/lib/format";
import {
  CashFlowBarChart,
  IncomeSourcesPieChart,
} from "@/components/finance/cash-flow-charts";
import { CashFlowStatementView } from "@/components/finance/cash-flow-statement-view";
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
  const [
    { recentFinancialActivities, recentUserActivities },
    statement,
    monthly,
    sources,
  ] = await Promise.all([
    getAdminDashboardData(),
    getCashFlowStatement(),
    getMonthlyCashFlow(),
    getIncomeSourceSlices(),
  ]);

  const cards = [
    {
      title: "Total Income",
      value: formatMoney(statement.totalInflows),
      icon: WalletIcon,
    },
    {
      title: "Total Expenses",
      value: formatMoney(statement.totalOutflows),
      icon: ReceiptIcon,
    },
    {
      title: "Cash Inflow",
      value: formatMoney(statement.totalInflows),
      icon: ArrowDownToLineIcon,
    },
    {
      title: "Cash Outflow",
      value: formatMoney(statement.totalOutflows),
      icon: ArrowUpFromLineIcon,
    },
    {
      title: "Net Cash Flow",
      value: formatMoney(statement.netCashFlow),
      icon: ScaleIcon,
    },
    {
      title: "Current Balance",
      value: formatMoney(statement.endingBalance),
      icon: BanknoteIcon,
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
          Overall financial summary for {profile.first_name}: income, expenses,
          cash flow, and current balance.
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>
              Cash inflow, outflow, and net cash flow by month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CashFlowBarChart data={monthly} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
            <CardDescription>
              Donations, collections, church services, and other income.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeSourcesPieChart data={sources} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statement summary</CardTitle>
          <CardDescription>
            Statement of Cash Flows for the current month. Open the full
            statement for line-item detail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowStatementView
            statement={statement}
            compact
            fullHref="/administrator/statements"
          />
        </CardContent>
      </Card>

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
