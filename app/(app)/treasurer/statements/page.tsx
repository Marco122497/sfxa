import { FileTextIcon } from "lucide-react";

import { requireTreasurer } from "@/lib/auth/session";
import { getCashFlowStatement } from "@/lib/cash-flow";
import { CashFlowStatementView } from "@/components/finance/cash-flow-statement-view";
import { TreasurerPageHeader } from "@/components/treasurer/treasurer-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TreasurerStatementsPage() {
  await requireTreasurer();
  const statement = await getCashFlowStatement();

  return (
    <div className="space-y-6">
      <TreasurerPageHeader
        title="Financial Statements"
        description="Parish Statement of Cash Flows for the current month."
        icon={FileTextIcon}
      />
      <Card>
        <CardHeader>
          <CardTitle>Statement of Cash Flows</CardTitle>
          <CardDescription>
            Cash receipts, expenses, net cash flow, and ending cash balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowStatementView statement={statement} />
        </CardContent>
      </Card>
    </div>
  );
}
