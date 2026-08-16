import Link from "next/link";
import { FileTextIcon } from "lucide-react";

import { requireParishOfficer } from "@/lib/auth/session";
import { getCashFlowStatement } from "@/lib/cash-flow";
import { CashFlowStatementView } from "@/components/finance/cash-flow-statement-view";
import { ParishViewPageHeader } from "@/components/parish-officer/parish-view-page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function ParishStatementsPage() {
  await requireParishOfficer();
  const statement = await getCashFlowStatement();

  return (
    <div className="space-y-6">
      <ParishViewPageHeader
        title="Approved Statements"
        description="View-only parish statements generated from treasurer records."
        icon={FileTextIcon}
      />
      <Card>
        <CardHeader>
          <CardTitle>Statement of Cash Flows</CardTitle>
          <CardDescription>Current month summary.</CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowStatementView
            statement={statement}
            compact
            fullHref="/parish-officer/cash-flow"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Other summaries</CardTitle>
          <CardDescription>Open the approved report for more detail.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href="/parish-officer/reports?type=summary"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Income / Collection Summary
          </Link>
          <Link
            href="/parish-officer/reports?type=expenses"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Expense Summary
          </Link>
          <Link
            href="/parish-officer/budget"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Budget Summary
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
