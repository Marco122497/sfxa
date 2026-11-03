"use client";

import { useServerAction } from "@/hooks/use-refresh-on-success";
import { Loader2 } from "lucide-react";

import {
  receiveOnlineDonation,
  type ReceiveDonationState,
} from "@/app/actions/receive-funds";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RowActionsDialog } from "@/components/layout/row-actions-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initialState: ReceiveDonationState = {};

export type PendingDonation = {
  donation_id: number;
  donor_name: string | null;
  amount: number | string;
  donation_date: string;
  remarks: string | null;
  category_name: string | null;
};

export function ReceivePendingDonations({
  rows,
  suggestedOrNumber = "",
  transactionLimit = 0,
  allowOverLimit = false,
}: {
  rows: PendingDonation[];
  suggestedOrNumber?: string;
  transactionLimit?: number;
  allowOverLimit?: boolean;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium">Payments waiting for an OR number</h2>
      <p className="text-sm text-muted-foreground">
        These walk-in payments still need an official receipt number.
        {suggestedOrNumber ? ` Next OR number: ${suggestedOrNumber}.` : ""}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Donor</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <PendingRow
              key={row.donation_id}
              row={row}
              suggestedOrNumber={suggestedOrNumber}
              transactionLimit={transactionLimit}
              allowOverLimit={allowOverLimit}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PendingRow({
  row,
  suggestedOrNumber,
  transactionLimit,
  allowOverLimit,
}: {
  row: PendingDonation;
  suggestedOrNumber: string;
  transactionLimit: number;
  allowOverLimit: boolean;
}) {
  const [state, formAction, pending] = useServerAction(receiveOnlineDonation, initialState);
  const overLimit =
    !allowOverLimit &&
    transactionLimit > 0 &&
    Math.round(toNumber(row.amount) * 100) > Math.round(transactionLimit * 100);

  return (
    <TableRow>
      <TableCell>{formatDate(row.donation_date)}</TableCell>
      <TableCell>{row.donor_name || "—"}</TableCell>
      <TableCell>{row.category_name || "—"}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatMoney(row.amount)}
      </TableCell>
      <TableCell className="text-right">
        {state.error ? (
          <p className="mb-1 text-xs text-destructive">{state.error}</p>
        ) : null}
        <RowActionsDialog
          label={`${row.donor_name || "Donation"} · ${formatMoney(row.amount)}`}
        >
          {overLimit ? (
            <p className="max-w-48 text-xs text-destructive">
              Above the limit of {formatMoney(transactionLimit)}. An
              administrator must receive this payment.
            </p>
          ) : (
            <form action={formAction} className="space-y-2">
              <input type="hidden" name="donation_id" value={row.donation_id} />
              <div className="space-y-1 text-left">
                <Label htmlFor={`or-${row.donation_id}`}>OR number</Label>
                <Input
                  id={`or-${row.donation_id}`}
                  name="or_number"
                  required
                  maxLength={40}
                  defaultValue={suggestedOrNumber}
                  placeholder={suggestedOrNumber || "OR number"}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={pending}
                aria-label="Receive donation"
              >
                {pending ? <Loader2 className="animate-spin" /> : null}
                Receive
              </Button>
            </form>
          )}
        </RowActionsDialog>
      </TableCell>
    </TableRow>
  );
}
