import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  WalletIcon,
} from "lucide-react";

import { requireTreasurer } from "@/lib/auth/session";
import { getTreasurerDashboardData } from "@/lib/treasurer/dashboard";
import { formatDateTime } from "@/lib/auth/roles";
import { formatDate, formatMoney } from "@/lib/format";
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

export default async function TreasurerDashboardPage() {
  const { profile } = await requireTreasurer();
  const { stats, recentTransactions, announcements } =
    await getTreasurerDashboardData();

  const cards = [
    {
      title: "Today's Collection",
      value: formatMoney(stats.todaysCollection),
      icon: BanknoteIcon,
    },
    {
      title: "Monthly Income",
      value: formatMoney(stats.monthlyIncome),
      icon: ArrowUpRightIcon,
    },
    {
      title: "Monthly Expenses",
      value: formatMoney(stats.monthlyExpenses),
      icon: ArrowDownRightIcon,
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
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Treasurer Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {profile.first_name}. Track collections, expenses, and
          budget usage.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest donations and expenses you and the parish recorded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions yet. Add donations or expenses to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {tx.label}
                    </TableCell>
                    <TableCell>{formatDate(tx.date)}</TableCell>
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
          <CardDescription>
            Latest published parish announcements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No published announcements yet.
            </p>
          ) : (
            announcements.map((item) => (
              <div
                key={item.announcement_id}
                className="border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(item.published_at || item.created_at)}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {item.content}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
