import { WalletIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { resolveReportDateRange } from "@/lib/reports";
import {
  getCashFlowStatement,
  getDailyCashFlow,
} from "@/lib/cash-flow";
import { CashFlowDateFilter } from "@/components/finance/cash-flow-filters";
import { CashFlowLineChart } from "@/components/finance/cash-flow-charts";
import { CashFlowStatementView } from "@/components/finance/cash-flow-statement-view";
import { PageHeading } from "@/components/layout/page-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminCashFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdmin();
  const { from, to } = resolveReportDateRange(await searchParams);
  const [statement, daily] = await Promise.all([
    getCashFlowStatement({ from, to }),
    getDailyCashFlow(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Cash Flow"
        description="Consolidated parish cash inflows, outflows, net cash flow, and ending balance."
        icon={WalletIcon}
      />
      <CashFlowLineChart data={daily} title="Cash flow" />
      <Card>
        <CardHeader>
          <CardTitle>Consolidated Statement of Cash Flows</CardTitle>
          <CardDescription>
            Generated from treasurer receive and release transactions for the
            selected dates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CashFlowDateFilter from={from} to={to} />
          <CashFlowStatementView statement={statement} />
        </CardContent>
      </Card>
    </div>
  );
}
