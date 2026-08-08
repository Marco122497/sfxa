import type { LucideIcon } from "lucide-react";

import { CategoryNav } from "@/components/administrator/category-nav";
import { PageHeading } from "@/components/layout/page-heading";

export function CategoryPageHeader({
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
      <CategoryNav />
    </div>
  );
}
