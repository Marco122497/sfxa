import type { LucideIcon } from "lucide-react";

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
  return <PageHeading title={title} description={description} icon={icon} />;
}
