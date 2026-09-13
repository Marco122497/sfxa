import Link from "next/link";
import {
  BanknoteIcon,
  LayoutDashboardIcon,
  ScaleIcon,
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
import { CashFlowStatementView } from "@/components/finance/cash-flow-statement-view";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageHeading } from "@/components/layout/page-heading";
import { SummaryStatCard } from "@/components/layout/summary-stat-card";

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
      <PageHeading
        title="Saint Francis Xavier Parish"
        description={`Welcome, ${profile.first_name}. Income stays collected. Expenses use budget and reduce actual cash.`}
        icon={LayoutDashboardIcon}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStatCard
          title="Total Income"
          value={formatMoney(statement.totalInflows)}
          icon={WalletIcon}
        />
        <SummaryStatCard
          title="Total Expenses"
          value={formatMoney(statement.totalOutflows)}
          icon={WalletCardsIcon}
        />
        <SummaryStatCard
          title="Net Cash Flow"
          value={formatMoney(statement.netCashFlow)}
          icon={ScaleIcon}
        />
        <SummaryStatCard
          title="Actual Cash"
          value={formatMoney(statement.endingBalance)}
          icon={BanknoteIcon}
        />
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

      <Card>
        <CardHeader>
          <CardTitle>Statement of Cash Flows</CardTitle>
          <CardDescription>
            Beginning balance, inflows, outflows, net cash flow, and ending
            cash for the current month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowStatementView
            statement={statement}
            compact
            fullHref="/parish-officer/transparency/cash-flow"
          />
        </CardContent>
      </Card>

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
