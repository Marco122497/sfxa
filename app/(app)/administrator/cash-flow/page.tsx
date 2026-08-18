import { WalletIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import {
  getCashFlowStatement,
  getDailyCashFlow,
} from "@/lib/cash-flow";
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

export default async function AdminCashFlowPage() {
  await requireAdmin();
  const [statement, daily] = await Promise.all([
    getCashFlowStatement(),
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
            Generated from treasurer receive and release transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowStatementView statement={statement} />
        </CardContent>
      </Card>
    </div>
  );
}
