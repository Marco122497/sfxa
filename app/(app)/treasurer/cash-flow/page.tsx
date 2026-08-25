import { WalletIcon } from "lucide-react";

import { requireTreasurer } from "@/lib/auth/session";
import { resolveReportDateRange } from "@/lib/reports";
import {
  getCashFlowStatement,
  getDailyCashFlow,
} from "@/lib/cash-flow";
import { CashFlowDateFilter } from "@/components/finance/cash-flow-filters";
import { CashFlowLineChart } from "@/components/finance/cash-flow-charts";
import { CashFlowStatementView } from "@/components/finance/cash-flow-statement-view";
import { TreasurerPageHeader } from "@/components/treasurer/treasurer-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TreasurerCashFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireTreasurer();
  const { from, to } = resolveReportDateRange(await searchParams);
  const [statement, daily] = await Promise.all([
    getCashFlowStatement({ from, to }),
    getDailyCashFlow(),
  ]);

  return (
    <div className="space-y-6">
      <TreasurerPageHeader
        title="Cash Flow"
        description="Beginning balance, inflows, outflows, net cash flow, and ending cash balance."
        icon={WalletIcon}
      />
      <CashFlowLineChart data={daily} title="Cash flow" />
      <Card>
        <CardHeader>
          <CardTitle>Statement of Cash Flows</CardTitle>
          <CardDescription>
            Generated from receive and release transactions for the selected
            dates.
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
