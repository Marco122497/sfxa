import { ShoppingBasketIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import { FinancePageHeader } from "@/components/administrator/finance-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminCollectionsPage() {
  await requireAdmin();
  const { categories, rows } = await loadReceiveIncome("collection");

  return (
    <div className="space-y-4">
      <FinancePageHeader
        title="Collections"
        description="Monitor collection and offering records. Collection types come from Categories → Income Services."
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
            canEdit
            canDelete
          />
        </CardContent>
      </Card>
    </div>
  );
}
