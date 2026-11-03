import { notFound, redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import { isDonationLike, resolveIncomeCategory } from "@/lib/income-categories";
import { nextOfficialReceiptNumber } from "@/lib/payments";
import { getTransactionLimit } from "@/lib/parish-settings";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import { loadIncomeCategories } from "@/lib/income-categories-server";
import { getIncomeCategoryIcon } from "@/components/income-category-icon";
import { FinancePageHeader } from "@/components/administrator/finance-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminFinanceKindPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { supabase } = await requireAdmin();
  const [transactionLimit, suggestedOrNumber] = await Promise.all([
    getTransactionLimit(supabase),
    nextOfficialReceiptNumber(supabase),
  ]);
  const { kind } = await params;

  const incomeCategories = await loadIncomeCategories();
  const meta = resolveIncomeCategory(incomeCategories, kind);
  if (!meta) notFound();
  if (meta.code !== kind) {
    redirect(`/administrator/finance/${meta.code}`);
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
      <FinancePageHeader
        title={meta.name}
        description={
          meta.description ||
          "Records for this income category. Types come from Categories → Income Services."
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
            canEdit
            canDelete
            suggestedOrNumber={suggestedOrNumber}
            transactionLimit={transactionLimit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
