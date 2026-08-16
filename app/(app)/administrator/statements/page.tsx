import { FileTextIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { getCashFlowStatement } from "@/lib/cash-flow";
import { CashFlowStatementView } from "@/components/finance/cash-flow-statement-view";
import { PageHeading } from "@/components/layout/page-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminStatementsPage() {
  await requireAdmin();
  const statement = await getCashFlowStatement();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Financial Statements"
        description="Parish Statement of Cash Flows generated from treasurer transactions."
        icon={FileTextIcon}
      />
      <Card>
        <CardHeader>
          <CardTitle>Statement of Cash Flows</CardTitle>
          <CardDescription>
            Cash receipts, disbursements, net cash flow, and ending cash balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowStatementView statement={statement} />
        </CardContent>
      </Card>
    </div>
  );
}
