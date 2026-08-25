import { WalletIcon } from "lucide-react";

import { requireParishOfficer } from "@/lib/auth/session";
import { resolveReportDateRange } from "@/lib/reports";
import { getCashFlowStatement, getDailyCashFlow } from "@/lib/cash-flow";
import { CashFlowDateFilter } from "@/components/finance/cash-flow-filters";
import { CashFlowLineChart } from "@/components/finance/cash-flow-charts";
import { CashFlowStatementView } from "@/components/finance/cash-flow-statement-view";
import { ParishViewPageHeader } from "@/components/parish-officer/parish-view-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ParishCashFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireParishOfficer();
  const { from, to } = resolveReportDateRange(await searchParams);
  const [statement, daily] = await Promise.all([
    getCashFlowStatement({ from, to }),
    getDailyCashFlow(),
  ]);

  return (
    <div className="space-y-6">
      <ParishViewPageHeader
        title="Cash Flow"
        description="Approved Statement of Cash Flows. View-only."
        icon={WalletIcon}
      />
      <CashFlowLineChart data={daily} title="Cash flow" />
      <Card>
        <CardHeader>
          <CardTitle>Statement of Cash Flows</CardTitle>
          <CardDescription>
            Beginning balance, inflows, outflows, net cash flow, and ending
            balance for the selected dates.
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
