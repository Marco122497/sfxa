import { notFound } from "next/navigation";

import { requireTreasurer } from "@/lib/auth/session";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import {
  isDonationLike,
  resolveIncomeCategory,
} from "@/lib/income-categories";
import { loadIncomeCategories } from "@/lib/income-categories-server";
import { getIncomeCategoryIcon } from "@/components/income-category-icon";
import { TreasurerPageHeader } from "@/components/treasurer/treasurer-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import { ReceivePendingDonations } from "@/components/treasurer/receive-pending-donations";
import { Card, CardContent } from "@/components/ui/card";

export default async function TreasurerReceiveKindPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  await requireTreasurer();
  const { kind } = await params;
  const incomeCategories = await loadIncomeCategories();
  const meta = resolveIncomeCategory(incomeCategories, kind);
  if (!meta) notFound();

  const withPending = isDonationLike(meta.code, meta.name);
  const { categories, rows: mapped } = await loadReceiveIncome(kind, {
    withStatus: withPending,
  });
  const pending = withPending
    ? mapped.filter((row) => row.status === "pending")
    : [];
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
          "Record cash inflow for this income category. Select the type created by the Administrator."
        }
        icon={CategoryIcon}
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
            categoryCode={meta.code}
            categoryName={meta.name}
            donations={rows}
            categories={categories}
            defaultCategoryId={categories[0]?.category_id}
            title={meta.name}
          />
        </CardContent>
      </Card>
    </div>
  );
}
