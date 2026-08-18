import Link from "next/link";
import {
  BanknoteIcon,
  LayoutDashboardIcon,
  WalletCardsIcon,
  WalletIcon,
} from "lucide-react";

import { requireParishOfficer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCashFlowStatement, getDailyCashFlow, getIncomeServiceCategorySlices } from "@/lib/cash-flow";
import { formatDateTime } from "@/lib/auth/roles";
import { formatMoney } from "@/lib/format";
import {
  isParishContentKind,
  stripParishPrefix,
} from "@/lib/parish-content";
import {
  CashFlowLineChart,
  IncomeSourcesPieChart,
} from "@/components/finance/cash-flow-charts";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function ParishOfficerDashboardPage() {
  const { profile } = await requireParishOfficer();
  const supabase = await createClient();
  const [statement, daily, services, { data: announcements }] =
    await Promise.all([
      getCashFlowStatement(),
      getDailyCashFlow(),
      getIncomeServiceCategorySlices(),
      supabase
      .from("announcements")
      .select("announcement_id, title, published_at, created_at, content")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(8),
  ]);

  const items = announcements ?? [];
  const activities = items.filter((row) =>
    isParishContentKind(row.title, "activity")
  );
  const notices = items.filter((row) =>
    isParishContentKind(row.title, "notice")
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
            <LayoutDashboardIcon className="size-4" aria-hidden />
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            Saint Francis Xavier Parish
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome, {profile.first_name}. Income stays collected. Expenses use
          budget and reduce actual cash.
        </p>
      </div>

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
            <CardTitle>Income Service Categories</CardTitle>
            <CardDescription>
              Amounts collected by each income service type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeSourcesPieChart data={services} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Activities</CardTitle>
            <CardDescription>Published by the Administrator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activities yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {activities.slice(0, 3).map((item) => (
                  <li key={item.announcement_id}>
                    <p className="font-medium">{stripParishPrefix(item.title)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(item.published_at ?? item.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/parish-officer/activities"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View activities
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Parish Notices</CardTitle>
            <CardDescription>Published by the Administrator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {notices.slice(0, 3).map((item) => (
                  <li key={item.announcement_id}>
                    <p className="font-medium">{stripParishPrefix(item.title)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(item.published_at ?? item.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/parish-officer/notices"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View notices
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
