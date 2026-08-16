import Link from "next/link";

import { formatDate, formatMoney } from "@/lib/format";
import type { CashFlowStatement } from "@/lib/cash-flow";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function CashFlowStatementView({
  statement,
  fullHref,
  compact = false,
}: {
  statement: CashFlowStatement;
  fullHref?: string;
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {formatDate(statement.from)} – {formatDate(statement.to)}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Particulars</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Beginning Cash Balance</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(statement.beginningBalance)}
            </TableCell>
          </TableRow>
          {!compact
            ? statement.inflows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="pl-6 text-muted-foreground">
                    {row.label}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(row.amount)}
                  </TableCell>
                </TableRow>
              ))
            : null}
          <TableRow>
            <TableCell className="font-medium">Total Cash Inflows</TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatMoney(statement.totalInflows)}
            </TableCell>
          </TableRow>
          {!compact
            ? statement.outflows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="pl-6 text-muted-foreground">
                    {row.label}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(row.amount)}
                  </TableCell>
                </TableRow>
              ))
            : null}
          <TableRow>
            <TableCell className="font-medium">Total Cash Outflows</TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatMoney(statement.totalOutflows)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Net Cash Flow</TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatMoney(statement.netCashFlow)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Ending Cash Balance</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatMoney(statement.endingBalance)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {fullHref ? (
        <Link href={fullHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          View Full Statement
        </Link>
      ) : null}
    </div>
  );
}
