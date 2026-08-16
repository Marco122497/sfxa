import { HandCoinsIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import { FinancePageHeader } from "@/components/administrator/finance-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminDonationsPage() {
  await requireAdmin();
  const { categories, rows } = await loadReceiveIncome("donation");

  return (
    <div className="space-y-4">
      <FinancePageHeader
        title="Donations"
        description="Monitor donation records. Donation types come from Categories → Income Services."
        icon={HandCoinsIcon}
      />
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <DonationManager
            donations={rows}
            categories={categories}
            title="Donation history"
            canEdit
            canDelete
          />
        </CardContent>
      </Card>
    </div>
  );
}
