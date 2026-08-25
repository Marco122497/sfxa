"use client";

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { formatDate, formatMoney } from "@/lib/format";
import type { CashFlowBreakdown, CashFlowStatement } from "@/lib/cash-flow";
import { buttonVariants } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function AmountCell({ amount, className }: { amount: number; className?: string }) {
  return (
    <TableCell className={cn("text-right tabular-nums", className)}>
      {formatMoney(amount)}
    </TableCell>
  );
}

function InflowRow({ row }: { row: CashFlowBreakdown }) {
  const items = row.items ?? [];

  if (items.length === 0) {
    return (
      <TableRow>
        <TableCell className="pl-6 text-muted-foreground">{row.label}</TableCell>
        <AmountCell amount={row.amount} />
      </TableRow>
    );
  }

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={2} className="p-0">
        <Collapsible className="group/inflow">
          <CollapsibleTrigger className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-muted/40">
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[open]/inflow:rotate-90" />
            <span className="text-muted-foreground">{row.label}</span>
            <span className="ml-auto tabular-nums">{formatMoney(row.amount)}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2 py-1.5 pr-2 pl-10 text-muted-foreground"
              >
                <span>{item.label}</span>
                <span className="tabular-nums">{formatMoney(item.amount)}</span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </TableCell>
    </TableRow>
  );
}

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
            <AmountCell amount={statement.beginningBalance} />
          </TableRow>
          {!compact
            ? statement.inflows.map((row) => (
                <InflowRow key={row.label} row={row} />
              ))
            : null}
          <TableRow>
            <TableCell className="font-medium">Total Cash Inflows</TableCell>
            <AmountCell
              amount={statement.totalInflows}
              className="font-medium"
            />
          </TableRow>
          {!compact
            ? statement.outflows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="pl-6 text-muted-foreground">
                    {row.label}
                  </TableCell>
                  <AmountCell amount={row.amount} />
                </TableRow>
              ))
            : null}
          <TableRow>
            <TableCell className="font-medium">Total Cash Outflows</TableCell>
            <AmountCell
              amount={statement.totalOutflows}
              className="font-medium"
            />
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Net Cash Flow</TableCell>
            <AmountCell amount={statement.netCashFlow} className="font-medium" />
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Ending Cash Balance</TableCell>
            <AmountCell
              amount={statement.endingBalance}
              className="font-semibold"
            />
          </TableRow>
        </TableBody>
      </Table>
      {fullHref ? (
        <Link href={fullHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          View cash flow
        </Link>
      ) : null}
    </div>
  );
}
