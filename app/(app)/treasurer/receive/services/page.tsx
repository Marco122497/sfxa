import { HeartHandshakeIcon } from "lucide-react";

import { requireTreasurer } from "@/lib/auth/session";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import { TreasurerPageHeader } from "@/components/treasurer/treasurer-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import { Card, CardContent } from "@/components/ui/card";

export default async function TreasurerChurchServicesPage() {
  await requireTreasurer();
  const { categories, rows } = await loadReceiveIncome("church_service");

  return (
    <div className="space-y-4">
      <TreasurerPageHeader
        title="Receive Church Services"
        description="Record baptism, wedding, funeral, and other church service income as cash inflow. Select the service created by the Administrator."
        icon={HeartHandshakeIcon}
      />
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <DonationManager
            donations={rows}
            categories={categories}
            defaultCategoryId={categories[0]?.category_id}
            title="Church service receipts"
            emptyMessage="No church service receipts yet. Ask the Administrator to add services such as Baptism or Wedding, then record them here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
