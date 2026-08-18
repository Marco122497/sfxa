import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import {
  isReservedFinanceKind,
  resolveIncomeCategory,
} from "@/lib/income-categories";
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
  await requireAdmin();
  const { kind } = await params;

  if (isReservedFinanceKind(kind)) {
    notFound();
  }

  const incomeCategories = await loadIncomeCategories();
  const meta = resolveIncomeCategory(incomeCategories, kind);
  if (!meta) notFound();

  const { categories, rows } = await loadReceiveIncome(kind);
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
