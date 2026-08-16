import { WalletIcon } from "lucide-react";

import { requireTreasurer } from "@/lib/auth/session";
import {
  getCashFlowStatement,
  getMonthlyCashFlow,
} from "@/lib/cash-flow";
import { CashFlowBarChart } from "@/components/finance/cash-flow-charts";
import { CashFlowStatementView } from "@/components/finance/cash-flow-statement-view";
import { TreasurerPageHeader } from "@/components/treasurer/treasurer-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TreasurerCashFlowPage() {
  await requireTreasurer();
  const [statement, monthly] = await Promise.all([
    getCashFlowStatement(),
    getMonthlyCashFlow(),
  ]);

  return (
    <div className="space-y-6">
      <TreasurerPageHeader
        title="Cash Flow"
        description="Beginning balance, inflows, outflows, net cash flow, and ending cash balance."
        icon={WalletIcon}
      />
      <Card>
        <CardHeader>
          <CardTitle>Monthly cash flow</CardTitle>
          <CardDescription>Inflow, outflow, and net by month.</CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowBarChart data={monthly} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Statement of Cash Flows</CardTitle>
          <CardDescription>Generated from receive and release transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowStatementView
            statement={statement}
            fullHref="/treasurer/statements"
          />
        </CardContent>
      </Card>
    </div>
  );
}
