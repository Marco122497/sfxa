import {
  BanknoteIcon,
  LayoutDashboardIcon,
  PiggyBankIcon,
  ReceiptIcon,
  ScaleIcon,
  WalletIcon,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { getBudgetModuleData } from "@/lib/treasurer/budget-data";
import {
  getCashFlowStatement,
  getIncomeSourceSlices,
  getDailyCashFlow,
} from "@/lib/cash-flow";
import { formatMoney } from "@/lib/format";
import {
  CashFlowLineChart,
  IncomeSourcesPieChart,
} from "@/components/finance/cash-flow-charts";
import { CashFlowStatementView } from "@/components/finance/cash-flow-statement-view";
import {
  RecentFinancialActivitiesTable,
  RecentUserActivitiesTable,
} from "@/components/administrator/dashboard-activity-tables";
import { PageHeading } from "@/components/layout/page-heading";
import { SummaryStatCard } from "@/components/layout/summary-stat-card";
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
    daily,
    sources,
    budget,
  ] = await Promise.all([
    getAdminDashboardData(),
    getCashFlowStatement(),
    getDailyCashFlow(),
    getIncomeSourceSlices(),
    getBudgetModuleData(),
  ]);

  const primaryCards = [
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
      title: "Actual Cash",
      value: formatMoney(statement.endingBalance),
      icon: BanknoteIcon,
    },
  ];

  const secondaryCards = [
    {
      title: "Remaining Budget",
      value: formatMoney(budget.totals.remaining),
      icon: PiggyBankIcon,
    },
    {
      title: "Net Cash Flow",
      value: formatMoney(statement.netCashFlow),
      icon: ScaleIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeading
        title="Administrator Dashboard"
        description={`Overall financial summary for ${profile.first_name}: collected income, budget usage, and actual cash. Expenses use budget and reduce cash — they do not deduct from income.`}
        icon={LayoutDashboardIcon}
      />

      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-3">
          {primaryCards.map((card) => (
            <SummaryStatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
            />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {secondaryCards.map((card) => (
            <SummaryStatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              variant="secondary"
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <CashFlowLineChart data={daily} className="xl:col-span-3" />

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
            Statement of Cash Flows for the current month. Open Cash Flow for
            line-item detail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowStatementView
            statement={statement}
            compact
            fullHref="/administrator/cash-flow"
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
