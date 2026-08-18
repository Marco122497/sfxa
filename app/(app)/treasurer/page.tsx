import Link from "next/link";
import {
  ArrowRightIcon,
  BanknoteIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  ShoppingBasketIcon,
  WalletCardsIcon,
  WalletIcon,
} from "lucide-react";

import { requireTreasurer } from "@/lib/auth/session";
import { getTreasurerDashboardData } from "@/lib/treasurer/dashboard";
import { formatDate, formatMoney } from "@/lib/format";
import {
  DailyIncomeLineChart,
  ExpenseDistributionPieChart,
} from "@/components/treasurer/dashboard-charts";
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

export default async function TreasurerDashboardPage() {
  const { profile } = await requireTreasurer();
  const {
    stats,
    dailyIncome,
    expensesByCategory,
    recentTransactions,
    budgetStatus,
  } = await getTreasurerDashboardData();

  const cards = [
    {
      title: "Today's Donations",
      value: formatMoney(stats.todaysDonations),
      icon: HandCoinsIcon,
    },
    {
      title: "Today's Collections",
      value: formatMoney(stats.todaysCollections),
      icon: ShoppingBasketIcon,
    },
    {
      title: "Today's Expenses",
      value: formatMoney(stats.todaysExpenses),
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
            <LayoutDashboardIcon className="size-4" aria-hidden />
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            Treasurer Dashboard
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome, {profile.first_name}. Receive, release, and record parish
          finances.
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Daily Income Trend</CardTitle>
            <CardDescription>
              Donations and collections by day for the current week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DailyIncomeLineChart data={dailyIncome} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
            <CardDescription>
              Where recorded expenses have been spent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseDistributionPieChart data={expensesByCategory} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest donations, collections, and expenses.
              </CardDescription>
            </div>
            <Link
              href="/treasurer/reports"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View All
              <ArrowRightIcon />
            </Link>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions yet. Add donations, collections, or expenses to
                get started.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.date)}</TableCell>
                      <TableCell>{tx.transaction}</TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {tx.category}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(tx.amount)}
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
            <CardTitle>Budget Status</CardTitle>
            <CardDescription>
              Used vs remaining by category for {new Date().getFullYear()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgetStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No budget allocations for this year yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetStatus.map((row) => (
                    <TableRow key={row.category}>
                      <TableCell className="max-w-[140px] truncate font-medium">
                        {row.category}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.used)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.remaining)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
