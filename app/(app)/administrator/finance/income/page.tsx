import { HeartHandshakeIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { loadReceiveIncome } from "@/lib/treasurer/receive-income";
import { formatMoney, toNumber } from "@/lib/format";
import { loadIncomeCategories } from "@/lib/income-categories-server";
import { getIncomeCategoryIcon } from "@/components/income-category-icon";
import { FinancePageHeader } from "@/components/administrator/finance-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminIncomeMonitoringPage() {
  await requireAdmin();
  const incomeCategories = await loadIncomeCategories();
  const datasets = await Promise.all(
    incomeCategories.map(async (category) => {
      const data = await loadReceiveIncome(category.code);
      const total = data.rows.reduce(
        (sum, row) => sum + toNumber(row.amount),
        0
      );
      return { ...category, ...data, total };
    })
  );
  const incomeTotal = datasets.reduce((sum, item) => sum + item.total, 0);

  const cards = [
    ...datasets.map((item) => ({
      title: `Total ${item.name}`,
      value: formatMoney(item.total),
      icon: getIncomeCategoryIcon(item.code, item.name),
    })),
    {
      title: "Total Income",
      value: formatMoney(incomeTotal),
      icon: HeartHandshakeIcon,
    },
  ];

  return (
    <div className="space-y-4">
      <FinancePageHeader
        title="Income"
        description="Totals for every income category configured in Categories."
        icon={HeartHandshakeIcon}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} size="sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {datasets.map((item) => {
        return (
          <Card key={item.code} size="sm">
            <CardContent className="px-3 py-0">
              <DonationManager
                categoryCode={item.code}
                categoryName={item.name}
                donations={item.rows}
                categories={item.categories}
                defaultCategoryId={item.categories[0]?.category_id}
                title={item.name}
                canEdit
                canDelete
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
