import { WalletIcon } from "lucide-react";

import { requireParishOfficer } from "@/lib/auth/session";
import { getCashFlowStatement } from "@/lib/cash-flow";
import { CashFlowStatementView } from "@/components/finance/cash-flow-statement-view";
import { ParishViewPageHeader } from "@/components/parish-officer/parish-view-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ParishCashFlowPage() {
  await requireParishOfficer();
  const statement = await getCashFlowStatement();

  return (
    <div className="space-y-6">
      <ParishViewPageHeader
        title="Cash Flow"
        description="Approved Statement of Cash Flows. View-only."
        icon={WalletIcon}
      />
      <Card>
        <CardHeader>
          <CardTitle>Statement of Cash Flows</CardTitle>
          <CardDescription>
            Beginning balance, inflows, outflows, net cash flow, and ending balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowStatementView statement={statement} />
        </CardContent>
      </Card>
    </div>
  );
}
