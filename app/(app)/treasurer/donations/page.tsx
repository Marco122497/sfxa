import { requireTreasurer } from "@/lib/auth/session";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import { HandCoinsIcon } from "lucide-react";

import { TreasurerPageHeader } from "@/components/treasurer/treasurer-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import { ReceivePendingDonations } from "@/components/treasurer/receive-pending-donations";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default async function TreasurerDonationsPage() {
  await requireTreasurer();
  const { categories, rows: mapped } = await loadReceiveIncome("donation", {
    withStatus: true,
  });

  const pending = mapped.filter((row) => row.status === "pending");
  const rows = mapped.filter((row) => row.status !== "pending");

  return (
    <div className="space-y-4">
      <TreasurerPageHeader
        title="Receive Donations"
        description="Verify online donations and record donations as cash inflow. Select the donation type created by the Administrator."
        icon={HandCoinsIcon}
      />
      {pending.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <ReceivePendingDonations rows={pending} />
          </CardContent>
        </Card>
      ) : null}
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <DonationManager
            donations={rows}
            categories={categories}
            title="Donation history"
          />
        </CardContent>
      </Card>
    </div>
  );
}
