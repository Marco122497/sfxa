import { ReceiptIcon } from "lucide-react";

import { requireParishOfficer } from "@/lib/auth/session";
import { formatDate, formatMoney } from "@/lib/format";
import {
  donationStatusLabel,
  loadMemberDonations,
} from "@/lib/parish-officer/member-donations";
import { ParishViewPageHeader } from "@/components/parish-officer/parish-view-page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function MyReceiptsPage() {
  const { supabase, user, profile } = await requireParishOfficer();
  const rows = await loadMemberDonations(supabase, user.id, profile.full_name);

  return (
    <div className="space-y-6">
      <ParishViewPageHeader
        title="My Receipts"
        description="View and print a confirmation for each online donation."
        icon={ReceiptIcon}
      />
      <Card>
        <CardContent className="pt-6">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No receipts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.donation_id}>
                    <TableCell className="font-medium">
                      SFXA-{String(row.donation_id).padStart(5, "0")}
                    </TableCell>
                    <TableCell>{formatDate(row.donation_date)}</TableCell>
                    <TableCell>{row.category_name || "Donation"}</TableCell>
                    <TableCell>
                      {donationStatusLabel(row.status, row.remarks)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
