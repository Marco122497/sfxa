import { HeartHandshakeIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import { FinancePageHeader } from "@/components/administrator/finance-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminIncomeMonitoringPage() {
  await requireAdmin();
  const { categories, rows } = await loadReceiveIncome([
    "church_service",
    "other_income",
  ]);

  return (
    <div className="space-y-4">
      <FinancePageHeader
        title="Income"
        description="Monitor church service income and other receipts. Types come from Categories → Income Services."
        icon={HeartHandshakeIcon}
      />
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <DonationManager
            donations={rows}
            categories={categories}
            title="Church services and other income"
            emptyMessage="No church service or other income records yet."
            canEdit
            canDelete
          />
        </CardContent>
      </Card>
    </div>
  );
}
