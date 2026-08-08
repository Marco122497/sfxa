import Link from "next/link";
import {
  BanknoteIcon,
  CalendarIcon,
  FileTextIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  ShoppingBasketIcon,
  WalletCardsIcon,
} from "lucide-react";

import { requireParishOfficer } from "@/lib/auth/session";
import { getParishOfficerDashboardData } from "@/lib/parish-officer/dashboard";
import { PARISH_REPORT_TYPES } from "@/lib/reports";
import { formatDate, formatMoney } from "@/lib/format";
import {
  IncomeSourcesPieChart,
  MonthlyIncomeExpenseBarChart,
} from "@/components/parish-officer/dashboard-charts";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default async function ParishOfficerDashboardPage() {
  const { profile } = await requireParishOfficer();
  const {
    stats,
    monthlySummary,
    incomeSources,
    recentFinancialSummary,
  } = await getParishOfficerDashboardData();

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
      title: "Current Budget Utilization",
      value: `${stats.budgetUtilizationPct}%`,
      description:
        stats.totalBudget > 0
          ? `${formatMoney(stats.budgetSpent)} of ${formatMoney(stats.totalBudget)}`
          : "No budget allocated",
      icon: CalendarIcon,
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
            Parish Officer Dashboard
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {profile.first_name}. Read-only overview of parish
          finances and approved reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
            <CardTitle>Monthly Financial Overview</CardTitle>
            <CardDescription>
              Income (donations + collections) vs expenses by month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyIncomeExpenseBarChart data={monthlySummary} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
            <CardDescription>
              Where parish income comes from.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeSourcesPieChart data={incomeSources} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Recent Financial Summary</CardTitle>
            <CardDescription>
              Summarized recent parish financial activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentFinancialSummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No financial activity recorded yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFinancialSummary.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell className="max-w-[260px] truncate">
                        {row.activity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              View-only access to approved financial reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {PARISH_REPORT_TYPES.map((report) => (
              <Link
                key={report.id}
                href={`/parish-officer/reports?type=${report.id}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto w-full justify-start gap-2 px-3 py-2.5"
                )}
              >
                <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-left">
                  {report.id === "summary"
                    ? "Financial Summary Report"
                    : report.label}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
