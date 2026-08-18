import Link from "next/link";
import {
  ArrowRightIcon,
  BanknoteIcon,
  LayoutDashboardIcon,
  ScaleIcon,
  WalletCardsIcon,
  WalletIcon,
} from "lucide-react";

import { requireParishOfficer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCashFlowStatement } from "@/lib/cash-flow";
import { formatDateTime } from "@/lib/auth/roles";
import { formatMoney } from "@/lib/format";
import {
  isParishContentKind,
  stripParishPrefix,
} from "@/lib/parish-content";
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
  const [statement, { data: announcements }] = await Promise.all([
    getCashFlowStatement(),
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
          Welcome, {profile.first_name}. View-only financial summaries and
          parish information.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collections
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold tracking-tight">
              {formatMoney(statement.totalInflows)}
            </div>
            <BanknoteIcon className="size-4 text-muted-foreground" />
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
              Net Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold tracking-tight">
              {formatMoney(statement.netCashFlow)}
            </div>
            <ScaleIcon className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ending Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold tracking-tight">
              {formatMoney(statement.endingBalance)}
            </div>
            <WalletIcon className="size-4 text-muted-foreground" />
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

      <Card>
        <CardHeader>
          <CardTitle>Financial Transparency</CardTitle>
          <CardDescription>
            Approved, non-confidential summaries. Members cannot edit records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            {
              href: "/parish-officer/transparency/summary",
              title: "Financial Summary",
            },
            {
              href: "/parish-officer/transparency/cash-flow",
              title: "Cash Flow Summary",
            },
            {
              href: "/parish-officer/transparency/statements",
              title: "Approved Statements",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto w-full justify-between px-3 py-2.5"
              )}
            >
              <span>{item.title}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                View
                <ArrowRightIcon className="size-4" />
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
