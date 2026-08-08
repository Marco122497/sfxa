import type { LucideIcon } from "lucide-react";

import { BudgetNav } from "@/components/treasurer/budget-nav";
import { PageHeading } from "@/components/layout/page-heading";

export function BudgetPageHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="space-y-3">
      <PageHeading title={title} description={description} icon={icon} />
      <BudgetNav />
    </div>
  );
}
