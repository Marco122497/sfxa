import type { LucideIcon } from "lucide-react";

import { FinanceNav } from "@/components/administrator/finance-nav";
import { PageHeading } from "@/components/layout/page-heading";

export function FinancePageHeader({
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
      <FinanceNav />
    </div>
  );
}
