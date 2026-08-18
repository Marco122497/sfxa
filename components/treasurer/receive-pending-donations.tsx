"use client";

import { useServerAction } from "@/hooks/use-refresh-on-success";
import { Loader2 } from "lucide-react";

import {
  receiveOnlineDonation,
  type ReceiveDonationState,
} from "@/app/actions/receive-funds";
import { formatDate, formatMoney } from "@/lib/format";
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

export function ReceivePendingDonations({ rows }: { rows: PendingDonation[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium">Pending online donations</h2>
      <p className="text-sm text-muted-foreground">
        Verify and receive these into cash inflow. Members cannot post parish
        records directly.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Donor</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <PendingRow key={row.donation_id} row={row} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PendingRow({ row }: { row: PendingDonation }) {
  const [state, formAction, pending] = useServerAction(receiveOnlineDonation, initialState);


  return (
    <TableRow>
      <TableCell>{formatDate(row.donation_date)}</TableCell>
      <TableCell>{row.donor_name || "—"}</TableCell>
      <TableCell>{row.category_name || "—"}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatMoney(row.amount)}
      </TableCell>
      <TableCell className="text-right">
        <form action={formAction}>
          <input type="hidden" name="donation_id" value={row.donation_id} />
          {state.error ? (
            <p className="mb-1 text-xs text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Receive
          </Button>
        </form>
      </TableCell>
    </TableRow>
  );
}
