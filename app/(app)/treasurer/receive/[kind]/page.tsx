import { notFound, redirect } from "next/navigation";

import { requireTreasurer } from "@/lib/auth/session";
import { nextOfficialReceiptNumber } from "@/lib/payments";
import { getTransactionLimit } from "@/lib/parish-settings";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import {
  isDonationLike,
  resolveIncomeCategory,
} from "@/lib/income-categories";
import { loadIncomeCategories } from "@/lib/income-categories-server";
import { getIncomeCategoryIcon } from "@/components/income-category-icon";
import { TreasurerPageHeader } from "@/components/treasurer/treasurer-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import { Card, CardContent } from "@/components/ui/card";

export default async function TreasurerReceiveKindPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { supabase } = await requireTreasurer();
  const [transactionLimit, suggestedOrNumber] = await Promise.all([
    getTransactionLimit(supabase),
    nextOfficialReceiptNumber(supabase),
  ]);
  const { kind } = await params;
  const incomeCategories = await loadIncomeCategories();
  const meta = resolveIncomeCategory(incomeCategories, kind);
  if (!meta) notFound();
  if (meta.code !== kind) {
    redirect(`/treasurer/receive/${meta.code}`);
  }

  const withPending = isDonationLike(meta.code, meta.name);
  const { categories, rows: mapped } = await loadReceiveIncome(meta.code, {
    withStatus: withPending,
  });
  const rows = withPending
    ? mapped.filter((row) => row.status !== "pending")
    : mapped;
  const CategoryIcon = getIncomeCategoryIcon(meta.code, meta.name);

  return (
    <div className="space-y-4">
      <TreasurerPageHeader
        title={`Receive ${meta.name}`}
        description={
          meta.description ||
          "Record a walk-in payment and its official receipt number."
        }
        icon={CategoryIcon}
      />
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <DonationManager
            categoryCode={meta.code}
            categoryName={meta.name}
            donations={rows}
            categories={categories}
            defaultCategoryId={categories[0]?.category_id}
            title={meta.name}
            suggestedOrNumber={suggestedOrNumber}
            transactionLimit={transactionLimit}
            enforceLimit
          />
        </CardContent>
      </Card>
    </div>
  );
}
