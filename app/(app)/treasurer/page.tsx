import Link from "next/link";
import {
  ArrowRightIcon,
  BanknoteIcon,
  LayoutDashboardIcon,
  WalletCardsIcon,
  WalletIcon,
} from "lucide-react";

import { requireTreasurer } from "@/lib/auth/session";
import { getTreasurerDashboardData } from "@/lib/treasurer/dashboard";
import { getCashFlowStatement, getDailyCashFlow } from "@/lib/cash-flow";
import { formatDate, formatMoney } from "@/lib/format";
import { CashFlowLineChart } from "@/components/finance/cash-flow-charts";
import { ExpenseDistributionPieChart } from "@/components/treasurer/dashboard-charts";
import { PageHeading } from "@/components/layout/page-heading";
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
  const [
    { expensesByCategory, recentTransactions, budgetStatus },
    daily,
    statement,
  ] = await Promise.all([
    getTreasurerDashboardData(),
    getDailyCashFlow(),
    getCashFlowStatement(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Treasurer Dashboard"
        description={`Welcome, ${profile.first_name}. Collect income, allocate a budget, then record expenses. Expenses use budget and reduce cash — they do not deduct from income.`}
        icon={LayoutDashboardIcon}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold tracking-tight">
              {formatMoney(statement.totalInflows)}
            </div>
            <WalletIcon className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold tracking-tight">
              {formatMoney(statement.totalOutflows)}
            </div>
            <WalletCardsIcon className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actual Cash
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold tracking-tight">
              {formatMoney(statement.endingBalance)}
            </div>
            <BanknoteIcon className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <CashFlowLineChart data={daily} className="xl:col-span-3" />

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
              Budget used vs remaining by category. Expenses increase usage;
              they do not reduce collected income.
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
