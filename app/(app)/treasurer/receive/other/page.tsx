import { WalletIcon } from "lucide-react";

import { requireTreasurer } from "@/lib/auth/session";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import { TreasurerPageHeader } from "@/components/treasurer/treasurer-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import { Card, CardContent } from "@/components/ui/card";

export default async function TreasurerOtherIncomePage() {
  await requireTreasurer();
  const { categories, rows } = await loadReceiveIncome("other_income");

  return (
    <div className="space-y-4">
      <TreasurerPageHeader
        title="Receive Other Income"
        description="Record fundraising and other income as cash inflow. Select the income type created by the Administrator."
        icon={WalletIcon}
      />
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <DonationManager
            donations={rows}
            categories={categories}
            defaultCategoryId={categories[0]?.category_id}
            title="Other income receipts"
            emptyMessage="No other income receipts yet. Ask the Administrator to add types such as Fundraising, then record them here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
