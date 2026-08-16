import { ShoppingBasketIcon } from "lucide-react";
import { requireTreasurer } from "@/lib/auth/session";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import { TreasurerPageHeader } from "@/components/treasurer/treasurer-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default async function TreasurerCollectionsPage() {
  await requireTreasurer();
  const { categories, rows } = await loadReceiveIncome("collection");

  return (
    <div className="space-y-4">
      <TreasurerPageHeader
        title="Receive Collections / Offerings"
        description="Record Sunday, special, chapel, and other collections as cash inflow. Select the collection type created by the Administrator."
        icon={ShoppingBasketIcon}
      />
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <DonationManager
            mode="collection"
            donations={rows.map((row) => ({ ...row, donor_name: null }))}
            categories={categories}
            defaultCategoryId={categories[0]?.category_id}
            title="Collection history"
            emptyMessage="No collection entries yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
